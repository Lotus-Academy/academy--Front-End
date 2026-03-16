import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/enrollments`;

  /**
   * Récupère la liste des cours auxquels l'étudiant est inscrit
   */
  getMyEnrollments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/me`);
  }


  /**
   * Marque une leçon comme terminée pour un étudiant
   */
  completeLesson(courseId: string, lessonId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${courseId}/lessons/${lessonId}/complete`, {}, { responseType: 'text' });
  }
}