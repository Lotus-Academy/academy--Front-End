import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { InstructorProfileService } from '../services/instructor-profile.service';

/**
 * Guard qui empêche l'accès aux routes de création/modification de cours
 * si le profil du formateur n'est pas strictement 'APPROVED'.
 */
export const instructorApprovedGuard: CanActivateFn = (route, state) => {
  const instructorProfileService = inject(InstructorProfileService);
  const router = inject(Router);

  // On interroge l'API pour connaître le statut exact du profil
  return instructorProfileService.getMyProfile().pipe(
    map(profile => {
      if (profile.approvalStatus === 'APPROVED') {
        // Le profil est validé, on autorise la navigation
        return true;
      } else {
        // Le profil est en attente, rejeté ou manquant. On redirige vers le tableau de bord.
        router.navigate(['/dashboard']);
        return false;
      }
    }),
    catchError(() => {
      // Si l'API renvoie une erreur (ex: 404, profil non créé), on bloque et on redirige
      router.navigate(['/dashboard']);
      return of(false);
    })
  );
};