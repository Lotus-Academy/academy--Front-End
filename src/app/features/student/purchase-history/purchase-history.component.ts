import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { 
  LucideAngularModule, CreditCard, Receipt, ExternalLink, 
  CheckCircle, Loader2, AlertCircle, RefreshCw, XCircle 
} from 'lucide-angular';

import { PaymentService } from '../../../core/services/payment.service';
import { PaymentHistoryDTO } from '../../../core/models/payment.dto';
import { StudentLayoutComponent } from "../../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component";

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, DatePipe, CurrencyPipe, StudentLayoutComponent],
  templateUrl: './purchase-history.component.html'
})
export class PurchaseHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);

  readonly icons = { 
    CreditCard, Receipt, ExternalLink, CheckCircle, Loader2, AlertCircle, RefreshCw, XCircle 
  };

  payments = signal<PaymentHistoryDTO[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchHistory();
  }

  fetchHistory(): void {
    this.isLoading.set(true);
    this.paymentService.getMyPaymentHistory().subscribe({
      next: (data) => {
        this.payments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payment history', err);
        this.isLoading.set(false);
      }
    });
  }

  openReceipt(url: string | null): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}