import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    LiveSessionStudentDTO,
    LiveSessionInstructorDTO,
    PageLiveSessionStudentDTO,
    PageLiveSessionInstructorDTO
} from '../models/live-session.dto';

@Injectable({
    providedIn: 'root'
})
export class LiveSessionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1/live-sessions`;

    // ==========================================
    // ENDPOINTS ÉTUDIANTS / PUBLICS
    // ==========================================

    getUpcomingSessionsByCategory(categoryId: string, page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/category/${categoryId}`, { params });
    }

    // S'inscrire à une session (RSVP)
    registerForSession(sessionId: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/${sessionId}/register`, {}, { responseType: 'text' });
    }

    // Se désinscrire
    unregisterFromSession(sessionId: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/${sessionId}/unregister`, { responseType: 'text' });
    }

    // Mon emploi du temps (Sessions où je suis inscrit)
    getMyRegisteredSessions(page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/my-schedule`, { params });
    }

    // Rejoindre la salle de Live (récupère le lien WHEP si le statut est LIVE)
    joinLiveSession(sessionId: string): Observable<LiveSessionStudentDTO> {
        return this.http.get<LiveSessionStudentDTO>(`${this.apiUrl}/${sessionId}/join`);
    }

    // ==========================================
    // ENDPOINTS INSTRUCTEURS
    // ==========================================

    scheduleSession(payload: any): Observable<LiveSessionInstructorDTO> {
        return this.http.post<LiveSessionInstructorDTO>(this.apiUrl, payload);
    }

    getMyInstructorSessions(page: number = 0, size: number = 50): Observable<PageLiveSessionInstructorDTO> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageLiveSessionInstructorDTO>(`${this.apiUrl}/instructor/my-sessions`, { params });
    }

    startSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/${sessionId}/start`, {}, { responseType: 'text' });
    }

    completeSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/${sessionId}/complete`, {}, { responseType: 'text' });
    }

    cancelSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/${sessionId}/cancel`, {}, { responseType: 'text' });
    }
}