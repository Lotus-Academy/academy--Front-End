import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Save, Loader2, AlertCircle } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
// Assurez-vous d'avoir une interface Category dans vos modèles
interface Category { id: string; name: string; }

@Component({
  selector: 'app-course-edit-basic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './course-edit-basic.component.html'
})
export class CourseEditBasicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  readonly icons = { Save, Loader2, AlertCircle };

  courseId = signal<string>('');
  originalCourse = signal<CourseResponseDTO | null>(null);
  categories = signal<Category[]>([]);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  basicForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subtitle: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    level: ['BEGINNER', [Validators.required]],
    language: ['Français', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    // 1. Récupération des catégories pour le menu déroulant
    this.loadCategories();

    // 2. Récupération de l'ID depuis la route parente de l'éditeur
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCourseDetails(id);
      }
    });
  }

  loadCategories(): void {
    // Simulation / Remplacer par this.courseService.getCategories()
    this.categories.set([
      { id: 'cat-1', name: 'Trading & Investissement' },
      { id: 'cat-2', name: 'Cryptomonnaie' },
      { id: 'cat-3', name: 'Programmation' }
    ]);
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course: CourseResponseDTO) => {
        this.originalCourse.set(course);

        // On remplit le formulaire avec les données récupérées
        this.basicForm.patchValue({
          title: course.title,
          subtitle: course.subtitle,
          categoryId: course.categoryId,
          level: course.level || 'BEGINNER',
          language: course.language || 'Français',
          description: course.description
        });

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des informations de base', err);
        this.isLoading.set(false);
      }
    });
  }

  // Helper pour l'affichage des erreurs dans le HTML
  isFieldInvalid(field: string): boolean {
    const control = this.basicForm.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSave(): void {
    if (this.basicForm.invalid || !this.originalCourse()) {
      this.basicForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    // On fusionne les nouvelles données du formulaire avec les anciennes 
    // (pour ne pas écraser le prix, le statut ou le thumbnailUrl)
    const updatedData = {
      ...this.originalCourse(),
      ...this.basicForm.value
    };

    this.courseService.updateCourse(this.courseId(), updatedData).subscribe({
      next: (updatedCourse) => {
        this.originalCourse.set(updatedCourse); // Met à jour l'état local
        this.isSaving.set(false);
        // Afficher un message de succès (Toast) idéalement ici
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
        this.isSaving.set(false);
      }
    });
  }
}