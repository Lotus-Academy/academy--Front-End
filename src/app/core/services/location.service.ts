import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LocationData {
    countryCode: string;
    currency: string;
    exchangeRate: number;
    symbol: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
    private http = inject(HttpClient);

    // Signal réactif contenant les données de localisation par défaut
    location = signal<LocationData>({
        countryCode: 'US',
        currency: 'USD',
        exchangeRate: 1,
        symbol: '$'
    });

    // Cache pour éviter les requêtes multiples
    private locationCache$?: Observable<LocationData>;

    fetchLocation(): Observable<LocationData> {
        if (!this.locationCache$) {
            this.locationCache$ = this.http.get<LocationData>(`${environment.apiUrl}/api/v1/location/me`).pipe(
                tap(data => {
                    if (data) {
                        this.location.set(data);
                    }
                }),
                catchError(() => {
                    // En cas d'erreur (ex: bloqueur de pub, API indisponible), on force le fallback
                    const fallback: LocationData = { countryCode: 'US', currency: 'USD', exchangeRate: 1, symbol: '$' };
                    this.location.set(fallback);
                    return of(fallback);
                }),
                shareReplay(1) // Conserve la dernière émission en mémoire pour les prochains abonnés
            );
        }
        return this.locationCache$;
    }
}