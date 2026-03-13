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
}