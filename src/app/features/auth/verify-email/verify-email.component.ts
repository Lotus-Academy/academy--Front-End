import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, CheckCircle2, XCircle, Loader2 } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  readonly icons = { CheckCircle2, XCircle, Loader2 };

  // 3 états possibles : LOADING (chargement), SUCCESS (valide), ERROR (invalide/expiré)
  status = signal<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');

  ngOnInit(): void {
    // Récupération du paramètre "token" dans l'URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.verifyToken(token);
      } else {
        this.status.set('ERROR');
      }
    });
  }

  private verifyToken(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('SUCCESS');
      },
      error: (err) => {
        console.error('Erreur de vérification :', err);
        this.status.set('ERROR');
      }
    });
  }
}