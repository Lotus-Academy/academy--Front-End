import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PlatformSettings {
    id?: string;
    defaultInstructorRate: number;
    premiumInstructorRate: number;
    eliteInstructorRate: number;
    premiumReferralThreshold: number;
    eliteReferralThreshold: number;
    lastUpdatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminSettingsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getPlatformSettings(): Observable<PlatformSettings> {
        return this.http.get<PlatformSettings>(`${this.apiUrl}/api/v1/admin/settings`);
    }

    updatePlatformSettings(settings: PlatformSettings): Observable<PlatformSettings> {
        return this.http.put<PlatformSettings>(`${this.apiUrl}/api/v1/admin/settings`, settings);
    }
}