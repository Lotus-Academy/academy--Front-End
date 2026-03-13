import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Save, Loader2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CategoryDTO, CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-edit-basic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './course-edit-basic.component.html'
})
export class CourseEditBasicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly icons = { Save, Loader2, AlertCircle, CheckCircle, AlertTriangle };

  courseId = signal<string>('');
  originalCourse = signal<CourseResponseDTO | null>(null);
  categories = signal<CategoryDTO[]>([]);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  // Feedback visuel
  saveSuccessMessage = signal<boolean>(false);
  errorMessage = signal<string>('');

  basicForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subtitle: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    level: ['BEGINNER', [Validators.required]],
    language: ['Français', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.loadCategories();

    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCourseDetails(id);
      }
    });
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => {
        console.error('Erreur de chargement des catégories', err);
        this.errorMessage.set('Erreur lors du chargement des catégories.');
      }
    });
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course: CourseResponseDTO) => {
        this.originalCourse.set(course);

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
        this.errorMessage.set('Impossible de charger le cours.');
        this.isLoading.set(false);
      }
    });
  }

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
    this.saveSuccessMessage.set(false);
    this.errorMessage.set('');

    const updatedData = {
      ...this.originalCourse(),
      ...this.basicForm.value
    };

    this.courseService.updateCourse(this.courseId(), updatedData).subscribe({
      next: (updatedCourse) => {
        this.originalCourse.set(updatedCourse);
        this.isSaving.set(false);
        this.saveSuccessMessage.set(true);

        // Disparition du message de succès après 3 secondes
        setTimeout(() => this.saveSuccessMessage.set(false), 3000);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
        this.isSaving.set(false);
        this.errorMessage.set(this.translate.instant('COURSE_EDITOR.BASIC.ERROR_SAVE'));
      }
    });
  }
}