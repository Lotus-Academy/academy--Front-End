import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Video,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FolderPlus,
  Pencil,
  BookOpen,
  Search,
  LayoutDashboard
} from 'lucide-angular';

import { AdminService, AdminCourseDTO, AdminInstructorDTO, AdminCategoryDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Users, Video, UserCheck, Clock, CheckCircle, XCircle, Eye, FolderPlus, Pencil, BookOpen, Search, LayoutDashboard };

  // État de la navigation
  activeTab = signal<'overview' | 'courses' | 'instructors' | 'categories'>('overview');
  isLoading = signal<boolean>(true);

  // Données
  courses = signal<AdminCourseDTO[]>([]);
  instructors = signal<AdminInstructorDTO[]>([]);
  categories = signal<AdminCategoryDTO[]>([]);

  // Filtres (Recherche)
  searchQuery = signal<string>('');

  // Statistiques calculées
  stats = computed(() => [
    { label: 'Utilisateurs Totaux', value: 1284, icon: this.icons.Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Candidatures Instructeurs', value: this.instructors().filter(i => i.status === 'PENDING').length, icon: this.icons.UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Cours en attente', value: this.courses().filter(c => c.status === 'PENDING_REVIEW').length, icon: this.icons.Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { label: 'Cours Approuvés', value: this.courses().filter(c => c.status === 'APPROVED').length, icon: this.icons.CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400' }
  ]);

  // Cours filtrés
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.courses().filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.instructorName.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Simplification : on attend que tous les appels soient terminés
    // Dans un cas réel, utiliser forkJoin de RxJS
    this.adminService.getPendingCourses().subscribe(c => {
      this.courses.set(c);
      this.adminService.getPendingInstructors().subscribe(i => {
        this.instructors.set(i);
        this.adminService.getCategories().subscribe(cat => {
          this.categories.set(cat);
          this.isLoading.set(false);
        });
      });
    });
  }

  // --- ACTIONS ---

  handleCourseStatus(courseId: string, status: 'APPROVED' | 'REJECTED'): void {
    this.adminService.updateCourseStatus(courseId, status).subscribe(() => {
      this.courses.update(courses =>
        courses.map(c => c.id === courseId ? { ...c, status } : c)
      );
    });
  }

  handleInstructorStatus(instructorId: string, status: 'APPROVED' | 'REJECTED'): void {
    this.adminService.updateInstructorStatus(instructorId, status).subscribe(() => {
      this.instructors.update(instructors =>
        instructors.map(i => i.id === instructorId ? { ...i, status } : i)
      );
    });
  }
}