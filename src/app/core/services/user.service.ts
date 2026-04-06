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

  // ADDED: Subscription fields as per the backend Swagger definition
  subscriptionTier?: 'FREE' | 'CORE' | 'PRO' | 'ELITE';
  subscriptionStatus?: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE';
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
   * Retrieves detailed information of the connected user, including subscription status
   * Endpoint: GET /api/v1/users/me
   */
  getMyProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/me`);
  }

  /**
   * Updates user profile (Text info and optional photo)
   * Endpoint: PUT /api/v1/users/profile
   */
  updateProfile(profileData: UpdateProfileDTO, photoFile?: File): Observable<UserDTO> {
    const formData = new FormData();

    // The backend expects a 'data' field containing a stringified JSON
    formData.append('data', JSON.stringify(profileData));

    // Append photo if selected
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    return this.http.put<UserDTO>(`${this.baseUrl}/profile`, formData);
  }

  /**
   * Changes the user password
   * Endpoint: POST /api/v1/users/change-password
   */
  changePassword(passwordData: ChangePasswordDTO): Observable<string> {
    return this.http.post(`${this.baseUrl}/change-password`, passwordData, { responseType: 'text' });
  }

  /**
   * Archives / Deletes the user account
   */
  archiveAccount(): Observable<string> {
    return this.http.delete(`${this.baseUrl}/me`, { responseType: 'text' });
  }
}