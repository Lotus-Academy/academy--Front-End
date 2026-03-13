import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Gardien de route asynchrone pour la vérification de session.
 * Gère de manière proactive le rafraîchissement silencieux du token.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Le token d'accès est présent et valide : accès immédiat
  if (!authService.isTokenExpired(authService.getToken()!)) {
    return true;
  }

  // 2. Le token est expiré (ou absent). A-t-on un Refresh Token pour le sauver ?
  const refreshToken = authService.getRefreshToken();
  if (!refreshToken) {
    // Aucun moyen de rafraîchir la session, on nettoie et on redirige
    authService.logout();
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // 3. Le moment critique : on met la navigation en pause
  // On demande un nouveau token au backend AVANT de charger la page
  return authService.refreshToken().pipe(
    map(() => {
      // Succès du rafraîchissement : la route est autorisée
      return true;
    }),
    catchError(() => {
      // Échec du rafraîchissement (ex: Refresh Token révoqué ou expiré)
      // On nettoie la session de manière silencieuse et on redirige
      authService.logout();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false); // of(false) indique au router d'annuler la navigation
    })
  );
};