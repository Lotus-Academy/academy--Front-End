import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, CreditCard, ExternalLink, Download } from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService, AdminPaymentDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminLayoutComponent, CurrencyPipe, DatePipe],
  templateUrl: './admin-payments.component.html'
})
export class AdminPaymentsComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Search, CreditCard, ExternalLink, Download };

  isLoading = signal<boolean>(true);
  payments = signal<AdminPaymentDTO[]>([]);
  searchQuery = signal<string>('');

  // Filtrage réactif (par titre de cours ou email)
  filteredPayments = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.payments().filter(p =>
      (p.courseTitle && p.courseTitle.toLowerCase().includes(query)) ||
      (p.studentEmail && p.studentEmail.toLowerCase().includes(query)) ||
      (p.status && p.status.toLowerCase().includes(query))
    );
  });

  // Calcul du volume total affiché
  totalVolume = computed(() => {
    return this.filteredPayments().reduce((acc, curr) => acc + curr.amount, 0);
  });

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    // On charge la première page, taille 50 (vous pourrez ajouter une vraie pagination visuelle plus tard)
    this.adminService.getAllPayments(0, 50).subscribe({
      next: (res) => {
        // Attention : On extrait bien 'content' de la réponse paginée de Spring Boot
        this.payments.set(res.content || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des paiements:', err);
        this.isLoading.set(false);
      }
    });
  }
}