import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  LucideAngularModule, Ticket, Banknote, Undo2, Plus, Ban,
  CheckCircle, XCircle, Loader2, Send, Search, User, DollarSign, History
} from 'lucide-angular';

import {
  AdminFinanceService, CouponDTO, RefundResponseDTO,
  InstructorAdminItemDTO, InstructorBalanceDTO, PayoutResponseDTO
} from '../../../core/services/admin-finance.service';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

type FinanceTab = 'COUPONS' | 'REFUNDS' | 'PAYOUTS';

@Component({
  selector: 'app-admin-finance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, AdminLayoutComponent],
  templateUrl: './admin-finance.component.html'
})
export class AdminFinanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financeService = inject(AdminFinanceService);

  readonly icons = { Ticket, Banknote, Undo2, Plus, Ban, CheckCircle, XCircle, Loader2, Send, Search, User, DollarSign, History };

  activeTab = signal<FinanceTab>('COUPONS');

  // Data States
  coupons = signal<CouponDTO[]>([]);
  refunds = signal<RefundResponseDTO[]>([]);

  // Instructor Payout States
  instructors = signal<InstructorAdminItemDTO[]>([]);
  selectedInstructor = signal<InstructorAdminItemDTO | null>(null);
  instructorBalance = signal<InstructorBalanceDTO | null>(null);
  recentPayouts = signal<PayoutResponseDTO[]>([]);
  isSearching = signal<boolean>(false);
  isFetchingDetails = signal<boolean>(false);

  searchControl = new FormControl('');

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  globalMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

  couponForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
    discountPercentage: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    maxUses: [100, [Validators.required, Validators.min(1)]],
    expiryDate: ['', [Validators.required]]
  });

  payoutForm: FormGroup = this.fb.group({
    instructorId: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['BANK_TRANSFER', [Validators.required]],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadDataForCurrentTab();

    // Listen to instructor search input
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.fetchInstructors(term || '');
    });
  }

  setTab(tab: FinanceTab) {
    this.activeTab.set(tab);
    this.globalMessage.set(null);
    this.loadDataForCurrentTab();
  }

  loadDataForCurrentTab() {
    this.isLoading.set(true);
    if (this.activeTab() === 'COUPONS') {
      this.financeService.getAllCoupons().subscribe({
        next: (data) => { this.coupons.set(data); this.isLoading.set(false); },
        error: () => this.showError("Failed to load coupons.")
      });
    } else if (this.activeTab() === 'REFUNDS') {
      this.financeService.getAllRefunds().subscribe({
        next: (data) => { this.refunds.set(data); this.isLoading.set(false); },
        error: () => this.showError("Failed to load refund requests.")
      });
    } else {
      this.fetchInstructors('');
    }
  }

  // --- ACTIONS COUPONS ---
  onSubmitCoupon() {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const formValue = this.couponForm.value;
    const isoDate = new Date(formValue.expiryDate).toISOString();

    const newCoupon: CouponDTO = { ...formValue, expiryDate: isoDate };

    this.financeService.createCoupon(newCoupon).subscribe({
      next: (created) => {
        this.coupons.update(c => [created, ...c]);
        this.couponForm.reset({ discountPercentage: 10, maxUses: 100 });
        this.showSuccess("Coupon created successfully!");
      },
      error: (err) => this.showError(err.error?.message || "Error creating coupon.")
    });
  }

  deactivateCoupon(id: string) {
    if (!confirm("Are you sure you want to deactivate this coupon?")) return;

    this.financeService.deactivateCoupon(id).subscribe({
      next: () => {
        this.coupons.update(list => list.map(c => c.id === id ? { ...c, isActive: false } : c));
        this.showSuccess("Coupon deactivated.");
      },
      error: () => this.showError("Failed to deactivate coupon.")
    });
  }

  // --- ACTIONS REFUNDS ---
  handleRefund(id: string, action: 'approve' | 'reject') {
    if (!confirm(`Are you sure you want to ${action} this refund request?`)) return;

    const request$ = action === 'approve'
      ? this.financeService.approveRefund(id)
      : this.financeService.rejectRefund(id);

    request$.subscribe({
      next: () => {
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        this.refunds.update(list => list.map(r => r.id === id ? { ...r, status: newStatus } : r));
        this.showSuccess(`Refund ${action}d successfully.`);
      },
      error: () => this.showError("Operation failed.")
    });
  }

  // --- ACTIONS INSTRUCTORS PAYOUTS ---
  fetchInstructors(term: string) {
    this.isSearching.set(true);
    this.financeService.searchInstructors(term).subscribe({
      next: (data) => {
        this.instructors.set(data.content);
        this.isSearching.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.isSearching.set(false);
        this.isLoading.set(false);
      }
    });
  }

  selectInstructor(instructor: InstructorAdminItemDTO) {
    this.selectedInstructor.set(instructor);
    this.isFetchingDetails.set(true);
    this.instructorBalance.set(null);
    this.recentPayouts.set([]);

    // Initialize payout form
    this.payoutForm.patchValue({ instructorId: instructor.userId, amount: 0 });

    // Fetch Balance
    this.financeService.getInstructorBalance(instructor.userId).subscribe({
      next: (balance) => {
        this.instructorBalance.set(balance);
        this.payoutForm.patchValue({ amount: balance.pendingBalance }); // Auto-fill pending balance
        this.isFetchingDetails.set(false);
      },
      error: () => {
        this.showError("Failed to fetch instructor balance.");
        this.isFetchingDetails.set(false);
      }
    });

    // Fetch Recent Payouts
    this.financeService.getInstructorPayouts(instructor.userId).subscribe({
      next: (res) => this.recentPayouts.set(res.content)
    });
  }

  onSubmitPayout() {
    if (this.payoutForm.invalid) {
      this.payoutForm.markAllAsTouched();
      return;
    }

    const amount = this.payoutForm.value.amount;
    if (!confirm(`Confirm payout of $${amount} to this instructor?`)) return;

    this.isSubmitting.set(true);

    this.financeService.recordPayout(this.payoutForm.value).subscribe({
      next: () => {
        this.payoutForm.reset({ paymentMethod: 'BANK_TRANSFER', amount: 0 });
        this.showSuccess("Payout recorded successfully.");
        // Refresh balance
        if (this.selectedInstructor()) this.selectInstructor(this.selectedInstructor()!);
      },
      error: (err) => this.showError(err.error?.message || "Error recording payout.")
    });
  }

  // --- UTILS ---
  private showSuccess(msg: string) {
    this.isSubmitting.set(false);
    this.globalMessage.set({ type: 'success', text: msg });
    setTimeout(() => this.globalMessage.set(null), 5000);
  }

  private showError(msg: string) {
    this.isSubmitting.set(false);
    this.globalMessage.set({ type: 'error', text: msg });
    setTimeout(() => this.globalMessage.set(null), 5000);
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}