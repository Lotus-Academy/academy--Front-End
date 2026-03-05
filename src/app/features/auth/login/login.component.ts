import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core'; // IMPORTATION AJOUTÉE

@Component({
  selector: 'app-login',
  standalone: true,
  // AJOUT DE TranslateModule DANS LES IMPORTS
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLogin = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');

  authForm: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.isLogin.set(params['mode'] !== 'signup');
      this.updateValidators();
    });
  }

  toggleMode() {
    this.isLogin.update(current => !current);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.isLogin() ? 'login' : 'signup' },
      queryParamsHandling: 'merge',
    });

    this.errorMessage.set('');
    this.updateValidators();
  }

  private updateValidators() {
    const firstNameControl = this.authForm.get('firstName');
    const lastNameControl = this.authForm.get('lastName');

    if (!this.isLogin()) {
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
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
    const request: LoginRequest = {
      email: this.authForm.value.email,
      password: this.authForm.value.password
    };

    this.authService.login(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Utilisation de la clé de traduction
        this.errorMessage.set('LOGIN.ERRORS.INVALID_CREDENTIALS');
      }
    });
  }

  private performSignup() {
    const request: RegisterRequest = {
      firstName: this.authForm.value.firstName,
      lastName: this.authForm.value.lastName,
      email: this.authForm.value.email,
      password: this.authForm.value.password,
      role: 'STUDENT'
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // L'API renvoie le message d'erreur réel ou on utilise la clé générique
        this.errorMessage.set(err.error?.message || 'LOGIN.ERRORS.GENERIC');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }
}