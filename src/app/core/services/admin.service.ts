import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminCourseDTO {
  id: string;
  title: string;
  instructorName: string;
  categoryName: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AdminInstructorDTO {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
}

export interface AdminCategoryDTO {
  id: string;
  name: string;
  courseCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/admin`;

  // Mocks
  private mockCourses: AdminCourseDTO[] = [
    { id: '1', title: 'Maîtriser le Trading Algorithmique', instructorName: 'Sarah Johnson', categoryName: 'Trading', status: 'PENDING_REVIEW', createdAt: new Date().toISOString() },
    { id: '2', title: 'Introduction à la DeFi', instructorName: 'Michael Chen', categoryName: 'Cryptomonnaie', status: 'APPROVED', createdAt: new Date().toISOString() }
  ];

  private mockInstructors: AdminInstructorDTO[] = [
    { id: '1', name: 'Emily Davis', email: 'emily@example.com', specialty: 'Analyse Technique', status: 'PENDING', appliedAt: new Date().toISOString() }
  ];

  private mockCategories: AdminCategoryDTO[] = [
    { id: '1', name: 'Trading', courseCount: 45 },
    { id: '2', name: 'Cryptomonnaie', courseCount: 32 }
  ];

  getPendingCourses(): Observable<AdminCourseDTO[]> {
    return of(this.mockCourses).pipe(delay(500));
  }

  getPendingInstructors(): Observable<AdminInstructorDTO[]> {
    return of(this.mockInstructors).pipe(delay(500));
  }

  getCategories(): Observable<AdminCategoryDTO[]> {
    return of(this.mockCategories).pipe(delay(500));
  }

  updateCourseStatus(courseId: string, status: 'APPROVED' | 'REJECTED'): Observable<any> {
    console.log(`Cours ${courseId} mis à jour au statut : ${status}`);
    return of({ success: true }).pipe(delay(300));
  }

  updateInstructorStatus(instructorId: string, status: 'APPROVED' | 'REJECTED'): Observable<any> {
    console.log(`Instructeur ${instructorId} mis à jour au statut : ${status}`);
    return of({ success: true }).pipe(delay(300));
  }
}