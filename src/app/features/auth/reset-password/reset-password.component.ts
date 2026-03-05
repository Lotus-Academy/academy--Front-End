import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, CheckCircle2, ShieldCheck } from 'lucide-angular';

import { AuthService, ResetPasswordRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly icons = { CheckCircle2, ShieldCheck };

  isLoading = signal<boolean>(false);
  isSuccess = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');
  token = signal<string>('');

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    // Récupération du token depuis l'URL (ex: ?token=abc)
    this.route.queryParams.subscribe(params => {
      const tokenParam = params['token'];
      if (tokenParam) {
        this.token.set(tokenParam);
      } else {
        this.errorMessage.set('RESET_PASSWORD.ERRORS.MISSING_TOKEN');
      }
    });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password !== confirm) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request: ResetPasswordRequest = {
      token: this.token(),
      newPassword: this.resetForm.value.newPassword
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error || "Une erreur est survenue.");
      }
    });
  }
}