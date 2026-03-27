import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
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
  X,
  Upload, // <-- AJOUT POUR L'UPLOAD
  Image as ImageIcon // <-- AJOUT POUR LE FALLBACK
} from 'lucide-angular';

import { AdminService, AdminInstructorDTO, DashboardStatsDTO } from '../../../core/services/admin.service';
import { CourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  readonly icons = {
    Users, Video, UserCheck, Clock, CheckCircle,
    XCircle, Eye, FolderPlus, Pencil, BookOpen, Search, LayoutDashboard, Loader2, X, Upload, ImageIcon
  };

  activeTab = signal<'overview' | 'courses' | 'instructors' | 'categories'>('overview');
  isLoading = signal<boolean>(true);
  processingActionIds = signal<Set<string>>(new Set());

  // --- NOUVEAU : GESTION DE L'ICÔNE CATÉGORIE ---
  isCategoryModalOpen = signal<boolean>(false);
  isSavingCategory = signal<boolean>(false);
  selectedIconFile = signal<File | null>(null);
  iconPreview = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]]
  });

  courses = signal<CourseResponseDTO[]>([]);
  instructors = signal<AdminInstructorDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  dashboardStats = signal<DashboardStatsDTO | null>(null);

  searchQuery = signal<string>('');

  stats = computed(() => {
    const apiStats = this.dashboardStats();
    return [
      { labelKey: 'ADMIN_DASHBOARD.STATS.USERS', value: apiStats?.totalStudents || 0, icon: this.icons.Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
      { labelKey: 'ADMIN_DASHBOARD.STATS.PENDING_INSTRUCTORS', value: this.instructors().filter(i => i.approvalStatus === 'PENDING').length, icon: this.icons.UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
      { labelKey: 'ADMIN_DASHBOARD.STATS.PENDING_COURSES', value: apiStats?.pendingCoursesCount || 0, icon: this.icons.Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
      { labelKey: 'ADMIN_DASHBOARD.STATS.APPROVED_COURSES', value: apiStats?.totalCourses || 0, icon: this.icons.CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400' }
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
        console.error('Erreur de chargement Admin', err);
        this.isLoading.set(false);
      }
    });
  }

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

  // --- ACTIONS COURS ---
  approveCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.approveCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'APPROVED' } : c));
        this.setProcessing(courseId, false);
      },
      error: () => this.setProcessing(courseId, false)
    });
  }

  rejectCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.rejectCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'REJECTED' } : c));
        this.setProcessing(courseId, false);
      },
      error: () => this.setProcessing(courseId, false)
    });
  }

  // --- ACTIONS INSTRUCTEURS ---
  approveInstructor(profileId: string): void {
    if (!profileId) return;

    this.setProcessing(profileId, true);
    this.adminService.approveInstructor(profileId).subscribe({
      next: () => {
        this.instructors.update(inst => inst.map(i => i.profileId === profileId ? { ...i, approvalStatus: 'APPROVED' } : i));
        this.setProcessing(profileId, false);
      },
      error: () => this.setProcessing(profileId, false)
    });
  }

  rejectInstructor(profileId: string): void {
    this.setProcessing(profileId, true);
    this.adminService.rejectInstructor(profileId).subscribe({
      next: () => {
        this.instructors.update(inst => inst.map(i => i.profileId === profileId ? { ...i, approvalStatus: 'REJECTED' } : i));
        this.setProcessing(profileId, false);
      },
      error: () => this.setProcessing(profileId, false)
    });
  }

  // --- CATÉGORIES ---
  openCategoryModal(): void {
    this.categoryForm.reset();
    this.selectedIconFile.set(null);
    this.iconPreview.set(null);
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
  }

  // Gère la sélection d'un fichier image
  onIconSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedIconFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.iconPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // Soumission au format multipart/form-data
  submitCategory(): void {
    if (this.categoryForm.invalid) return;

    this.isSavingCategory.set(true);

    const formData = new FormData();
    // Les données textuelles sont envoyées dans la partie 'data' en JSON
    formData.append('data', JSON.stringify(this.categoryForm.value));

    // Le fichier est envoyé dans la partie 'icon'
    const iconFile = this.selectedIconFile();
    if (iconFile) {
      formData.append('icon', iconFile);
    }

    this.adminService.createCategory(formData).subscribe({
      next: () => {
        this.isSavingCategory.set(false);
        this.closeCategoryModal();
        this.adminService.getCategories().subscribe(cats => this.categories.set(cats));
      },
      error: () => this.isSavingCategory.set(false)
    });
  }
}