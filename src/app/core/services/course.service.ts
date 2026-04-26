import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CourseResponseDTO, PageCourseResponseDTO, CategoryDTO, LessonDTO } from '../models/course.dto';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  // --- CATALOGUE ET RECHERCHE ---

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

  // NOUVEAU PROCESSUS 3 ÉTAPES (TRAILER)
  getTrailerPresignedUrl(courseId: string, filename: string, contentType: string, fileSize: number): Observable<{ presignedUrl: string, publicUrl: string }> {
    const params = new HttpParams()
      .set('filename', filename)
      .set('contentType', contentType)
      .set('fileSize', fileSize.toString());
    return this.http.get<{ presignedUrl: string, publicUrl: string }>(`${this.apiUrl}/courses/${courseId}/trailer/presigned-url`, { params });
  }

  // NOUVEAU PROCESSUS 3 ÉTAPES (LESSON MEDIA)
  getLessonMediaPresignedUrl(sectionId: string, lessonId: string, filename: string, contentType: string, fileSize: number): Observable<{ presignedUrl: string, publicUrl: string }> {
    const params = new HttpParams()
      .set('filename', filename)
      .set('contentType', contentType)
      .set('fileSize', fileSize.toString());
    return this.http.get<{ presignedUrl: string, publicUrl: string }>(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}/upload/presigned-url`, { params });
  }

  confirmTrailerUpload(courseId: string, payload: any): Observable<CourseResponseDTO> {
    return this.http.post<CourseResponseDTO>(`${this.apiUrl}/courses/${courseId}/trailer/confirm`, payload);
  }

  confirmLessonMediaUpload(sectionId: string, lessonId: string, payload: any): Observable<LessonDTO> {
    return this.http.post<LessonDTO>(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}/upload/confirm`, payload);
  }

  // UPLOAD GÉNÉRIQUE VERS CLOUDFLARE R2 AVEC SUIVI DE PROGRESSION
  uploadToPresignedUrlWithProgress(url: string, file: File, contentType: string): Observable<HttpEvent<any>> {
    return new Observable((observer) => {
      const xhr = new XMLHttpRequest();

      // 1. Écouter la progression EN TEMPS RÉEL
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // On émet un objet qui imite parfaitement l'événement d'Angular
          observer.next({
            type: HttpEventType.UploadProgress,
            loaded: event.loaded,
            total: event.total
          });
        }
      };

      // 2. Écouter la fin de la requête
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Succès : on émet la réponse finale
          observer.next({ type: HttpEventType.Response, body: null } as any);
          observer.complete();
        } else {
          // Échec (ex: 400 Bad Request, 403 Forbidden sur AWS/R2)
          observer.error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`);
        }
      };

      // 3. Écouter les erreurs réseau (CORS, perte de connexion)
      xhr.onerror = () => {
        observer.error('Network error occurred during upload.');
      };

      // 4. Configurer et envoyer la requête
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', contentType);

      // Très important : AWS S3 / Cloudflare R2 nécessite l'envoi du fichier brut
      xhr.send(file);

      // 5. Fonction de nettoyage (si l'utilisateur quitte la page pendant l'upload)
      return () => {
        xhr.abort();
      };
    });
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

  createLesson(sectionId: string, data: any): Observable<LessonDTO> {
    return this.http.post<LessonDTO>(`${this.apiUrl}/sections/${sectionId}/lessons`, data);
  }

  updateLesson(sectionId: string, lessonId: string, data: any): Observable<LessonDTO> {
    return this.http.put<LessonDTO>(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}`, data);
  }

  deleteLesson(sectionId: string, lessonId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}`);
  }

  // --- QUIZ ---

  createQuiz(courseId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/quiz`, data, { responseType: 'text' });
  }

  // --- SOUMISSION ---

  submitForReview(courseId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/courses/${courseId}/submit-review`, {}, { responseType: 'text' });
  }

  getCourseStudents(courseId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/instructors/courses/${courseId}/students`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getTopRatedCourses(): Observable<CourseResponseDTO[]> {
    return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses/top-rated`);
  }

  getNewestCourses(): Observable<CourseResponseDTO[]> {
    return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses/newest`);
  }

  getPopularCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${environment.apiUrl}/api/v1/categories/popular`);
  }

  getTrendingCourses(): Observable<CourseResponseDTO[]> {
    return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/courses/trending`);
  }
}