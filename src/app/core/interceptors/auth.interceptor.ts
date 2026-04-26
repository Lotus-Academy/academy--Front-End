import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {

    // PROTECTION ABSOLUE : S'assure que l'URL est toujours une chaîne de caractères
    const url = req.url || '';

    // =========================================================================
    // BYPASS CRITIQUE POUR S3 / CLOUDFLARE R2 ET ASSETS LOCAUX
    // Si l'URL ne contient pas '/api/v1/', ce n'est pas notre API Spring Boot.
    // On laisse passer la requête intacte (essentiel pour l'upload direct).
    // =========================================================================
    if (!url.includes('/api/v1/')) {
        return next(req);
    }

    const authService = inject(AuthService);
    const token = authService.getToken();

    let authReq = req;

    // 1. Ajouter le token d'accès (Sauf pour login/register)
    if (token && !url.includes('/api/v1/auth/login') && !url.includes('/api/v1/auth/register')) {
        authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    // 2. Envoyer la requête et intercepter les erreurs
    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {

            // Si l'erreur est 401 et qu'on ne cible pas une route d'authentification
            if (error.status === 401 && !url.includes('/api/v1/auth/')) {

                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            isRefreshing = false;
                            refreshTokenSubject.next(response.token);

                            return next(req.clone({
                                setHeaders: { Authorization: `Bearer ${response.token}` }
                            }));
                        }),
                        catchError((refreshError) => {
                            isRefreshing = false;
                            refreshTokenSubject.next(null);
                            authService.logout();
                            return throwError(() => refreshError);
                        })
                    );
                } else {
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

            return throwError(() => error);
        })
    );
};