import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  LucideAngularModule,
  Users,
  Search,
  Loader2,
  Mail,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  ShieldBan,
  Clock
} from 'lucide-angular';

import { AdminService, UserDTO } from '../../../core/services/admin.service';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TranslateModule, AdminLayoutComponent],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Users, Search, Loader2, Mail, Calendar, Eye, CheckCircle, XCircle, ShieldBan, Clock };

  // État Global
  isLoading = signal<boolean>(true);
  students = signal<UserDTO[]>([]);
  totalStudents = signal<number>(0);

  // Pagination et Recherche
  currentPage = signal<number>(0);
  pageSize = 50;
  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadStudents();

    // Configuration du debounce pour la recherche (évite de spammer l'API à chaque frappe)
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchQuery.set(query);
      this.currentPage.set(0); // Retour à la première page lors d'une nouvelle recherche
      this.loadStudents();
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.adminService.getAllStudents(this.currentPage(), this.pageSize, this.searchQuery()).subscribe({
      next: (response) => {
        this.students.set(response.content);
        this.totalStudents.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des étudiants:', err);
        this.isLoading.set(false);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  // Fonctions utilitaires pour le template
  getStatusConfig(status: string) {
    switch (status) {
      case 'ACTIVE':
        return { class: 'bg-green/10 text-green border-green/20', icon: this.icons.CheckCircle, labelKey: 'ADMIN_STUDENTS.STATUS_ACTIVE' };
      case 'PENDING_VERIFICATION':
        return { class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-500', icon: this.icons.Clock, labelKey: 'ADMIN_STUDENTS.STATUS_PENDING' };
      case 'BANNED':
        return { class: 'bg-red-500/10 text-red-500 border-red-500/20', icon: this.icons.ShieldBan, labelKey: 'ADMIN_STUDENTS.STATUS_BANNED' };
      case 'PAUSED':
        return { class: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-ds-border/50 dark:text-ds-muted', icon: this.icons.XCircle, labelKey: 'ADMIN_STUDENTS.STATUS_PAUSED' };
      default:
        return { class: 'bg-slate-100 text-slate-600 border-slate-200', icon: this.icons.Users, labelKey: status };
    }
  }
}