import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Gardien de route qui vérifie si l'utilisateur possède une session valide.
 * S'il n'est pas authentifié, il est redirigé vers la page de connexion.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifie si le token existe et n'est pas expiré (méthode définie dans AuthService)
  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirection stricte vers la page de connexion
  // On peut passer l'URL que l'utilisateur essayait de joindre en paramètre 
  // pour le rediriger au bon endroit après sa connexion (optionnel)
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });

  return false;
};