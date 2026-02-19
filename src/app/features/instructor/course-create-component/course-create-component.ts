import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';

// Interface temporaire (idéalement à placer dans vos models)
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

  readonly icons = { ArrowLeft, Save, Loader2, ImageIcon };

  // Formulaire aligné sur CourseCreateDTO
  courseForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    subtitle: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    level: ['Beginner', [Validators.required]],
    language: ['Français', [Validators.required]],
    description: [''],
    thumbnailUrl: [''] // Ajouté selon votre DTO
  });

  categories: Category[] = [];
  isLoading = false;

  ngOnInit(): void {
    // Simulation / Chargement des catégories
    // this.courseService.getCategories().subscribe({...});

    // MOCK temporaire pour que le select fonctionne visuellement
    this.categories = [
      { id: '1', name: 'Trading & Investissement' },
      { id: '2', name: 'Cryptomonnaie' },
      { id: '3', name: 'Programmation' }
    ];
  }

  // Helper pour vérifier facilement les erreurs dans le HTML
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

    // Remplacer par l'appel réel à this.courseService.createCourse(this.courseForm.value)
    setTimeout(() => {
      this.isLoading = false;
      // Redirection vers le dashboard instructeur après création
      this.router.navigate(['/dashboard']);
    }, 1500);
  }
}