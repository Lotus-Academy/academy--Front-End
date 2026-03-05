import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Variables globales à l'intercepteur pour gérer la concurrence
// Si plusieurs requêtes échouent en même temps à cause de l'expiration du token,
// on ne veut faire qu'un seul appel de rafraîchissement.
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // 1. Ajouter le token d'accès à la requête sortante
    let authReq = req;

    // On n'ajoute pas le token sur les routes d'authentification pour éviter les conflits
    if (token && !req.url.includes('/api/v1/auth/login') && !req.url.includes('/api/v1/auth/register')) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    // 2. Envoyer la requête et intercepter les erreurs
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {

            // Si l'erreur est 401 (Non autorisé) et qu'on ne cible pas déjà une route d'authentification
            if (error.status === 401 && !req.url.includes('/api/v1/auth/')) {

                if (!isRefreshing) {
                    // Cas A : Aucun rafraîchissement n'est en cours. On lance le processus.
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            isRefreshing = false;
                            // On notifie toutes les requêtes en attente que le nouveau token est disponible
                            refreshTokenSubject.next(response.token);

                            // On relance la requête initiale qui avait échoué, avec le nouveau token
                            return next(req.clone({
                                setHeaders: { Authorization: `Bearer ${response.token}` }
                            }));
                        }),
                        catchError((refreshError) => {
                            // Si le rafraîchissement échoue (ex: Refresh Token expiré ou invalide)
                            isRefreshing = false;
                            authService.logout(); // On force la déconnexion
                            return throwError(() => refreshError);
                        })
                    );
                } else {
                    // Cas B : Un rafraîchissement est DÉJÀ en cours via une autre requête.
                    // On met cette requête en pause jusqu'à ce que le nouveau token soit publié.
                    return refreshTokenSubject.pipe(
                        filter(newToken => newToken !== null),
                        take(1),
                        switchMap((newToken) => {
                            return next(req.clone({
                                setHeaders: { Authorization: `Bearer ${newToken}` }
                            }));
                        })
                    );
                }
            }

            // Si l'erreur n'est pas 401, on la laisse passer normalement
            return throwError(() => error);
        })
    );
};