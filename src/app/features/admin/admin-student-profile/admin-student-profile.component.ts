import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ShieldBan,
  Clock,
  BookOpen,
  CreditCard,
  Award,
  ExternalLink
} from 'lucide-angular';

import { AdminService, AdminUserDetailsDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-student-profile.component.html'
})
export class AdminStudentProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);

  readonly icons = { ArrowLeft, Loader2, Mail, Calendar, CheckCircle, XCircle, ShieldBan, Clock, BookOpen, CreditCard, Award, ExternalLink };

  userId = signal<string | null>(null);
  user = signal<AdminUserDetailsDTO | null>(null);

  // Signaux pour les listes tabulaires, extraits de l'objet principal
  enrollments = signal<any[]>([]);
  payments = signal<any[]>([]);
  certificates = signal<any[]>([]);

  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  activeTab = signal<'enrollments' | 'payments' | 'certificates'>('enrollments');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadStudentData(id);
    } else {
      this.error.set('ADMIN_STUDENT_PROFILE.ERROR_NO_ID');
      this.isLoading.set(false);
    }
  }

  loadStudentData(id: string): void {
    this.isLoading.set(true);

    // Un seul appel API qui récupère tout le payload !
    this.adminService.getUserDetails(id).subscribe({
      next: (data: AdminUserDetailsDTO) => {
        this.user.set(data);

        // On dispatche les tableaux directement depuis la réponse globale
        this.enrollments.set(data.enrollments || []);
        this.payments.set(data.payments || []);

        // Si le backend renvoie les certificats dans cet objet à l'avenir, ils seront captés
        this.certificates.set((data as any).certificates || []);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données étudiant:', err);
        this.error.set('ADMIN_STUDENT_PROFILE.ERROR_FETCHING');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  getStatusConfig(status: string | undefined) {
    switch (status) {
      case 'ACTIVE': return { class: 'bg-green/10 text-green border-green/20', icon: this.icons.CheckCircle, labelKey: 'ADMIN_STUDENTS.STATUS_ACTIVE' };
      case 'PENDING_VERIFICATION': return { class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: this.icons.Clock, labelKey: 'ADMIN_STUDENTS.STATUS_PENDING' };
      case 'BANNED': return { class: 'bg-red-500/10 text-red-500 border-red-500/20', icon: this.icons.ShieldBan, labelKey: 'ADMIN_STUDENTS.STATUS_BANNED' };
      case 'PAUSED': return { class: 'bg-slate-100 text-slate-600 border-slate-200', icon: this.icons.XCircle, labelKey: 'ADMIN_STUDENTS.STATUS_PAUSED' };
      default: return { class: 'bg-slate-100 text-slate-600 border-slate-200', icon: this.icons.CheckCircle, labelKey: status || 'UNKNOWN' };
    }
  }
}