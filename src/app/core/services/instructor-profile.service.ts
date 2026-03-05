import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InstructorOnboardingRequestDTO {
  headline: string;
  bio: string;
  profilePictureUrl?: string;
  expertiseDomains: string[];
  yearsOfExperience: number;
  teachingLanguages: string[];
  linkedinUrl: string;
  websiteUrl?: string;
  githubUrl?: string;
  legalName: string;
  phoneNumber: string;
  billingAddress: string;
  taxId?: string;
  availableForMentoring: boolean;
  termsAccepted: boolean;
}

export interface InstructorProfileResponseDTO {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  profilePictureUrl: string;
  expertiseDomains: string[];
  yearsOfExperience: number;
  teachingLanguages: string[];
  linkedinUrl: string;
  websiteUrl: string;
  githubUrl: string;
  legalName: string;
  phoneNumber: string;
  billingAddress: string;
  taxId: string;
  availableForMentoring: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class InstructorProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/instructors/profile`;

  /**
   * Soumet le dossier d'intégration initial
   */
  submitOnboarding(data: InstructorOnboardingRequestDTO): Observable<InstructorProfileResponseDTO> {
    return this.http.post<InstructorProfileResponseDTO>(`${this.apiUrl}/onboarding`, data);
  }

  /**
   * Met à jour le profil existant de l'instructeur
   */
  updateProfile(data: Partial<InstructorOnboardingRequestDTO>): Observable<InstructorProfileResponseDTO> {
    return this.http.put<InstructorProfileResponseDTO>(this.apiUrl, data);
  }

  /**
   * Récupère le profil instructeur de l'utilisateur connecté
   */
  getMyProfile(): Observable<InstructorProfileResponseDTO> {
    return this.http.get<InstructorProfileResponseDTO>(`${this.apiUrl}/me`);
  }
}