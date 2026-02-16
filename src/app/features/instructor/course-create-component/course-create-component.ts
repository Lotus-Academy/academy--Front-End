import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CourseService, Category } from '../../../core/services/course-service';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-create-component.html'
})
export class CourseCreateComponent implements OnInit {

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private router = inject(Router);

  courseForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subtitle: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    level: ['BEGINNER', [Validators.required]],
    language: ['Français', [Validators.required]],
    description: ['']
  });

  categories: Category[] = [];
  isLoading = false;

  ngOnInit(): void {
    // Charger les catégories pour le select
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => console.error('Erreur chargement catégories', err)
    });
  }

  onSubmit() {
    if (this.courseForm.invalid) return;

    this.isLoading = true;
    this.courseService.createCourse(this.courseForm.value).subscribe({
      next: (course) => {
        this.isLoading = false;
        // Rediriger vers la page d'édition de contenu (qu'on créera après)
        // this.router.navigate(['/instructor/courses', course.id, 'edit']);

        // Pour l'instant, retour au dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        alert("Erreur lors de la création du cours");
      }
    });
  }
}