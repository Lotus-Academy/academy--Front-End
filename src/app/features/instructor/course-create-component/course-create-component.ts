import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, ArrowLeft, Save, Loader2 } from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CategoryDTO } from '../../../core/models/course.dto';


@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './course-create-component.html'
})
export class CourseCreateComponent implements OnInit {

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  readonly icons = { ArrowLeft, Save, Loader2 };

  courseForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subtitle: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    level: ['BEGINNER', [Validators.required]],
    language: ['Français', [Validators.required]],
    description: [''],
    thumbnailUrl: [''],
    trailerUrl: ['']
  });

  categories: CategoryDTO[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => {
        console.error('Erreur de chargement des catégories', err);
        alert("Erreur lors du chargement des catégories");
      }
    });

  }

  isFieldInvalid(field: string): boolean {
    const control = this.courseForm.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSubmit() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.courseService.createCourse(this.courseForm.value).subscribe({
      next: (createdCourse) => {
        this.isLoading = false;
        // Redirection vers le Curriculum Builder avec l'ID généré
        this.router.navigate(['/instructor/courses', createdCourse.id, 'edit', 'curriculum']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        alert("Erreur lors de l'initialisation du cours");
      }
    });
  }
}