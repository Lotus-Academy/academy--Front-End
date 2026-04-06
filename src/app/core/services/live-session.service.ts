import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LiveSessionStudentDTO, PageLiveSessionStudentDTO } from '../models/live-session.dto';

@Injectable({
    providedIn: 'root'
})
export class LiveSessionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1/live-sessions`;

    getUpcomingSessions(categoryId: string, page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams()
            .set('categoryId', categoryId)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(this.apiUrl, { params });
    }

    joinLiveSession(sessionId: string): Observable<LiveSessionStudentDTO> {
        // Le backend va appliquer le Gating ici et renvoyer une erreur 403 si l'utilisateur est Free
        return this.http.get<LiveSessionStudentDTO>(`${this.apiUrl}/${sessionId}/join`);
    }

    // --- Endpoints Instructeur / Admin ---

    scheduleSession(payload: any): Observable<LiveSessionStudentDTO> {
        return this.http.post<LiveSessionStudentDTO>(this.apiUrl, payload);
    }

    startSession(sessionId: string): Observable<string> {
        return this.http.patch<string>(`${this.apiUrl}/${sessionId}/start`, {});
    }

    completeSession(sessionId: string): Observable<string> {
        return this.http.patch<string>(`${this.apiUrl}/${sessionId}/complete`, {});
    }
}