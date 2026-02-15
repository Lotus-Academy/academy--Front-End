import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink], // CommonModule retiré car inutile avec @if
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLogin: boolean = true;
  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';

  authForm: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isLogin = params['mode'] !== 'signup';
      this.updateValidators();
    });
  }

  toggleMode() {
    this.isLogin = !this.isLogin;

    // Navigation pour mettre à jour l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.isLogin ? 'login' : 'signup' },
      queryParamsHandling: 'merge',
    });

    // On efface le message d'erreur et on réinitialise partiellement le formulaire
    this.errorMessage = '';
    this.updateValidators();
  }

  private updateValidators() {
    const firstNameControl = this.authForm.get('firstName');
    const lastNameControl = this.authForm.get('lastName');

    if (!this.isLogin) {
      // Mode Inscription : Champs obligatoires
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      // Mode Connexion : Champs optionnels
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

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isLogin) {
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
      next: (res) => {
        // Le service gère le stockage (voir modifications précédentes du AuthService)
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Email ou mot de passe incorrect.";
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
      next: (res) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || "Une erreur est survenue lors de l'inscription.";
      }
    });
  }
}