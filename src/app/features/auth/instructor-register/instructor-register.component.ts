import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound, Loader2 } from 'lucide-angular';

import { AuthService, RegisterRequest } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-instructor-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './instructor-register.component.html',
  styles: [`
    /* Animations dynamiques optimisées (CPU/GPU friendly) */
    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }
    @keyframes blink-caret {
      from, to { border-right-color: transparent; }
    }
    .typing-effect {
      overflow: hidden;
      white-space: nowrap;
      animation: typing 4s steps(40, end) infinite alternate, blink-caret .75s step-end infinite;
    }
    
    @keyframes trade-bar {
      0% { transform: scaleY(0.2); }
      50% { transform: scaleY(0.85); }
      100% { transform: scaleY(0.45); }
    }
    .animate-trade-1, .animate-trade-2, .animate-trade-3, .animate-trade-4 {
      height: 100%;
      transform-origin: bottom;
      will-change: transform;
    }
    .animate-trade-1 { animation: trade-bar 3s ease-in-out infinite alternate; }
    .animate-trade-2 { animation: trade-bar 4s ease-in-out infinite alternate-reverse; }
    .animate-trade-3 { animation: trade-bar 2.5s ease-in-out infinite alternate; }
    .animate-trade-4 { animation: trade-bar 3.5s ease-in-out infinite alternate-reverse; }

    @keyframes pulse-node {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.25); filter: drop-shadow(0 0 6px currentColor); }
    }
    .neural-node {
      animation: pulse-node 2s infinite;
      transform-origin: center;
    }

    /* Désactivation des animations si l'utilisateur préfère moins de mouvements */
    @media (prefers-reduced-motion: reduce) {
      .typing-effect, .neural-node, .animate-trade-1, .animate-trade-2, .animate-trade-3, .animate-trade-4 {
        animation: none !important;
        transform: none !important;
      }
    }
  `]
})
export class InstructorRegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly icons = { Mail, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound, Loader2 };

  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  errorMessage = signal<string>('');
  isRegistrationSuccess = signal<boolean>(false);

  // Regex pour mot de passe fort
  private strongPasswordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.strongPasswordRegex)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (control.get('confirmPassword')?.hasError('mismatch')) {
        control.get('confirmPassword')?.setErrors(null);
      }
      return null;
    }
  }

  generateStrongPassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+?";
    let password = "";

    password += "A"; // 1 Majuscule
    password += "a"; // 1 Minuscule
    password += "1"; // 1 Chiffre
    password += "!"; // 1 Caractère spécial

    for (let i = 4; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Mélanger le mot de passe
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    this.registerForm.patchValue({
      password: password,
      confirmPassword: password
    });
    this.showPassword.set(true);
    this.showConfirmPassword.set(true);
  }

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
      role: 'INSTRUCTOR'
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Déconnexion immédiate car l'email n'est pas encore vérifié
        localStorage.removeItem('token');
        this.isRegistrationSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error || "Une erreur est survenue lors de l'inscription.");
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword.update(current => !current);
    } else {
      this.showConfirmPassword.update(current => !current);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}