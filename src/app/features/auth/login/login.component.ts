import { Component, effect, inject, signal, untracked, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Info, Mail, Loader2, CheckCircle2, LucideAngularModule, Ticket, ShieldCheck, KeyRound } from 'lucide-angular';

import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styles: [`
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

    @media (prefers-reduced-motion: reduce) {
      .typing-effect, .neural-node, .animate-trade-1, .animate-trade-2, .animate-trade-3, .animate-trade-4 {
        animation: none !important;
        transform: none !important;
      }
    }
  `]
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly icons = { Mail, Info, Loader2, CheckCircle2, Ticket, ShieldCheck, KeyRound };

  private routeParams = toSignal(this.route.queryParams);

  readonly isLogin = computed(() => {
    const params = this.routeParams();
    return params ? params['mode'] !== 'signup' : true;
  });

  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false); // NOUVEAU
  errorMessage = signal<string>('');
  isUnverified = signal<boolean>(false);
  isRegistrationSuccess = signal<boolean>(false);

  // Regex pour mot de passe fort
  private strongPasswordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;

  //Ajout de confirmPassword et des validateurs dynamiques
  authForm: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    confirmPassword: [''],
    referredByCode: ['']
  }, { validators: this.passwordMatchValidator });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    effect(() => {
      const loginMode = this.isLogin();

      untracked(() => {
        this.updateValidators(loginMode);
        this.errorMessage.set('');
        // Réinitialiser les champs spécifiques à l'inscription si on repasse en login
        if (loginMode) {
          this.authForm.patchValue({ confirmPassword: '' });
          this.authForm.get('confirmPassword')?.markAsUntouched();
        }
      });
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const refCode = params['ref'];

      if (refCode) {
        this.authForm.patchValue({ referredByCode: refCode });

        if (params['mode'] !== 'signup') {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { mode: 'signup' },
            queryParamsHandling: 'merge',
          });
        }
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // On ne valide que si on n'est pas vide (sinon c'est 'required' qui gère)
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      if (control.get('confirmPassword')?.hasError('mismatch')) {
        control.get('confirmPassword')?.setErrors(null);
      }
      return null;
    }
  }

  toggleMode() {
    const nextMode = this.isLogin() ? 'signup' : 'login';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: nextMode },
      queryParamsHandling: 'merge',
    });
  }

  private updateValidators(isLoginMode: boolean) {
    const firstNameControl = this.authForm.get('firstName');
    const lastNameControl = this.authForm.get('lastName');
    const passwordControl = this.authForm.get('password');
    const confirmPasswordControl = this.authForm.get('confirmPassword'); // NOUVEAU

    if (isLoginMode) {
      // MODE LOGIN
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
      confirmPasswordControl?.clearValidators();
      passwordControl?.setValidators([Validators.required]);

      firstNameControl?.reset('');
      lastNameControl?.reset('');
      confirmPasswordControl?.reset('');
    } else {
      // MODE INSCRIPTION
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      confirmPasswordControl?.setValidators([Validators.required]);
      passwordControl?.setValidators([Validators.required, Validators.minLength(8), Validators.pattern(this.strongPasswordRegex)]); // NOUVEAU
    }

    firstNameControl?.updateValueAndValidity();
    lastNameControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
  }

  generateStrongPassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+?";
    let password = "A" + "a" + "1" + "!";

    for (let i = 4; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    this.authForm.patchValue({
      password: password,
      confirmPassword: password
    });
    this.showPassword.set(true);
    this.showConfirmPassword.set(true);
  }

  onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.isLogin()) {
      this.performLogin();
    } else {
      this.performSignup();
    }
  }

  private performLogin() {
    const formValues = this.authForm.getRawValue();
    const request: LoginRequest = {
      email: formValues.email,
      password: formValues.password
    };

    this.authService.login(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);

        const errorMsg = err.error?.message?.toLowerCase() || '';

        if (err.status === 403 || errorMsg.includes('disabled') || errorMsg.includes('verif')) {
          this.isUnverified.set(true);
          this.errorMessage.set('');
        } else {
          this.isUnverified.set(false);
          this.errorMessage.set('LOGIN.ERRORS.INVALID_CREDENTIALS');
        }
      }
    });
  }

  private performSignup() {
    const formValues = this.authForm.getRawValue();
    const request: RegisterRequest = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      role: 'STUDENT',
      referredByCode: formValues.referredByCode
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (!response.token) {
          this.isRegistrationSuccess.set(true);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'LOGIN.ERRORS.GENERIC');
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

  resetToLogin() {
    this.isRegistrationSuccess.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'login' },
      queryParamsHandling: 'merge',
    });
    this.authForm.reset();
  }

  isResending = signal<boolean>(false);
  resendSuccessMessage = signal<string | null>(null);

  resendVerificationEmail(): void {
    const email = this.authForm.get('email')?.value;
    if (!email) return;

    this.isResending.set(true);
    this.resendSuccessMessage.set(null);

    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccessMessage.set('LOGIN.RESEND_SUCCESS');
      },
      error: (err) => {
        this.isResending.set(false);
        this.errorMessage.set('LOGIN.ERRORS.RESEND_FAILED');
      }
    });
  }
}