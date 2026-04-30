import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStatsDTO {
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    pendingCoursesCount: number;
    totalEnrollments: number;
    totalRevenue: number;
    totalCertificatesIssued: number;
}

export type AnalyticsPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

@Injectable({
    providedIn: 'root'
})
export class AdminAnalyticsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getDashboardStats(): Observable<DashboardStatsDTO> {
        return this.http.get<DashboardStatsDTO>(`${this.apiUrl}/api/v1/admin/stats`);
    }

    getUserRegistrationStats(role: UserRole, period: AnalyticsPeriod, startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('role', role)
            .set('period', period)
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<any>(`${this.apiUrl}/api/v1/admin/analytics/users/registrations`, { params });
    }

    getPlatformRevenueStats(period: AnalyticsPeriod, startDate: string, endDate: string): Observable<any> {
        const params = new HttpParams()
            .set('period', period)
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<any>(`${this.apiUrl}/api/v1/admin/analytics/finance/revenue/timeline`, { params });
    }

    getRevenueByInstructor(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/api/v1/admin/analytics/finance/revenue/by-instructor`, { params });
    }

    getRevenueByCourse(page: number = 0, size: number = 10): Observable<any> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/api/v1/admin/analytics/finance/revenue/by-course`, { params });
    }
}