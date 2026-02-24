import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, Loader2 } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';

export interface Category { id: string; name: string; }

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './course-create-component.html'
})
export class CourseCreateComponent implements OnInit {

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  readonly icons = { ArrowLeft, Save, Loader2 };

  // Formulaire strictement aligné sur CourseCreateDTO de votre Swagger
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

  categories: Category[] = [];
  isLoading = false;

  ngOnInit(): void {
    // Dans un cas réel, décommentez ceci si vous avez la méthode dans le service :
    // this.courseService.getCategories().subscribe(cats => this.categories = cats);

    // Fallback visuel temporaire
    this.categories = [
      { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Trading & Investissement' },
      { id: '2', name: 'Cryptomonnaie' },
      { id: '3', name: 'Programmation' },
      { id: '8ba4e23e-3af0-4cd6-9b5c-8b946578dd87', name: 'Informatique' },
    ];
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

    // Appel réel au backend
    this.courseService.createCourse(this.courseForm.value).subscribe({
      next: (createdCourse) => {
        this.isLoading = false;
        // Redirection magique vers le Curriculum Builder avec l'ID généré
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