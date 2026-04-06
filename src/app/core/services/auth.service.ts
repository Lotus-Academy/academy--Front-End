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
  // ADDED: Optional subscription fields in case the backend includes them in the JWT/Login payload
  subscriptionTier?: 'FREE' | 'CORE' | 'PRO' | 'ELITE';
  subscriptionStatus?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private httpBackend = inject(HttpBackend);
  private bypassHttp: HttpClient;

  private baseUrl = `${environment.apiUrl}/api/v1/auth`;

  public currentUser = signal<AuthResponse | null>(null);

  constructor() {
    this.bypassHttp = new HttpClient(this.httpBackend);
    this.restoreSession();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => {
        if (response.token) {
          this.saveSession(response);
        }
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  forgotPassword(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/forgot-password`, null, { params, responseType: 'text' });
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/reset-password`, request, { responseType: 'text' });
  }

  verifyEmail(token: string): Observable<string> {
    const params = new HttpParams().set('token', token);
    return this.http.get(`${this.baseUrl}/verify-email`, { params, responseType: 'text' });
  }

  resendVerificationEmail(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.baseUrl}/resend-verification`, null, { params, responseType: 'text' });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.bypassHttp.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => this.saveSession(response))
    );
  }

  public saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response));

    this.currentUser.set(response);
  }

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
      return (expirationDate.valueOf() - 60000) < new Date().valueOf();
    } catch (err) {
      return true;
    }
  }
}