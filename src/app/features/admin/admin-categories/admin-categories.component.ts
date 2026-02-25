import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, FolderPlus, Pencil, Trash2, X, Loader2, CheckCircle } from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService, CategoryDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, AdminLayoutComponent],
  templateUrl: './admin-categories.component.html'
})
export class AdminCategoriesComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  readonly icons = { FolderPlus, Pencil, Trash2, X, Loader2, CheckCircle };

  isLoading = signal<boolean>(true);
  categories = signal<CategoryDTO[]>([]);

  // Gestion de la modale (Création & Modification)
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  editingCategoryId = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.adminService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur de chargement des catégories', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- LOGIQUE DE LA MODALE ---

  openModal(category?: CategoryDTO): void {
    if (category) {
      // Mode Édition
      this.editingCategoryId.set(category.id);
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description || ''
      });
    } else {
      // Mode Création
      this.editingCategoryId.set(null);
      this.categoryForm.reset();
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCategoryId.set(null);
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const data = this.categoryForm.value;
    const categoryId = this.editingCategoryId();

    const request$ = categoryId
      ? this.adminService.updateCategory(categoryId, data)
      : this.adminService.createCategory(data);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadCategories(); // Rafraîchissement de la liste
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde de la catégorie', err);
        this.isSaving.set(false);
      }
    });
  }

  deleteCategory(id: string, name: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`)) {
      this.adminService.deleteCategory(id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => console.error('Erreur lors de la suppression', err)
      });
    }
  }
}