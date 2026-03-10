import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseResponseDTO, PageCourseResponseDTO, CategoryDTO } from '../models/course.dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  // --- CATALOGUE ET RECHERCHE ---

  /**
   * Récupère le catalogue public avec pagination et tri
   */
  getPublishedCourses(page: number = 0, size: number = 12): Observable<PageCourseResponseDTO> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'publishedAt,DESC');

    return this.http.get<PageCourseResponseDTO>(`${this.apiUrl}/courses`, { params });
  }

  getCourseById(id: string): Observable<CourseResponseDTO> {
    return this.http.get<CourseResponseDTO>(`${this.apiUrl}/courses/${id}`);
  }

  // --- CATÉGORIES ---

  getCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.apiUrl}/categories`);
  }

  // --- GESTION DU COURS (INSTRUCTEUR) ---

  getInstructorCourses(): Observable<CourseResponseDTO[]> {
    return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses/instructor/my-courses`);
  }

  createCourse(data: any): Observable<CourseResponseDTO> {
    return this.http.post<CourseResponseDTO>(`${this.apiUrl}/courses`, data);
  }

  updateCourse(courseId: string, data: any): Observable<CourseResponseDTO> {
    return this.http.put<CourseResponseDTO>(`${this.apiUrl}/courses/${courseId}`, data);
  }

  // --- MÉDIAS GLOBAUX ---

  uploadCourseThumbnail(courseId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/courses/${courseId}/thumbnail`, formData);
  }

  uploadCourseTrailer(courseId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/courses/${courseId}/trailer`, formData);
  }

  // --- PROGRAMME (SECTIONS) ---

  createSection(courseId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/sections`, data);
  }

  updateSection(courseId: string, sectionId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}/sections/${sectionId}`, data);
  }

  deleteSection(courseId: string, sectionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}/sections/${sectionId}`);
  }

  // --- PROGRAMME (LEÇONS) ---

  createLesson(sectionId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sections/${sectionId}/lessons`, data);
  }

  updateLesson(sectionId: string, lessonId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}`, data);
  }

  deleteLesson(sectionId: string, lessonId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}`);
  }

  uploadLessonMedia(sectionId: string, lessonId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}/upload`, formData);
  }

  // --- QUIZ ---

  createQuiz(courseId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/quiz`, data, { responseType: 'text' });
  }

  // --- SOUMISSION ---

  submitForReview(courseId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/courses/${courseId}/submit-review`, {}, { responseType: 'text' });
  }
}