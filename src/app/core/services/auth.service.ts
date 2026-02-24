import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode'; // Assurez-vous d'avoir fait : npm install jwt-decode

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

// 3. DTO LOGIN RESPONSE
export interface AuthResponse {
  token: string;
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

  // Utilisation de l'environnement au lieu du localhost en dur
  private baseUrl = `${environment.apiUrl}/api/v1/auth`;

  // ÉTAT RÉACTIF GLOBAL : Toute l'application peut s'y abonner
  public currentUser = signal<AuthResponse | null>(null);

  constructor() {
    // Au démarrage de l'app, on vérifie si une session valide existe
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

  // --- Gestion du Token & Session Réactive ---

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));

    // On met à jour le Signal. Tous les composants branchés dessus se rafraîchissent !
    this.currentUser.set(response);
  }

  private restoreSession(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      if (this.isTokenExpired(token)) {
        this.logout(); // Nettoie tout si le token est périmé
      } else {
        this.currentUser.set(JSON.parse(userStr));
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Renvoie l'utilisateur actuel via le Signal
   * Utilisation dans un composant : this.authService.currentUser()
   */
  getUser(): AuthResponse | null {
    return this.currentUser();
  }

  /**
   * Vérifie si l'utilisateur est connecté ET si le token est valide
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  /**
   * Déconnexion complète
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null); // Vide l'état réactif
    this.router.navigate(['/login']);
  }

  /**
   * Vérifie le rôle pour les Guards
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }

  /**
   * Vérifie l'expiration du JWT
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      if (decodedToken.exp === undefined) return false;

      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);

      // On compare la date d'expiration avec l'heure actuelle
      return expirationDate.valueOf() < new Date().valueOf();
    } catch (err) {
      // Si le token est malformé, on le considère comme expiré
      return true;
    }
  }
}