import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseResponseDTO } from '../models/course.dto';

// --- DTOs ---

export interface PageCourseResponseDTO {
  content: CourseResponseDTO[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
}

// Typage générique pour les réponses paginées de Spring Boot
export interface PageResponseDTO<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
}

export interface AdminInstructorDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
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
  // Ajustez selon ce que votre backend renvoie réellement
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingCourses: number;
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

  // URL de base pour les routes admin
  private adminUrl = `${environment.apiUrl}/api/v1/admin`;
  // URL de base pour les routes publiques/globales
  private publicUrl = `${environment.apiUrl}/api/v1`;

  // ==========================================
  // GESTION DES COURS
  // ==========================================

  /**
   * GET /api/v1/admin/courses
   * Récupère TOUS les cours avec pagination
   */
  getAllCourses(page: number = 0, size: number = 20): Observable<PageCourseResponseDTO> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    return this.http.get<PageCourseResponseDTO>(`${this.adminUrl}/courses`, { params });
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
   * Liste tous les instructeurs avec pagination
   */
  getAllInstructors(page: number = 0, size: number = 20): Observable<PageResponseDTO<AdminInstructorDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,DESC');

    return this.http.get<PageResponseDTO<AdminInstructorDTO>>(`${this.adminUrl}/instructors`, { params });
  }

  /**
   * NOTE : Le Swagger ne mentionne pas d'endpoint spécifique pour approuver/rejeter un instructeur.
   * Si cet endpoint existe dans votre contrôleur (ex: PATCH /api/v1/admin/users/{id}/status),
   * vous pouvez décommenter et adapter cette méthode :
   */
  /*
  updateInstructorStatus(instructorId: string, status: 'APPROVED' | 'REJECTED'): Observable<string> {
    return this.http.patch(`${this.adminUrl}/users/${instructorId}/status?status=${status}`, {}, { responseType: 'text' });
  }
  */


  // ==========================================
  // GESTION DES CATÉGORIES
  // ==========================================

  /**
   * GET /api/v1/categories
   * Récupère la liste de toutes les catégories (Endpoint public)
   */
  getCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.publicUrl}/categories`);
  }

  /**
   * POST /api/v1/admin/categories
   * Créer une nouvelle catégorie
   */
  createCategory(data: CategoryCreateDTO): Observable<string> {
    return this.http.post(`${this.adminUrl}/categories`, data, { responseType: 'text' });
  }

  /**
   * PUT /api/v1/admin/categories/{categoryId}
   * Modifier une catégorie existante
   */
  updateCategory(categoryId: string, data: CategoryCreateDTO): Observable<string> {
    return this.http.put(`${this.adminUrl}/categories/${categoryId}`, data, { responseType: 'text' });
  }

  /**
   * DELETE /api/v1/admin/categories/{categoryId}
   * Supprimer une catégorie
   */
  deleteCategory(categoryId: string): Observable<string> {
    return this.http.delete(`${this.adminUrl}/categories/${categoryId}`, { responseType: 'text' });
  }


  // ==========================================
  // STATISTIQUES GLOBALES
  // ==========================================

  /**
   * GET /api/v1/admin/stats
   * Récupère les KPI globaux
   */
  getDashboardStats(): Observable<DashboardStatsDTO> {
    return this.http.get<DashboardStatsDTO>(`${this.adminUrl}/stats`);
  }

  /**
   * GET /api/v1/admin/students
   * Liste tous les étudiants avec pagination
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
   * Consulter l'historique global des transactions financières
   */
  getAllPayments(page: number = 0, size: number = 50): Observable<PageResponseDTO<AdminPaymentDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'paidAt,DESC'); // Tri par date de paiement décroissante

    return this.http.get<PageResponseDTO<AdminPaymentDTO>>(`${this.adminUrl}/payments`, { params });
  }
}