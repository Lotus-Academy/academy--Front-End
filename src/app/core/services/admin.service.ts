import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseResponseDTO } from '../models/course.dto';

// ==========================================
// DTOs
// ==========================================

export interface PageResponseDTO<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'PAUSED' | 'BANNED' | 'PENDING_VERIFICATION';
  headline?: string;
  bio?: string;
  profilePictureUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  referralCode?: string;
}

// 1. Les informations de base de l'utilisateur
export interface BaseProfileDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'PAUSED' | 'BANNED' | 'PENDING_VERIFICATION';
  headline?: string;
  bio?: string;
  profilePictureUrl?: string;
  socialLinks?: string;
  emailVerified: boolean;
  createdAt: string;
  referralCode?: string;
}

// 2. Les informations spécifiques si l'utilisateur est un instructeur
export interface InstructorProfileDetailsDTO {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  profilePictureUrl?: string;
  expertiseDomains?: string[];
  yearsOfExperience?: number;
  teachingLanguages?: string[];
  linkedinUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  legalName?: string;
  phoneNumber?: string;
  billingAddress?: string;
  taxId?: string;
  availableForMentoring?: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  totalReferrals?: number;
  revenueShareRate?: number;
  createdAt: string;
  updatedAt: string;
}

// 3. Le Wrapper global renvoyé par GET /api/v1/admin/users/{userId}
export interface AdminUserDetailsDTO {
  profile: BaseProfileDTO;
  instructorProfile?: InstructorProfileDetailsDTO; // Optionnel car un étudiant n'en a pas
  createdCourses: any[];
  enrollments: any[];
  payments: any[];
}
export interface AdminInstructorDTO {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  userStatus: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  registeredAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string; // NOUVEAU: Récupéré depuis le backend
}

export interface CategoryCreateDTO {
  name: string;
  description?: string;
  // Ne contient PAS iconUrl, c'est envoyé en FormData
}

export interface DashboardStatsDTO {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  pendingCoursesCount: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalCertificatesIssued: number;
}

export interface AdminPaymentDTO {
  id?: string;
  courseTitle: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  receiptUrl?: string;
  studentEmail?: string;
}

export interface EnrollmentDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  instructorName: string;
  studentName: string;
  studentEmail: string;
  progress: number;
  enrolledAt: string;
  lastAccessedAt?: string;
  categoryId: string;
  totalLessons: number;
  completedLessons: number;
  completed: boolean;
}

export interface PaymentHistoryDTO {
  courseTitle: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  receiptUrl?: string;
  appliedCouponCode?: string;
}

export interface CertificateDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  serialNumber: string;
  issuedAt: string;
}


