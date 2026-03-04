import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, CheckCircle2, ArrowLeft } from 'lucide-angular';

import { AuthService, RegisterRequest } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-instructor-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './instructor-register.component.html'
})
export class InstructorRegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly icons = { Mail, CheckCircle2, ArrowLeft };

  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');
  isRegistrationSuccess = signal<boolean>(false);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const request: RegisterRequest = {
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: 'INSTRUCTOR' // Forçage strict du rôle
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Déconnexion immédiate car l'email n'est pas encore vérifié
        this.authService.logout();
        this.isRegistrationSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error || "Une erreur est survenue lors de l'inscription.");
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}