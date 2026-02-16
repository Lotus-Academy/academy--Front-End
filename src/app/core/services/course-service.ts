import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- INTERFACES (Basées sur tes DTOs Java) ---

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CourseCreateRequest {
  title: string;
  subtitle: string;
  categoryId: string;
  description?: string;
  price: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  thumbnailUrl?: string; // On gérera l'upload d'image plus tard si besoin
}

export interface CourseResponse {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryName: string;
  instructorName: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // en secondes
  mediaUrl?: string;
  freePreview: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1';

  // --- COURS ---

  createCourse(request: CourseCreateRequest): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(`${this.apiUrl}/courses`, request);
  }

  getCourseById(courseId: string): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${this.apiUrl}/courses/${courseId}`);
  }

  // Pour le catalogue public
  getAllCourses(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${this.apiUrl}/courses`);
  }

  // Pour le dashboard instructeur (il faudrait un endpoint spécifique /my-courses côté back, 
  // mais pour l'instant on peut filtrer côté front ou utiliser l'endpoint public si l'instructeur est le créateur)
  // Note: Idéalement, ajoute un endpoint `GET /api/v1/instructors/courses` dans ton backend plus tard.

  // --- CATÉGORIES ---

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  // --- SECTIONS & LEÇONS ---

  addSection(courseId: string, title: string): Observable<Section> {
    return this.http.post<Section>(`${this.apiUrl}/courses/${courseId}/sections`, { title });
  }

  addLesson(sectionId: string, lesson: any): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/sections/${sectionId}/lessons`, lesson);
  }

  // Upload Vidéo (Multipart)
  uploadLessonMedia(sectionId: string, lessonId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/sections/${sectionId}/lessons/${lessonId}/upload`, formData);
  }
}