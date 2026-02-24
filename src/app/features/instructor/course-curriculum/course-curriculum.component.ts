import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  GripVertical,
  FileVideo,
  Edit2,
  Trash2,
  CheckCircle,
  UploadCloud
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './course-curriculum.component.html'
})
export class CourseCurriculumComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  readonly icons = { Plus, GripVertical, FileVideo, Edit2, Trash2, CheckCircle, UploadCloud };

  // État global
  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  // États pour les formulaires d'ajout
  isAddingSection = signal<boolean>(false);
  activeLessonFormSectionId = signal<string | null>(null);

  // Formulaire Section
  sectionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  // Formulaire Leçon
  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    duration: [0, [Validators.required, Validators.min(1)]],
    isFreePreview: [false]
  });

  ngOnInit(): void {
    // Note: on cherche l'ID dans parent.paramMap car ce composant est un enfant du CourseEditorShellComponent
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCourseData(id);
      }
    });
  }

  loadCourseData(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (data) => {
        // Initialisation sécurisée de la liste des sections si elle est absente
        if (!data.sections) {
          data.sections = [];
        }
        this.course.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du cours', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- LOGIQUE SECTION ---

  toggleAddSection(): void {
    this.isAddingSection.set(!this.isAddingSection());
    if (this.isAddingSection()) {
      this.sectionForm.reset();
    }
  }

  onSaveSection(): void {
    if (this.sectionForm.invalid) return;

    const newSectionData = this.sectionForm.value;

    this.courseService.createSection(this.courseId(), newSectionData).subscribe({
      next: (createdSection) => {
        createdSection.lessons = []; // Assurer que la nouvelle section possède un tableau vide

        // Mise à jour de l'état local sans recharger toute la page (immutabilité)
        const currentCourse = this.course();
        if (currentCourse) {
          this.course.set({
            ...currentCourse,
            sections: [...currentCourse.sections, createdSection]
          });
        }
        this.toggleAddSection();
      },
      error: (err) => console.error('Erreur lors de la création de la section', err)
    });
  }

  // --- LOGIQUE LEÇON ---

  toggleAddLesson(sectionId: string): void {
    if (this.activeLessonFormSectionId() === sectionId) {
      this.activeLessonFormSectionId.set(null); // Fermer
    } else {
      this.lessonForm.reset({ duration: 0, isFreePreview: false });
      this.activeLessonFormSectionId.set(sectionId); // Ouvrir pour cette section précise
    }
  }

  onSaveLesson(sectionId: string): void {
    if (this.lessonForm.invalid) return;

    const newLessonData = this.lessonForm.value;

    this.courseService.createLesson(sectionId, newLessonData).subscribe({
      next: (createdLesson) => {
        const currentCourse = this.course();
        if (currentCourse) {
          // Mise à jour de la structure de données locale
          const updatedSections = currentCourse.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                lessons: [...(section.lessons || []), createdLesson]
              };
            }
            return section;
          });

          this.course.set({ ...currentCourse, sections: updatedSections });
        }
        this.activeLessonFormSectionId.set(null); // Fermer le formulaire
      },
      error: (err) => console.error('Erreur lors de la création de la leçon', err)
    });
  }

  // --- UPLOAD MÉDIA ---

  onFileSelected(event: any, sectionId: string, lessonId: string): void {
    const file: File = event.target.files[0];
    if (file) {
      this.courseService.uploadLessonMedia(sectionId, lessonId, file).subscribe({
        next: (updatedLesson) => {
          // Le plus sûr pour garantir la cohérence est de recharger les données du cours complet
          this.loadCourseData(this.courseId());
        },
        error: (err) => console.error('Erreur lors de l\'upload du fichier vidéo', err)
      });
    }
  }

  // --- SOUMISSION GLOBALE ---

  submitForReview(): void {
    this.isSubmittingReview.set(true);
    this.courseService.submitForReview(this.courseId()).subscribe({
      next: (message) => {
        this.isSubmittingReview.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erreur lors de la soumission du cours', err);
        this.isSubmittingReview.set(false);
      }
    });
  }
}