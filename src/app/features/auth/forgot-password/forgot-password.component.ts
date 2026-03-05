import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, ArrowLeft, Mail, CheckCircle2 } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly icons = { ArrowLeft, Mail, CheckCircle2 };

  isLoading = signal<boolean>(false);
  isSubmitted = signal<boolean>(false); // Passe à true quand l'email est envoyé
  errorMessage = signal<string>('');

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const email = this.forgotForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true); // Affiche l'écran de succès
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error || "Une erreur est survenue.");
      }
    });
  }
}