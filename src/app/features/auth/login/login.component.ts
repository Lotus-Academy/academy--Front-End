import { Component, effect, inject, signal, untracked, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Info, Mail, Loader2, CheckCircle2, LucideAngularModule, Ticket } from 'lucide-angular';

import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, LucideAngularModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly icons = { Mail, Info, Loader2, CheckCircle2, Ticket };

  private routeParams = toSignal(this.route.queryParams);

  readonly isLogin = computed(() => {
    const params = this.routeParams();
    return params ? params['mode'] !== 'signup' : true;
  });

  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');
  isUnverified = signal<boolean>(false);
  isRegistrationSuccess = signal<boolean>(false);

  authForm: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    referredByCode: ['']
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    effect(() => {
      const loginMode = this.isLogin();

      untracked(() => {
        this.updateValidators(loginMode);
        this.errorMessage.set('');
      });
    });
  }

  // --- NOUVEAU : Capture du code de parrainage au chargement ---
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const refCode = params['ref'];

      if (refCode) {
        // 1. Pré-remplir le champ de parrainage avec le code de l'URL
        this.authForm.patchValue({ referredByCode: refCode });

        // 2. Basculer automatiquement sur le mode inscription si ce n'est pas le cas
        if (params['mode'] !== 'signup') {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { mode: 'signup' },
            queryParamsHandling: 'merge', // Conserve le paramètre ?ref=
          });
        }
      }
    });
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

    if (isLoginMode) {
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
      firstNameControl?.reset('');
      lastNameControl?.reset('');
    } else {
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    }

    firstNameControl?.updateValueAndValidity();
    lastNameControl?.updateValueAndValidity();
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
      // Assurez-vous que le service envoie bien ce champ au backend
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

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
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

  // Méthode pour renvoyer l'email
  resendVerificationEmail(): void {
    const email = this.authForm.get('email')?.value;
    if (!email) return;

    this.isResending.set(true);
    this.resendSuccessMessage.set(null);

    // Adaptez "authService.resendVerificationEmail" selon le nom de la méthode dans votre service
    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccessMessage.set('LOGIN.RESEND_SUCCESS');
      },
      error: (err) => {
        this.isResending.set(false);
        // Vous pouvez définir l'erreur globale ici si l'envoi échoue
        this.errorMessage.set('LOGIN.ERRORS.RESEND_FAILED');
      }
    });
  }
}