@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  // URL de base pour les routes purement admin
  private adminUrl = `${environment.apiUrl}/api/v1/admin`;
  // URL de base pour les routes globales
  private publicUrl = `${environment.apiUrl}/api/v1`;

  // ==========================================
  // GESTION DES COURS
  // ==========================================

  /**
   * GET /api/v1/admin/courses
   * Récupère TOUS les cours (brouillons, en attente, publiés) avec pagination
   */
  getAllCourses(page: number = 0, size: number = 20): Observable<PageResponseDTO<CourseResponseDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    return this.http.get<PageResponseDTO<CourseResponseDTO>>(`${this.adminUrl}/courses`, { params });
  }

  /**
   * PATCH /api/v1/admin/courses/{courseId}/approve
   */
  approveCourse(courseId: string): Observable<string> {
    return this.http.patch(`${this.adminUrl}/courses/${courseId}/approve`, {}, { responseType: 'text' });
  }

  /**
   * PATCH /api/v1/admin/courses/{courseId}/reject
   */
  rejectCourse(courseId: string): Observable<string> {
    return this.http.patch(`${this.adminUrl}/courses/${courseId}/reject`, {}, { responseType: 'text' });
  }

  /**
   * PATCH /api/v1/admin/courses/{courseId}/approve-deletion
   */
  approveCourseDeletion(courseId: string): Observable<string> {
    return this.http.patch(`${this.adminUrl}/courses/${courseId}/approve-deletion`, {}, { responseType: 'text' });
  }


  // ==========================================
  // GESTION DES INSTRUCTEURS & UTILISATEURS
  // ==========================================

  /**
   * GET /api/v1/admin/instructors
   * Liste tous les instructeurs avec pagination et filtres optionnels
   */
  getAllInstructors(page: number = 0, size: number = 20, approvalStatus?: string): Observable<PageResponseDTO<AdminInstructorDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    if (approvalStatus) {
      params = params.set('approvalStatus', approvalStatus);
    }

    return this.http.get<PageResponseDTO<AdminInstructorDTO>>(`${this.adminUrl}/instructors`, { params });
  }

  /**
   * PATCH /api/v1/instructors/profile/{profileId}/approve
   * Approuve la candidature d'un instructeur
   */
  approveInstructor(profileId: string): Observable<string> {
    return this.http.patch(`${this.publicUrl}/instructors/profile/${profileId}/approve`, {}, { responseType: 'text' });
  }

  /**
   * PATCH /api/v1/instructors/profile/{profileId}/reject
   * Rejette la candidature d'un instructeur
   */
  rejectInstructor(profileId: string): Observable<string> {
    return this.http.patch(`${this.publicUrl}/instructors/profile/${profileId}/reject`, {}, { responseType: 'text' });
  }


  // ==========================================
  // GESTION DES CATÉGORIES
  // ==========================================

  /**
   * GET /api/v1/categories
   */
  getCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.publicUrl}/categories`);
  }

  /**
   * POST /api/v1/admin/categories
   * @param formData Contient "data" (JSON de CategoryCreateDTO) et "icon" (le fichier)
   */
  createCategory(formData: FormData): Observable<CategoryDTO> {
    // Selon Swagger, retourne un CategoryDTO (ou "CourseCategory")
    return this.http.post<CategoryDTO>(`${this.adminUrl}/categories`, formData);
  }

  /**
   * PUT /api/v1/admin/categories/{categoryId}
   * @param categoryId L'ID de la catégorie
   * @param formData Contient "data" (JSON de CategoryCreateDTO) et "icon" (le fichier)
   */
  updateCategory(categoryId: string, formData: FormData): Observable<CategoryDTO> {
    // Selon Swagger, retourne un CategoryDTO
    return this.http.put<CategoryDTO>(`${this.adminUrl}/categories/${categoryId}`, formData);
  }

  /**
   * DELETE /api/v1/admin/categories/{categoryId}
   */
  deleteCategory(categoryId: string): Observable<string> {
    return this.http.delete(`${this.adminUrl}/categories/${categoryId}`, { responseType: 'text' });
  }


  // ==========================================
  // STATISTIQUES GLOBALES
  // ==========================================

  /**
   * GET /api/v1/admin/stats
   */
  getDashboardStats(): Observable<DashboardStatsDTO> {
    return this.http.get<DashboardStatsDTO>(`${this.adminUrl}/stats`);
  }


  /**
   * GET /api/v1/admin/students
   * Liste les étudiants avec recherche côté serveur
   */
  getAllStudents(page: number = 0, size: number = 50, search: string = ''): Observable<PageResponseDTO<UserDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponseDTO<UserDTO>>(`${this.adminUrl}/students`, { params });
  }

  /**
   * GET /api/v1/admin/payments
   */
  getAllPayments(page: number = 0, size: number = 50): Observable<PageResponseDTO<AdminPaymentDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'paidAt,DESC');

    return this.http.get<PageResponseDTO<AdminPaymentDTO>>(`${this.adminUrl}/payments`, { params });
  }

  // GET /api/v1/admin/user/{userId}
  getUserDetails(userId: string): Observable<AdminUserDetailsDTO> {
    return this.http.get<AdminUserDetailsDTO>(`${this.adminUrl}/users/${userId}`);
  }

  getStudentEnrollments(studentId: string, page: number = 0, size: number = 20): Observable<PageResponseDTO<EnrollmentDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sort', 'enrolledAt,DESC');
    return this.http.get<PageResponseDTO<EnrollmentDTO>>(`${this.adminUrl}/reports/students/${studentId}/enrollments`, { params });
  }

  getStudentPayments(studentId: string, page: number = 0, size: number = 20): Observable<PageResponseDTO<PaymentHistoryDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sort', 'date,DESC');
    return this.http.get<PageResponseDTO<PaymentHistoryDTO>>(`${this.adminUrl}/reports/students/${studentId}/payments`, { params });
  }

  getStudentCertificates(studentId: string, page: number = 0, size: number = 20): Observable<PageResponseDTO<CertificateDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString()).set('sort', 'issuedAt,DESC');
    return this.http.get<PageResponseDTO<CertificateDTO>>(`${this.adminUrl}/reports/students/${studentId}/certificates`, { params });
  }
}