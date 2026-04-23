export interface PaymentHistoryDTO {
  courseTitle: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  receiptUrl: string | null;
  appliedCouponCode?: string;
}