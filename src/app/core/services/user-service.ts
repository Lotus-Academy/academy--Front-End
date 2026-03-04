import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdateProfileDTO {
  firstName: string;
  lastName: string;
  headline?: string;
  bio?: string;
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
  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`);
  }

  /**
   * Met à jour le profil (Informations textuelles et photo optionnelle)
   * Endpoint: PUT /api/v1/users/profile
   */
  updateProfile(profileData: UpdateProfileDTO, photoFile?: File): Observable<any> {
    const formData = new FormData();

    // Le backend attend un champ 'data' contenant le JSON sous forme de chaîne
    formData.append('data', JSON.stringify(profileData));

    // Si une nouvelle photo est sélectionnée, on l'ajoute au payload
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    return this.http.put<any>(`${this.baseUrl}/profile`, formData);
  }

  /**
   * Modifie le mot de passe de l'utilisateur
   * Endpoint: POST /api/v1/users/change-password
   */
  changePassword(passwordData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/change-password`, passwordData);
  }

  /**
   * Archive / Supprime le compte de l'utilisateur
   * (Requête standardisée selon votre instruction)
   */
  archiveAccount(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/me`);
  }
}