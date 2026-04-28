import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CouponDTO {
    id?: string;
    code: string;
    discountPercentage: number;
    expiryDate: string;
    isActive?: boolean;
    maxUses: number;
    currentUses?: number;
}

export interface RefundResponseDTO {
    id: string;
    paymentId: string;
    courseTitle: string;
    amount: number;
    currency: string;
    studentEmail: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
}

export interface InstructorAdminItemDTO {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string;
    approvalStatus: string;
}

export interface InstructorBalanceDTO {
    totalEarned: number;
    totalPaid: number;
    pendingBalance: number;
    currency: string;
}

export interface PayoutCreateDTO {
    instructorId: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
}

export interface PayoutResponseDTO {
    id: string;
    instructorId: string;
    instructorName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    notes?: string; // Optionnel car il peut être vide
    paidAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminFinanceService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // --- COUPONS ---
    getAllCoupons(): Observable<CouponDTO[]> {
        return this.http.get<CouponDTO[]>(`${this.apiUrl}/api/v1/admin/coupons`);
    }

    createCoupon(data: CouponDTO): Observable<CouponDTO> {
        return this.http.post<CouponDTO>(`${this.apiUrl}/api/v1/admin/coupons`, data);
    }

    deactivateCoupon(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/api/v1/admin/coupons/${id}`);
    }

    // --- REFUNDS ---
    getAllRefunds(): Observable<RefundResponseDTO[]> {
        return this.http.get<RefundResponseDTO[]>(`${this.apiUrl}/api/v1/admin/refunds`);
    }

    approveRefund(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/api/v1/admin/refunds/${id}/approve`, {});
    }

    rejectRefund(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/api/v1/admin/refunds/${id}/reject`, {});
    }

    // --- INSTRUCTORS & PAYOUTS ---
    searchInstructors(search: string): Observable<{ content: InstructorAdminItemDTO[] }> {
        let params = new HttpParams().set('size', '10');
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<{ content: InstructorAdminItemDTO[] }>(`${this.apiUrl}/api/v1/admin/instructors`, { params });
    }

    getInstructorBalance(instructorId: string): Observable<InstructorBalanceDTO> {
        return this.http.get<InstructorBalanceDTO>(`${this.apiUrl}/api/v1/admin/instructors/${instructorId}/balance`);
    }

    getInstructorPayouts(instructorId: string): Observable<{ content: PayoutResponseDTO[] }> {
        return this.http.get<{ content: PayoutResponseDTO[] }>(`${this.apiUrl}/api/v1/admin/instructors/${instructorId}/payouts?size=5&sort=paidAt,DESC`);
    }

    recordPayout(data: PayoutCreateDTO): Observable<PayoutResponseDTO> {
        return this.http.post<PayoutResponseDTO>(`${this.apiUrl}/api/v1/admin/payouts`, data);
    }
}