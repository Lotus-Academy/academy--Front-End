import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnrollmentDTO } from '../../core/models/enrollment.dto';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/enrollments`;

  /**
   * Récupère la liste des cours auxquels l'étudiant est inscrit.
   * Transforme automatiquement la réponse paginée en tableau strict de EnrollmentDTO.
   */
  getMyEnrollments(): Observable<EnrollmentDTO[]> {
    return this.http.get<any>(`${this.baseUrl}/me`).pipe(
      map(response => {
        // Si l'API renvoie un objet paginé (PageEnrollmentDTO)
        if (response && response.content) {
          return response.content as EnrollmentDTO[];
        }
        // Si l'API renvoie directement un tableau
        return (response || []) as EnrollmentDTO[];
      })
    );
  }

  /**
   * Marque une leçon comme terminée pour un étudiant
   */
  completeLesson(courseId: string, lessonId: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/${courseId}/lessons/${lessonId}/complete`, {}, { responseType: 'text' });
  }
}