import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  LucideAngularModule,
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  CreditCard,
  ArrowUpRight,
  Download
} from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService, DashboardStatsDTO, AdminPaymentDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AdminLayoutComponent, CurrencyPipe, DatePipe],
  templateUrl: './admin-analytics.component.html'
})
export class AdminAnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { TrendingUp, DollarSign, Users, BookOpen, CreditCard, ArrowUpRight, Download };

  isLoading = signal<boolean>(true);

  // Données
  stats = signal<DashboardStatsDTO | null>(null);
  recentPayments = signal<AdminPaymentDTO[]>([]);

  // Calcul dynamique pour l'affichage des KPI en haut de page
  kpiCards = computed(() => {
    const data = this.stats();
    return [
      {
        title: 'Revenus Totaux',
        value: data?.totalRevenue || 0,
        isCurrency: true,
        icon: this.icons.DollarSign,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30'
      },
      {
        title: 'Utilisateurs Actifs',
        value: data?.totalUsers || 0,
        isCurrency: false,
        icon: this.icons.Users,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30'
      },
      {
        title: 'Cours Publiés',
        value: data?.totalCourses || 0,
        isCurrency: false,
        icon: this.icons.BookOpen,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-900/30'
      },
      {
        title: 'Inscriptions',
        // Adaptez selon les champs réels de votre DashboardStatsDTO
        value: (data as any)?.totalEnrollments || 0,
        isCurrency: false,
        icon: this.icons.TrendingUp,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/30'
      }
    ];
  });

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading.set(true);

    forkJoin({
      statsRes: this.adminService.getDashboardStats(),
      paymentsRes: this.adminService.getAllPayments(0, 20) // On prend les 20 derniers paiements pour le dashboard
    }).subscribe({
      next: (results) => {
        this.stats.set(results.statsRes);
        this.recentPayments.set(results.paymentsRes.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des analytiques', err);
        this.isLoading.set(false);
      }
    });
  }

  exportData(): void {
    // Fonctionnalité future : Générer un CSV des transactions
    alert('Fonctionnalité d\'exportation CSV à venir.');
  }
}