import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseResponseDTO } from '../models/course.dto';

// ==========================================
// DTOs (Strictement alignés sur le Swagger)
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
}

export interface CategoryCreateDTO {
  name: string;
  description?: string;
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
   */
  createCategory(data: CategoryCreateDTO): Observable<string> {
    return this.http.post(`${this.adminUrl}/categories`, data, { responseType: 'text' });
  }

  /**
   * PUT /api/v1/admin/categories/{categoryId}
   */
  updateCategory(categoryId: string, data: CategoryCreateDTO): Observable<string> {
    return this.http.put(`${this.adminUrl}/categories/${categoryId}`, data, { responseType: 'text' });
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
   */
  getAllStudents(page: number = 0, size: number = 20): Observable<PageResponseDTO<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    return this.http.get<PageResponseDTO<any>>(`${this.adminUrl}/students`, { params });
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
}