import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuizRequestDto } from '../models/quiz.dto';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  /**
   * GET always returns JSON by default, so we leave it as is.
   */
  getCourseQuiz(courseId: string): Observable<QuizRequestDto> {
    return this.http.get<QuizRequestDto>(`${this.apiUrl}/courses/${courseId}/quiz/edit`);
  }

  /**
   * POST creates a quiz and returns a plain text success message.
   */
  createQuiz(courseId: string, payload: QuizRequestDto): Observable<string> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/quiz`, payload, { responseType: 'text' });
  }

  /**
   * PUT updates a quiz and returns a plain text success message.
   */
  updateQuiz(courseId: string, payload: QuizRequestDto): Observable<string> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}/quiz`, payload, { responseType: 'text' });
  }

  /**
   * DELETE removes a quiz and returns a plain text success message.
   */
  deleteQuiz(courseId: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}/quiz`, { responseType: 'text' });
  }

  /**
   * Récupère le quiz pour un étudiant (sans les bonnes réponses)
   * Endpoint: GET /api/v1/courses/{courseId}/quiz
   */
  getQuiz(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/courses/${courseId}/quiz`);
  }

  /**
   * Soumet les réponses de l'étudiant pour correction
   * Endpoint: POST /api/v1/courses/{courseId}/quiz/submit
   */
  submitQuiz(courseId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/courses/${courseId}/quiz/submit`, payload);
  }

  /**
   * Télécharge le certificat PDF de l'étudiant
   * Endpoint: GET /api/v1/courses/{courseId}/quiz/certificate
   */
  downloadCertificate(courseId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/courses/${courseId}/quiz/certificate`, { responseType: 'blob' });
  }
}