import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Plus,
  GripVertical,
  FileBox,
  Edit2,
  Trash2,
  CheckCircle,
  UploadCloud,
  Loader2
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './course-curriculum.component.html'
})
export class CourseCurriculumComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly icons = { Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2 };

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  isAddingSection = signal<boolean>(false);
  activeLessonFormSectionId = signal<string | null>(null);

  sectionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    duration: [0, [Validators.required, Validators.min(0)]],
    isFreePreview: [false]
  });

  ngOnInit(): void {
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

  // --- GESTION DES SECTIONS ---

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
        createdSection.lessons = [];
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

  // --- GESTION DES LEÇONS ---

  toggleAddLesson(sectionId: string): void {
    if (this.activeLessonFormSectionId() === sectionId) {
      this.activeLessonFormSectionId.set(null);
    } else {
      this.lessonForm.reset({ duration: 0, isFreePreview: false });
      this.activeLessonFormSectionId.set(sectionId);
    }
  }

  onSaveLesson(sectionId: string): void {
    if (this.lessonForm.invalid) return;

    const newLessonData = this.lessonForm.value;

    this.courseService.createLesson(sectionId, newLessonData).subscribe({
      next: (createdLesson) => {
        const currentCourse = this.course();
        if (currentCourse) {
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
        this.activeLessonFormSectionId.set(null);
      },
      error: (err) => console.error('Erreur lors de la création de la leçon', err)
    });
  }

  // --- GESTION DES MÉDIAS (SÉCURITÉ) ---

  onFileSelected(event: any, sectionId: string, lessonId: string): void {
    const file: File = event.target.files[0];

    if (file) {
      // Vérification stricte du type MIME
      const isValidFormat = file.type === 'video/mp4' || file.type === 'application/pdf';

      if (!isValidFormat) {
        // Alerte traduite
        alert(this.translate.instant('COURSE_EDITOR.CURRICULUM.ERR_FORMAT'));
        event.target.value = ''; // Réinitialisation de l'input HTML
        return;
      }

      this.courseService.uploadLessonMedia(sectionId, lessonId, file).subscribe({
        next: () => {
          this.loadCourseData(this.courseId());
        },
        error: (err) => console.error('Erreur upload', err)
      });
    }
  }

  // --- SOUMISSION DU COURS ---

  submitForReview(): void {
    this.isSubmittingReview.set(true);
    this.courseService.submitForReview(this.courseId()).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (err) => {
        console.error('Erreur lors de la soumission', err);
        this.isSubmittingReview.set(false);
      }
    });
  }
}