import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // 1. Passage aux Signals pour la gestion de l'état
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
    // 2. Vérification proactive : si déjà connecté, on quitte la page
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Gestion du mode via l'URL
    this.route.queryParams.subscribe(params => {
      this.isLogin.set(params['mode'] !== 'signup');
      this.updateValidators();
    });
  }

  toggleMode() {
    this.isLogin.update(current => !current);

    // Navigation pour mettre à jour l'URL sans recharger la page
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
      // Mode Inscription : Champs obligatoires
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      // Mode Connexion : Champs optionnels
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
    }

    // Indispensable pour que le formulaire recalcule sa validité globale
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
        // Le AuthService stocke le token, on redirige vers le routeur centralisé
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Gestion générique de l'erreur (idéalement vérifier le status HTTP 401)
        this.errorMessage.set("Email ou mot de passe incorrect.");
      }
    });
  }

  private performSignup() {
    const request: RegisterRequest = {
      firstName: this.authForm.value.firstName,
      lastName: this.authForm.value.lastName,
      email: this.authForm.value.email,
      password: this.authForm.value.password,
      role: 'STUDENT' // Rôle par défaut selon votre Swagger
    };

    this.authService.register(request).subscribe({
      next: () => {
        // Redirection vers le dashboard, l'API register renvoyant un LoginResponseDTO
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || "Une erreur est survenue lors de l'inscription.");
      }
    });
  }

  // Optionnel : Méthode pour basculer l'affichage du mot de passe
  togglePasswordVisibility() {
    this.showPassword.update(current => !current);
  }
}