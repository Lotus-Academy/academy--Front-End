import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InstructorTermsResponse {
    id: string;
    version: string;
    content: string;
    isActive: boolean;
    releaseNotes: string;
    publishedAt: string;
}

// Interface pour le formulaire de création
export interface InstructorTermsCreate {
    content: string;
    releaseNotes: string;
}

@Injectable({
    providedIn: 'root'
})
export class InstructorTermsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/api/v1/legal/instructor-terms`;

    getActiveTerms(): Observable<InstructorTermsResponse> {
        return this.http.get<InstructorTermsResponse>(`${this.baseUrl}/active`);
    }

    getAllTermsVersions(): Observable<InstructorTermsResponse[]> {
        return this.http.get<InstructorTermsResponse[]>(this.baseUrl);
    }

    createNewVersion(dto: InstructorTermsCreate): Observable<InstructorTermsResponse> {
        return this.http.post<InstructorTermsResponse>(this.baseUrl, dto);
    }
}