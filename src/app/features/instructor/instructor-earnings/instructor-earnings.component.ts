import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, DollarSign, Wallet, ArrowDownCircle, Clock, CheckCircle, FileText, Loader2
} from 'lucide-angular';

import { InstructorProfileService } from '../../../core/services/instructor-profile.service';
import { InstructorLayoutComponent } from '../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component';

@Component({
  selector: 'app-instructor-earnings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule, InstructorLayoutComponent],
  templateUrl: './instructor-earnings.component.html'
})
export class InstructorEarningsComponent implements OnInit {
  private profileService = inject(InstructorProfileService);

  readonly icons = { DollarSign, Wallet, ArrowDownCircle, Clock, CheckCircle, FileText, Loader2 };

  isLoading = signal<boolean>(true);

  // Données de solde
  balance = signal<any | null>(null);

  // Données d'historique de paiement
  payouts = signal<any[]>([]);

  ngOnInit(): void {
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    this.isLoading.set(true);

    // On pourrait utiliser forkJoin ici, mais des requêtes séquentielles ou indépendantes suffisent souvent.
    this.profileService.getMyBalance().subscribe({
      next: (balanceData) => {
        this.balance.set(balanceData);
        this.loadPayouts(); // On charge les paiements après avoir reçu le solde
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la balance', err);
        this.isLoading.set(false);
      }
    });
  }

  loadPayouts(): void {
    this.profileService.getMyPayoutHistory(0, 50).subscribe({
      next: (payoutData) => {
        // Gère les retours paginés
        this.payouts.set(payoutData.content || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'historique des paiements', err);
        this.isLoading.set(false);
      }
    });
  }
}