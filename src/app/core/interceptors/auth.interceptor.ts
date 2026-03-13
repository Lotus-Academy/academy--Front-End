import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    let authReq = req;

    // 1. Ajouter le token d'accès (Sauf pour login/register)
    if (token && !req.url.includes('/api/v1/auth/login') && !req.url.includes('/api/v1/auth/register')) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    // 2. Envoyer la requête et intercepter les erreurs
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {

            // Si l'erreur est 401 et qu'on ne cible pas une route d'authentification
            if (error.status === 401 && !req.url.includes('/api/v1/auth/')) {

                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            isRefreshing = false;

                            // On publie le nouveau token, ce qui débloque les requêtes en attente
                            refreshTokenSubject.next(response.token);

                            return next(req.clone({
                                setHeaders: { Authorization: `Bearer ${response.token}` }
                            }));
                        }),
                        catchError((refreshError) => {
                            isRefreshing = false;

                            // OPTIMISATION : On vide le subject pour ne pas bloquer les requêtes en attente
                            refreshTokenSubject.next(null);

                            authService.logout();
                            return throwError(() => refreshError);
                        })
                    );
                } else {
                    // Les autres requêtes patientent ici
                    return refreshTokenSubject.pipe(
                        // On attend que la valeur ne soit plus nulle
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

            return throwError(() => error);
        })
    );
};