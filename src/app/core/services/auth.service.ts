import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

// 1. DTO REGISTER
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

// 2. DTO LOGIN REQUEST
export interface LoginRequest {
  email: string;
  password: string;
}

// 3. DTO RESET PASSWORD REQUEST
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// 4. DTO LOGIN RESPONSE (Mise à jour avec refreshToken)
export interface AuthResponse {
  token: string;
  refreshToken: string; // Nouvel élément ajouté par le backend
  type: string;
  userId: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED' | 'PENDING_VERIFICATION';
  firstName: string;
  lastName: string;
  headline?: string;
  profilePictureUrl?: string;
  emailVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private baseUrl = `${environment.apiUrl}/api/v1/auth`;

  // ÉTAT RÉACTIF GLOBAL
  public currentUser = signal<AuthResponse | null>(null);

  constructor() {
    this.restoreSession();
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Connexion utilisateur
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  /**
   * Demander la réinitialisation du mot de passe (Envoie un email)
   * Endpoint: POST /api/v1/auth/forgot-password?email=...
   */
  forgotPassword(email: string): Observable<any> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/forgot-password`, null, { params, responseType: 'text' });
  }

  /**
   * Valider le nouveau mot de passe avec le token reçu par email
   * Endpoint: POST /api/v1/auth/reset-password
   */
  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, request, { responseType: 'text' });
  }

  /**
   * Valider l'adresse email
   * Endpoint: GET /api/v1/auth/verify-email?token=...
   */
  verifyEmail(token: string): Observable<any> {
    const params = new HttpParams().set('token', token);
    return this.http.get(`${this.baseUrl}/verify-email`, { params, responseType: 'text' });
  }

  /**
   * Rafraîchir le jeton d'accès (Access Token) à partir du Refresh Token
   * Endpoint: POST /api/v1/auth/refresh-token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // --- Gestion du Token & Session Réactive ---

  public saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response));

    this.currentUser.set(response);
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      if (this.isTokenExpired(token)) {
        // Le token est expiré, mais nous ne déconnectons pas immédiatement.
        // L'intercepteur HTTP tentera d'utiliser le refreshToken lors de la prochaine requête.
        this.currentUser.set(JSON.parse(userStr));
      } else {
        this.currentUser.set(JSON.parse(userStr));
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUser(): AuthResponse | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Si le token est expiré, l'intercepteur se chargera de le rafraîchir.
    // Pour l'interface UI (guards), on considère l'utilisateur authentifié s'il possède un refresh token.
    if (this.isTokenExpired(token)) {
      return this.getRefreshToken() !== null;
    }
    return true;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      if (decodedToken.exp === undefined) return false;

      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);

      // Marge de sécurité (ex: on considère expiré 1 minute avant l'heure réelle)
      return (expirationDate.valueOf() - 60000) < new Date().valueOf();
    } catch (err) {
      return true;
    }
  }
}