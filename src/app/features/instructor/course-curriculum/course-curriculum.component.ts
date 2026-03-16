import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule, Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO, LessonDTO } from '../../../core/models/course.dto';

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

  readonly icons = { Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle };

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  // État des ajouts
  isAddingSection = signal<boolean>(false);
  activeLessonFormSectionId = signal<string | null>(null);

  // État des modifications (Inline Editing)
  editSectionId = signal<string | null>(null);
  editLessonId = signal<string | null>(null);

  // État des Uploads en cours
  uploadingMedia = signal<Set<string>>(new Set());

  // Formulaires
  sectionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    duration: [0, [Validators.required, Validators.min(0)]],
    freePreview: [false]
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
    this.fetchCourseSilent(id, () => this.isLoading.set(false));
  }

  private fetchCourseSilent(id: string, callback?: () => void): void {
    this.courseService.getCourseById(id).subscribe({
      next: (data) => {
        if (!data.sections) data.sections = [];
        data.sections.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        data.sections.forEach((s: any) => s.lessons?.sort((a: any, b: any) => a.orderIndex - b.orderIndex));
        this.course.set(data);
        if (callback) callback();
      },
      error: (err) => {
        console.error('Erreur de rafraîchissement', err);
        if (callback) callback();
      }
    });
  }

  // --- GESTION DES SECTIONS ---

  toggleAddSection(): void {
    this.isAddingSection.set(!this.isAddingSection());
    if (this.isAddingSection()) this.sectionForm.reset();
  }

  onSaveSection(): void {
    if (this.sectionForm.invalid) return;
    this.courseService.createSection(this.courseId(), this.sectionForm.value).subscribe({
      next: () => {
        this.fetchCourseSilent(this.courseId());
        this.toggleAddSection();
      }
    });
  }

  deleteSection(sectionId: string): void {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette section et toutes ses leçons ?")) {
      this.courseService.deleteSection(this.courseId(), sectionId).subscribe({
        next: () => this.fetchCourseSilent(this.courseId())
      });
    }
  }

  // --- GESTION DES LEÇONS ---

  toggleAddLesson(sectionId: string): void {
    this.editLessonId.set(null);
    if (this.activeLessonFormSectionId() === sectionId) {
      this.activeLessonFormSectionId.set(null);
    } else {
      this.lessonForm.reset({ duration: 0, freePreview: false });
      this.activeLessonFormSectionId.set(sectionId);
    }
  }

  onSaveLesson(sectionId: string): void {
    if (this.lessonForm.invalid) return;

    // Par défaut, lors de la création manuelle d'une leçon sans fichier, 
    // on lui attribue le type VIDEO.
    const payload = { ...this.lessonForm.value, type: 'VIDEO' };

    this.courseService.createLesson(sectionId, payload).subscribe({
      next: () => {
        this.fetchCourseSilent(this.courseId());
        this.activeLessonFormSectionId.set(null);
      }
    });
  }

  startEditLesson(lesson: any): void {
    this.activeLessonFormSectionId.set(null);
    this.editLessonId.set(lesson.id);
    this.lessonForm.patchValue({
      title: lesson.title,
      duration: lesson.duration,
      freePreview: lesson.freePreview
    });
  }

  cancelEditLesson(): void {
    this.editLessonId.set(null);
  }

  onUpdateLesson(sectionId: string, lesson: LessonDTO): void {
    if (this.lessonForm.invalid) return;

    // On conserve le type existant de la leçon lors d'une modification de texte
    const payload = {
      ...this.lessonForm.value,
      type: lesson.type || 'VIDEO',
      orderIndex: lesson.orderIndex
    };

    this.courseService.updateLesson(sectionId, lesson.id, payload).subscribe({
      next: () => {
        this.fetchCourseSilent(this.courseId());
        this.editLessonId.set(null);
      }
    });
  }

  deleteLesson(sectionId: string, lessonId: string): void {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette leçon ?")) {
      this.courseService.deleteLesson(sectionId, lessonId).subscribe({
        next: () => this.fetchCourseSilent(this.courseId())
      });
    }
  }

  // --- GESTION DES MÉDIAS AVEC DÉTECTION DU TYPE ---

  isMediaUploading(lessonId: string): boolean {
    return this.uploadingMedia().has(lessonId);
  }

  onFileSelected(event: any, sectionId: string, lesson: LessonDTO): void {
    const file: File = event.target.files[0];

    if (!file) return;

    // 1. Validation du format
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isVideo = file.type.startsWith('video/');

    if (!isPDF && !isVideo) {
      alert(this.translate.instant('COURSE_EDITOR.CURRICULUM.ERR_FORMAT'));
      event.target.value = '';
      return;
    }

    // 2. Détection du type
    const detectedType = isPDF ? 'PDF' : 'VIDEO';

    // 3. Activer le loader
    this.uploadingMedia.update(set => {
      const newSet = new Set(set);
      newSet.add(lesson.id);
      return newSet;
    });

    // 4. Mettre à jour les métadonnées de la leçon (PUT) pour enregistrer le type
    const updatePayload = {
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration || 0,
      freePreview: lesson.freePreview || false,
      orderIndex: lesson.orderIndex,
      type: detectedType
    };

    this.courseService.updateLesson(sectionId, lesson.id, updatePayload).subscribe({
      next: () => {
        // 5. Procéder à l'upload physique du fichier (POST)
        this.courseService.uploadLessonMedia(sectionId, lesson.id, file).subscribe({
          next: () => {
            this.fetchCourseSilent(this.courseId(), () => {
              this.uploadingMedia.update(set => {
                const newSet = new Set(set);
                newSet.delete(lesson.id);
                return newSet;
              });
            });
          },
          error: (err) => {
            console.error('Erreur upload', err);
            alert('Échec du téléchargement du fichier.');
            this.uploadingMedia.update(set => {
              const newSet = new Set(set);
              newSet.delete(lesson.id);
              return newSet;
            });
          }
        });
      },
      error: (err) => {
        console.error('Erreur mise à jour type leçon', err);
        this.uploadingMedia.update(set => {
          const newSet = new Set(set);
          newSet.delete(lesson.id);
          return newSet;
        });
      }
    });
  }

  // --- SOUMISSION DU COURS ---

  submitForReview(): void {
    this.isSubmittingReview.set(true);
    this.courseService.submitForReview(this.courseId()).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => this.isSubmittingReview.set(false)
    });
  }
}