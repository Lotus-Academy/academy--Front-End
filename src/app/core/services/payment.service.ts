import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentHistoryDTO } from '../models/payment.dto';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/payments`;

  /**
   * Appelle le backend pour générer une session Stripe Checkout.
   * Retourne l'URL de redirection sous forme de texte pur.
   */
  createCheckoutSession(courseId: string, couponCode?: string): Observable<string> {
    let params = new HttpParams();
    if (couponCode) {
      params = params.set('coupon', couponCode);
    }

    return this.http.post<any>(`${this.baseUrl}/checkout/${courseId}`, null, { params });
  }

  /**
   * Récupère l'historique complet des achats de l'étudiant
   */
  getMyPaymentHistory(): Observable<PaymentHistoryDTO[]> {
    return this.http.get<PaymentHistoryDTO[]>(`${this.baseUrl}/history`);
  }
}