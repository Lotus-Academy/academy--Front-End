import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// 1. DTO REGISTER
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

// 2. DTO LOGIN REQUEST (Correspond à LoginRequestDTO)
export interface LoginRequest {
  email: string;
  password: string;
}

// 3. DTO LOGIN RESPONSE (Correspond à LoginResponseDTO)
export interface AuthResponse {
  token: string;
  type: string;        // ex: "Bearer"
  userId: string;      // UUID (string) et non number !
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED' | 'PENDING_VERIFICATION';
  firstName: string;
  lastName: string;
  headline?: string;   // Optionnel
  profilePictureUrl?: string; // Optionnel
  emailVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  // Correction de l'URL pour inclure /v1
  private baseUrl = 'http://localhost:8080/api/v1/auth';

  constructor() { }

  /**
   * Inscription d'un nouvel utilisateur
   * Endpoint: POST /api/v1/auth/register
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      // Optionnel : On peut connecter l'utilisateur directement après l'inscription
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Connexion utilisateur
   * Endpoint: POST /api/v1/auth/login
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // --- Gestion du Token & Session (LocalStorage) ---

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): AuthResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Ici, on pourrait rediriger vers la page de login via le Router si nécessaire
  }

  // Utile pour vérifier les rôles dans les Guards (ex: CanActivate)
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }
}