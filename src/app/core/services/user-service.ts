import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ==========================================
// DTOs
// ==========================================

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'PAUSED' | 'BANNED' | 'PENDING_VERIFICATION';
  headline?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: string;
  emailVerified: boolean;
  createdAt: string;
  referralCode?: string;
}

export interface UpdateProfileDTO {
  firstName: string;
  lastName: string;
  headline?: string;
  bio?: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/users`;

  /**
   * Récupère les informations détaillées de l'utilisateur connecté
   * Endpoint: GET /api/v1/users/me
   */
  getMyProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/me`);
  }

  /**
   * Met à jour le profil (Informations textuelles et photo optionnelle)
   * Endpoint: PUT /api/v1/users/profile
   */
  updateProfile(profileData: UpdateProfileDTO, photoFile?: File): Observable<UserDTO> {
    const formData = new FormData();

    // Le backend attend un champ 'data' contenant le JSON sous forme de chaîne
    formData.append('data', JSON.stringify(profileData));

    // Si une nouvelle photo est sélectionnée, on l'ajoute au payload
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    return this.http.put<UserDTO>(`${this.baseUrl}/profile`, formData);
  }

  /**
   * Modifie le mot de passe de l'utilisateur
   * Endpoint: POST /api/v1/users/change-password
   */
  changePassword(passwordData: ChangePasswordDTO): Observable<string> {
    // Spécification de responseType: 'text' obligatoire pour les retours String purs du backend
    return this.http.post(`${this.baseUrl}/change-password`, passwordData, { responseType: 'text' });
  }

  /**
   * Archive / Supprime le compte de l'utilisateur
   * ATTENTION : Ce endpoint n'est pas encore documenté dans le Swagger fourni.
   * Si la route n'existe pas côté Spring Boot, cela générera une erreur 404.
   */
  archiveAccount(): Observable<string> {
    return this.http.delete(`${this.baseUrl}/me`, { responseType: 'text' });
  }
}