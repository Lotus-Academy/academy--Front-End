import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { CourseResponseDTO } from '../models/course.dto';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/courses'; // Remplacez par votre URL d'API réelle

  // Données fictives respectant strictement votre CourseResponseDTO
  private mockCourses: CourseResponseDTO[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Maîtriser l\'Analyse Technique et le Price Action',
      slug: 'maitriser-analyse-technique',
      subtitle: 'Devenez un expert en lecture de graphiques boursiers',
      description: 'Un cours complet sur l\'analyse technique...',
      price: 149.99,
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      level: 'Intermediate',
      language: 'FR',
      status: 'APPROVED',
      categoryId: 'cat-1',
      categoryName: 'Trading',
      instructorId: 'inst-1',
      instructorName: 'Sarah Johnson',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      sections: []
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Introduction à la Finance Décentralisée (DeFi)',
      slug: 'intro-finance-decentralisee',
      subtitle: 'Comprendre la DeFi et les Smart Contracts',
      description: 'Découvrez le futur de la finance...',
      price: 0,
      thumbnailUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
      level: 'Beginner',
      language: 'FR',
      status: 'APPROVED',
      categoryId: 'cat-2',
      categoryName: 'Cryptomonnaie',
      instructorId: 'inst-2',
      instructorName: 'Michael Chen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      sections: []
    }
  ];

  getPublishedCourses(): Observable<CourseResponseDTO[]> {
    // Remplacer par : return this.http.get<CourseResponseDTO[]>(`${this.apiUrl}/published`);
    return of(this.mockCourses.filter(c => c.status === 'APPROVED')).pipe(delay(500));
  }

  getCourseById(id: string): Observable<CourseResponseDTO | undefined> {
    // Remplacer par : return this.http.get<CourseResponseDTO>(`${this.apiUrl}/slug/${slug}`);
    return of(this.mockCourses.find(c => c.id === id)).pipe(delay(500));
  }
}