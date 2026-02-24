import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseResponseDTO } from '../models/course.dto';

// Basé sur votre CourseResumeDTO.java
export interface CourseResumeDTO {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  lastWatchedLessonId: string;
  lastWatchedLessonTitle: string;
  lastWatchedTimestamp: number;
  lastWatchedAt: string;
  courseProgressPercentage: number;
}

export interface FollowedInstructorDTO {
  id: string;
  instructorId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/student`;

  // --- MOCKS ---
  private mockInProgress: CourseResumeDTO[] = [
    {
      courseId: '1', courseTitle: 'Maîtriser l\'Analyse Technique', courseThumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
      lastWatchedLessonId: 'l1', lastWatchedLessonTitle: 'Les figures chartistes avancées',
      lastWatchedTimestamp: 450, lastWatchedAt: new Date().toISOString(), courseProgressPercentage: 65
    },
    {
      courseId: '2', courseTitle: 'Introduction à la Finance Décentralisée', courseThumbnail: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400',
      lastWatchedLessonId: 'l2', lastWatchedLessonTitle: 'Comprendre les Smart Contracts',
      lastWatchedTimestamp: 120, lastWatchedAt: new Date().toISOString(), courseProgressPercentage: 20
    }
  ];

  private mockFollowing: FollowedInstructorDTO[] = [
    { id: 'f1', instructorId: 'inst-1', displayName: 'Martinien GABA' },
    { id: 'f2', instructorId: 'inst-2', displayName: 'Sarah Johnson' }
  ];

  // --- API CALLS ---
  getInProgressCourses(): Observable<CourseResumeDTO[]> {
    return of(this.mockInProgress).pipe(delay(500));
  }

  getFollowedInstructors(): Observable<FollowedInstructorDTO[]> {
    return of(this.mockFollowing).pipe(delay(500));
  }

  getCategories(): Observable<CategoryDTO[]> {
    return of([
      { id: 'cat-1', name: 'Trading' },
      { id: 'cat-2', name: 'Cryptomonnaie' },
      { id: 'cat-3', name: 'Programmation' }
    ]).pipe(delay(500));
  }
}