import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// --- DTOs basés sur le Swagger ---

export interface LiveSessionStudentDTO {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    whepUrl?: string;
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';
    isRegistered: boolean;
    courseId: string;
    categoryId: string;
}

export interface LiveSessionInstructorDTO {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    whepUrl?: string;
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';
    streamPath: string;
    streamKey: string;
    serUrlForObs: string;
    courseId: string;
    categoryId: string;
}

export interface LiveSessionCreateDTO {
    title: string;
    description?: string;
    courseId: string;
    scheduledAt: string; // Format ISO-8601
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';
    autoTraderEnabled?: boolean;
}

export interface PageLiveSessionStudentDTO {
    content: LiveSessionStudentDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
}

export interface PageLiveSessionInstructorDTO {
    content: LiveSessionInstructorDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class LiveSessionService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // ==========================================
    // ENDPOINTS ÉTUDIANTS
    // ==========================================

    /**
     * Rejoindre une session en direct (Retourne l'URL WHEP si la session est LIVE et l'étudiant inscrit au cours)
     */
    joinLiveSession(sessionId: string): Observable<LiveSessionStudentDTO> {
        return this.http.get<LiveSessionStudentDTO>(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/join`);
    }

    /**
     * S'inscrire (RSVP) à une session programmée (Réservé aux inscrits du cours)
     */
    registerForSession(sessionId: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/register`, {}, { responseType: 'text' });
    }

    /**
     * Annuler son inscription (RSVP) à une session
     */
    unregisterFromSession(sessionId: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/unregister`, { responseType: 'text' });
    }

    /**
     * Récupérer le planning des sessions auxquelles l'étudiant est inscrit (RSVP)
     */
    getMySchedule(page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/api/v1/live-sessions/my-schedule`, { params });
    }

    /**
     * Liste des sessions à venir pour un cours spécifique
     */
    getUpcomingSessionsByCourse(courseId: string, page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/api/v1/live-sessions/course/${courseId}`, { params });
    }

    /**
     * Liste des sessions à venir pour une catégorie entière
     */
    getUpcomingSessionsByCategory(categoryId: string, page: number = 0, size: number = 20): Observable<PageLiveSessionStudentDTO> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/api/v1/live-sessions/category/${categoryId}`, { params });
    }


    // ==========================================
    // ENDPOINTS INSTRUCTEURS
    // ==========================================

    /**
     * Planifier une nouvelle session en direct
     */
    scheduleSession(data: LiveSessionCreateDTO): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/api/v1/live-sessions`, data);
    }

    /**
     * Mettre à jour une session programmée
     */
    updateSession(sessionId: string, data: LiveSessionCreateDTO): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/api/v1/live-sessions/${sessionId}`, data);
    }

    /**
     * Démarrer une session (Passe le statut à LIVE)
     */
    startSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/start`, {}, { responseType: 'text' });
    }

    /**
     * Terminer une session (Passe le statut à COMPLETED)
     */
    completeSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/complete`, {}, { responseType: 'text' });
    }

    /**
     * Annuler une session (Passe le statut à CANCELLED)
     */
    cancelSession(sessionId: string): Observable<string> {
        return this.http.patch(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/cancel`, {}, { responseType: 'text' });
    }

    /**
     * Récupérer la liste des sessions créées par l'instructeur
     */
    getMyInstructorSessions(page: number = 0, size: number = 20): Observable<PageLiveSessionInstructorDTO> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<PageLiveSessionInstructorDTO>(`${this.apiUrl}/api/v1/live-sessions/instructor/my-sessions`, { params });
    }

    /**
     * Voir les étudiants inscrits (RSVP) à une session spécifique
     */
    getSessionAttendees(sessionId: string, page: number = 0, size: number = 50): Observable<any> {
        const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        return this.http.get<any>(`${this.apiUrl}/api/v1/live-sessions/${sessionId}/attendees`, { params });
    }


    // ==========================================
    // ENDPOINTS ADMIN (Modération globale)
    // ==========================================

    /**
     * Lister toutes les sessions (Vue Admin)
     */
    getAllSessionsForAdmin(statusFilter?: string, instructorId?: string, page: number = 0, size: number = 50): Observable<PageLiveSessionStudentDTO> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
        if (statusFilter) params = params.set('statusFilter', statusFilter);
        if (instructorId) params = params.set('instructorId', instructorId);

        return this.http.get<PageLiveSessionStudentDTO>(`${this.apiUrl}/api/v1/live-sessions/admin/all`, { params });
    }

    /**
     * Forcer la suppression définitive d'une session
     */
    forceDeleteSession(sessionId: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/api/v1/live-sessions/admin/${sessionId}`, { responseType: 'text' });
    }

    /**
     * Bannir / Retirer un étudiant d'une session
     */
    removeStudentFromSession(sessionId: string, studentId: string): Observable<string> {
        return this.http.delete(`${this.apiUrl}/api/v1/live-sessions/admin/${sessionId}/attendees/${studentId}`, { responseType: 'text' });
    }
}