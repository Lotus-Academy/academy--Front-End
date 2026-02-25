import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
  LayoutDashboard,
  Loader2,
  X // Ajout de l'icône X pour fermer la modale
} from 'lucide-angular';

import { AdminService, AdminInstructorDTO, CategoryDTO, DashboardStatsDTO } from '../../../core/services/admin.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  // Ajout de ReactiveFormsModule ici
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  readonly icons = {
    Users, Video, UserCheck, Clock, CheckCircle,
    XCircle, Eye, FolderPlus, Pencil, BookOpen, Search, LayoutDashboard, Loader2, X
  };

  // État de la navigation
  activeTab = signal<'overview' | 'courses' | 'instructors' | 'categories'>('overview');
  isLoading = signal<boolean>(true);
  processingActionIds = signal<Set<string>>(new Set());

  // Gestion de la modale Catégorie
  isCategoryModalOpen = signal<boolean>(false);
  isSavingCategory = signal<boolean>(false);

  // Formulaire de catégorie (Aligné sur CategoryCreateDTO)
  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]]
  });

  // Données
  courses = signal<CourseResponseDTO[]>([]);
  instructors = signal<AdminInstructorDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  dashboardStats = signal<DashboardStatsDTO | null>(null);

  searchQuery = signal<string>('');

  stats = computed(() => {
    const apiStats = this.dashboardStats();
    return [
      { label: 'Utilisateurs Totaux', value: apiStats?.totalUsers || 1284, icon: this.icons.Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
      { label: 'Candidatures Instructeurs', value: this.instructors().filter(i => i.status === 'PENDING').length, icon: this.icons.UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
      { label: 'Cours en attente', value: this.courses().filter(c => c.status === 'PENDING_REVIEW').length, icon: this.icons.Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
      { label: 'Cours Approuvés', value: this.courses().filter(c => c.status === 'APPROVED').length, icon: this.icons.CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400' }
    ];
  });

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.courses().filter(c =>
      c.title.toLowerCase().includes(query) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      coursesRes: this.adminService.getAllCourses(0, 50),
      instructorsRes: this.adminService.getAllInstructors(0, 50),
      categoriesRes: this.adminService.getCategories(),
      statsRes: this.adminService.getDashboardStats()
    }).subscribe({
      next: (results) => {
        this.courses.set(results.coursesRes.content);
        this.instructors.set(results.instructorsRes.content);
        this.categories.set(results.categoriesRes);
        this.dashboardStats.set(results.statsRes);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données du dashboard :', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- ACTIONS SUR LES COURS ---

  isProcessing(id: string): boolean {
    return this.processingActionIds().has(id);
  }

  setProcessing(id: string, isProcessing: boolean): void {
    this.processingActionIds.update(set => {
      const newSet = new Set(set);
      isProcessing ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
  }

  approveCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.approveCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'APPROVED' } : c));
        this.setProcessing(courseId, false);
      },
      error: (err) => {
        console.error('Erreur lors de l\'approbation du cours', err);
        this.setProcessing(courseId, false);
      }
    });
  }

  rejectCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.rejectCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'REJECTED' } : c));
        this.setProcessing(courseId, false);
      },
      error: (err) => {
        console.error('Erreur lors du rejet du cours', err);
        this.setProcessing(courseId, false);
      }
    });
  }

  // --- GESTION DE LA MODALE CATÉGORIE ---

  openCategoryModal(): void {
    this.categoryForm.reset();
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSavingCategory.set(true);

    this.adminService.createCategory(this.categoryForm.value).subscribe({
      next: () => {
        this.isSavingCategory.set(false);
        this.closeCategoryModal();
        // On recharge uniquement les catégories pour mettre à jour la liste
        this.adminService.getCategories().subscribe({
          next: (cats) => this.categories.set(cats),
          error: (err) => console.error('Erreur lors du rafraîchissement des catégories', err)
        });
      },
      error: (err) => {
        console.error('Erreur lors de la création de la catégorie', err);
        this.isSavingCategory.set(false);
      }
    });
  }
}