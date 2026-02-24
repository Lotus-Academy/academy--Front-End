import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { CourseResponseDTO } from '../models/course.dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;
  private publicCourses: Observable<CourseResponseDTO[]> = of([]);

  getPublishedCourses(): Observable<CourseResponseDTO[]> {
    this.publicCourses = this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses`);
    return this.publicCourses;
  }

  getCourseById(id: string): Observable<CourseResponseDTO> {
    return this.http.get<CourseResponseDTO>(`${this.apiUrl}/courses/${id}`);
  }


  // --- COURS DE BASE ---

  createCourse(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, data);
  }


  updateCourse(courseId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}`, data);
  }

  // --- MÉDIAS DU COURS (MULTIPART) ---

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

  // --- PROGRAMME (SECTIONS & LEÇONS) ---

  createSection(courseId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/sections`, data);
  }

  createLesson(sectionId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sections/${sectionId}/lessons`, data);
  }

  uploadLessonMedia(sectionId: string, lessonId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}/upload`, formData);
  }

  // --- QUIZ ---

  createQuiz(data: any): Observable<any> {
    // Le Swagger indique POST /api/v1/quiz avec QuizCreateDTO
    return this.http.post(`${this.apiUrl}/quiz`, data, { responseType: 'text' });
  }

  // --- SOUMISSION ---

  submitForReview(courseId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/courses/${courseId}/submit-review`, { courseId }, { responseType: 'text' });
  }

  // recupere les cours d'un instructeur
  getInstructorCourses(): Observable<CourseResponseDTO[]> {
    return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses/instructor/my-courses`);
  }
}