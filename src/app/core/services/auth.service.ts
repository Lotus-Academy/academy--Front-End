import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 1. DTO REGISTER (Correspond à UserRegistrationDTO.java)
export interface RegisterRequest {
  firstName: string; // Attention au N majuscule !
  lastName: string;  // Attention au N majuscule !
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'; // Doit matcher ton Enum Java UserRole
}

// 2. DTO LOGIN REQUEST (Correspond à LoginRequestDTO.java)
export interface LoginRequest {
  email: string;
  password: string;
}

// 3. DTO LOGIN RESPONSE (Correspond à LoginResponseDTO.java)
export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  // URL exacte basée sur ton @RequestMapping("/api/auth")
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor() { }

  // Appel vers @PostMapping("/register")
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request);
  }

  // Appel vers @PostMapping("/login")
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
  }

  // --- Gestion du Token ---

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Optionnel : Sauvegarder l'utilisateur complet pour l'afficher dans la navbar
  saveUser(user: AuthResponse): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): AuthResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}