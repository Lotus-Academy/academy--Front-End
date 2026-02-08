import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, LoginRequest, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  // Mise à jour du formulaire avec firstName et lastName
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.isLogin ? 'login' : 'signup' },
      queryParamsHandling: 'merge',
    });
    this.updateValidators();
    this.errorMessage = '';
  }

  // Active/Désactive les validateurs sur les champs Nom/Prénom
  private updateValidators() {
    const firstNameControl = this.authForm.get('firstName');
    const lastNameControl = this.authForm.get('lastName');

    if (!this.isLogin) {
      // En mode Inscription : Obligatoires
      firstNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      lastNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      // En mode Login : On s'en fiche, on retire les règles
      firstNameControl?.clearValidators();
      lastNameControl?.clearValidators();
    }

    firstNameControl?.updateValueAndValidity();
    lastNameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched(); // Montre les erreurs visuelles
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
        this.authService.saveToken(res.token);
        this.authService.saveUser(res); // Si tu as implémenté saveUser
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Email ou mot de passe incorrect.";
      }
    });
  }

  private performSignup() {
    // Plus besoin de "split" ! On prend les valeurs directes.
    const request: RegisterRequest = {
      firstName: this.authForm.value.firstName,
      lastName: this.authForm.value.lastName,
      email: this.authForm.value.email,
      password: this.authForm.value.password,
      role: 'STUDENT'
    };

    this.authService.register(request).subscribe({
      next: (res) => {
        // Connexion automatique après inscription
        this.authService.saveToken(res.token);
        this.authService.saveUser(res);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // Gestion message d'erreur du backend
        this.errorMessage = err.error?.message || "Erreur lors de l'inscription.";
      }
    });
  }
}