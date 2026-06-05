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

    location = signal<LocationData>({
        countryCode: 'US',
        currency: 'USD',
        exchangeRate: 1,
        symbol: '$'
    });

    private locationCache$?: Observable<LocationData>;

    fetchLocation(): Observable<LocationData> {
        if (!this.locationCache$) {
            this.locationCache$ = this.http.get<LocationData>(`${environment.apiUrl}/api/v1/location/me`).pipe(
                tap(data => {
                    console.log('✅ Données reçues du backend :', data);
                    if (data) {
                        this.location.set(data);
                    }
                }),
                catchError(() => {
                    const fallback: LocationData = { countryCode: 'US', currency: 'USD', exchangeRate: 1, symbol: '$' };
                    this.location.set(fallback);
                    return of(fallback);
                }),
                shareReplay(1)
            );
        }
        return this.locationCache$;
    }
}