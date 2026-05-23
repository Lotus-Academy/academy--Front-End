import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  contentOwnershipConfirmed: boolean;
  distributionRightsGranted: boolean;
  revenueShareUnderstood: boolean;
  complianceAgreed: boolean;
  termsVersion: string;
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

  // --- Champs légaux ---
  termsAccepted: boolean;
  contentOwnershipConfirmed: boolean;
  distributionRightsGranted: boolean;
  revenueShareUnderstood: boolean;
  complianceAgreed: boolean;
  termsVersion: string;
  termsAcceptedAt: string;

  totalReferrals: number;
  revenueShareRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorPublicProfileResponseDTO {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline: string;
  bio: string;
  profilePictureUrl: string;
  expertiseDomains: string[];
  yearsOfExperience: number;
  teachingLanguages: string[];
  linkedinUrl: string;
  websiteUrl: string;
  githubUrl: string;
  availableForMentoring: boolean;
}

@Injectable({ providedIn: 'root' })
export class InstructorProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  /**
   * Soumet le dossier d'intégration initial
   */
  submitOnboarding(data: InstructorOnboardingRequestDTO): Observable<InstructorProfileResponseDTO> {
    return this.http.post<InstructorProfileResponseDTO>(`${this.apiUrl}/instructors/profile/onboarding`, data);
  }

  /**
   * Met à jour le profil existant de l'instructeur
   */
  updateProfile(data: Partial<InstructorOnboardingRequestDTO>): Observable<InstructorProfileResponseDTO> {
    return this.http.put<InstructorProfileResponseDTO>(`${this.apiUrl}/instructors/profile`, data);
  }

  /**
   * Récupère le profil instructeur de l'utilisateur connecté
   */
  getMyProfile(): Observable<InstructorProfileResponseDTO> {
    return this.http.get<InstructorProfileResponseDTO>(`${this.apiUrl}/instructors/profile/me`);
  }

  /**
   * Récupère le solde financier global de l'instructeur
   */
  getMyBalance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/instructors/me/balance`);
  }

  /**
   * Récupère l'historique des paiements versés à l'instructeur
   */
  getMyPayoutHistory(page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Le tri par défaut est généralement par date décroissante pour un historique financier
    params = params.append('sort', 'paidAt,DESC');

    return this.http.get<any>(`${this.apiUrl}/instructors/me/payouts`, { params });
  }

  getInstructorById(id: string): Observable<InstructorPublicProfileResponseDTO> {
    return this.http.get<InstructorPublicProfileResponseDTO>(`${this.apiUrl}/public/instructors/${id}`);
  }
}