import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
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
  referredByCode?: string;
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

// 4. DTO LOGIN RESPONSE 
export interface AuthResponse {
  token: string;
  refreshToken: string;
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

  // HttpBackend permet de créer un client HTTP qui ignore les intercepteurs (crucial pour le refresh token)
  private httpBackend = inject(HttpBackend);
  private bypassHttp: HttpClient;

  private baseUrl = `${environment.apiUrl}/api/v1/auth`;

  // ÉTAT RÉACTIF GLOBAL
  public currentUser = signal<AuthResponse | null>(null);

  constructor() {
    this.bypassHttp = new HttpClient(this.httpBackend);
    this.restoreSession();
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => {
        if (response.token) {
          this.saveSession(response);
        }
      })
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
   */
  forgotPassword(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/forgot-password`, null, { params, responseType: 'text' });
  }

  /**
   * Valider le nouveau mot de passe avec le token reçu par email
   */
  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/reset-password`, request, { responseType: 'text' });
  }

  /**
   * Valider l'adresse email
   */
  verifyEmail(token: string): Observable<string> {
    const params = new HttpParams().set('token', token);
    return this.http.get(`${this.baseUrl}/verify-email`, { params, responseType: 'text' });
  }

  /**
   * Renvoyer l'email de vérification (POST /api/v1/auth/resend-verification)
   */
  resendVerificationEmail(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/resend-verification`, null, { params, responseType: 'text' });
  }

  /**
   * Rafraîchir le jeton d'accès (Access Token) à partir du Refresh Token
   * Utilise bypassHttp pour éviter une boucle infinie avec l'intercepteur 401
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.bypassHttp.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
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

  /**
   * Met à jour dynamiquement une partie du profil (ex: nouvelle photo) sans déconnecter
   */
  public updateCurrentUserState(updates: Partial<AuthResponse>): void {
    const current = this.currentUser();
    if (current) {
      const updatedUser = { ...current, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.currentUser.set(updatedUser);
    }
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      // On restaure la session. Si le token est expiré, l'intercepteur HTTP 
      // attrapera la première erreur 401 et lancera le processus de rafraîchissement.
      this.currentUser.set(JSON.parse(userStr));
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

    // Pour l'interface UI (guards), on considère l'utilisateur authentifié 
    // s'il possède un refresh token valide, même si le token d'accès est expiré.
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

  public isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      if (decodedToken.exp === undefined) return false;

      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);

      // Marge de sécurité (1 minute)
      return (expirationDate.valueOf() - 60000) < new Date().valueOf();
    } catch (err) {
      return true;
    }
  }
}