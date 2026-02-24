import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service'; // Ajustez le chemin

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken(); // Ou localStorage.getItem('token') selon votre implémentation

    // Si on a un token, on clone la requête pour y ajouter le header Authorization
    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    // Sinon, on laisse passer la requête telle quelle (pour le login, register, etc.)
    return next(req);
};