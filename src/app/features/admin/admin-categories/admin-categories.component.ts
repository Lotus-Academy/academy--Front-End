import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  LucideAngularModule,
  FolderPlus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  BookOpen
} from 'lucide-angular';

import { AdminService } from '../../../core/services/admin.service';
import { CategoryDTO, CourseResponseDTO } from '../../../core/models/course.dto';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, AdminLayoutComponent],
  templateUrl: './admin-categories.component.html'
})
export class AdminCategoriesComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  readonly icons = { FolderPlus, Pencil, Trash2, ImageIcon, Upload, X, Loader2, AlertTriangle, BookOpen };

  // État global
  isLoading = signal<boolean>(true);
  categories = signal<CategoryDTO[]>([]);
  courses = signal<CourseResponseDTO[]>([]);

  // Calcul dynamique du nombre de cours par catégorie
  categoryStats = computed(() => {
    const stats = new Map<string, number>();
    this.categories().forEach(cat => stats.set(cat.id, 0));

    this.courses().forEach(course => {
      if (course.categoryId && stats.has(course.categoryId)) {
        stats.set(course.categoryId, stats.get(course.categoryId)! + 1);
      }
    });
    return stats;
  });

  // Gestion de la modale de formulaire (Création / Modification)
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  editMode = signal<boolean>(false);
  selectedCategoryId = signal<string | null>(null);

  // Gestion de l'image
  selectedIconFile = signal<File | null>(null);
  iconPreview = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]]
  });

  // Gestion de la modale de suppression
  isDeleteModalOpen = signal<boolean>(false);
  categoryToDelete = signal<CategoryDTO | null>(null);
  isDeleting = signal<boolean>(false);
  deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      categoriesRes: this.adminService.getCategories(),
      // On charge un grand nombre de cours pour calculer les statistiques
      coursesRes: this.adminService.getAllCourses(0, 1000)
    }).subscribe({
      next: (results) => {
        this.categories.set(results.categoriesRes);
        this.courses.set(results.coursesRes.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading categories data', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- GESTION DU FORMULAIRE (ADD / EDIT) ---

  openCreateModal(): void {
    this.editMode.set(false);
    this.selectedCategoryId.set(null);
    this.categoryForm.reset();
    this.selectedIconFile.set(null);
    this.iconPreview.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(category: CategoryDTO): void {
    this.editMode.set(true);
    this.selectedCategoryId.set(category.id);

    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });

    this.selectedIconFile.set(null);
    this.iconPreview.set(category.iconUrl || null);

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedIconFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.iconPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving.set(true);
    const formData = new FormData();
    formData.append('data', JSON.stringify(this.categoryForm.value));

    const iconFile = this.selectedIconFile();
    if (iconFile) {
      formData.append('icon', iconFile);
    }

    if (this.editMode() && this.selectedCategoryId()) {
      this.adminService.updateCategory(this.selectedCategoryId()!, formData).subscribe({
        next: () => this.handleSuccess(),
        error: () => this.isSaving.set(false)
      });
    } else {
      this.adminService.createCategory(formData).subscribe({
        next: () => this.handleSuccess(),
        error: () => this.isSaving.set(false)
      });
    }
  }

  private handleSuccess(): void {
    this.isSaving.set(false);
    this.closeModal();
    this.loadData(); // Recharger pour mettre à jour la liste
  }

  // --- GESTION DE LA SUPPRESSION ---

  openDeleteModal(category: CategoryDTO): void {
    this.categoryToDelete.set(category);
    this.deleteError.set(null);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.categoryToDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.adminService.deleteCategory(category.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        this.isDeleting.set(false);
        // Gestion spécifique de l'erreur 409 si des cours y sont rattachés
        if (err.status === 409) {
          this.deleteError.set('ADMIN_CATEGORIES.DELETE_CONFLICT');
        } else {
          this.deleteError.set('ADMIN_CATEGORIES.DELETE_ERROR');
        }
      }
    });
  }
}