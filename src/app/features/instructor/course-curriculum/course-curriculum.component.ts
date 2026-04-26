import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpEventType } from '@angular/common/http';
import {
  LucideAngularModule, Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle, Eye, AlertTriangle
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO, LessonDTO } from '../../../core/models/course.dto';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, LivePreviewDirective],
  templateUrl: './course-curriculum.component.html'
})
export class CourseCurriculumComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  readonly icons = { Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle, Eye, AlertTriangle };

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  isAddingSection = signal<boolean>(false);
  activeLessonFormSectionId = signal<string | null>(null);
  editSectionId = signal<string | null>(null);
  editLessonId = signal<string | null>(null);

  // Upload states (Map permet de gérer plusieurs leçons indépendamment)
  uploadingMedia = signal<Set<string>>(new Set());
  lessonProgress = signal<Map<string, number>>(new Map());
  mediaErrors = signal<Map<string, string>>(new Map());

  sectionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    duration: [0, [Validators.required, Validators.min(0)]],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    freePreview: [false],
    description: ['']
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
        console.error('Refresh error', err);
        if (callback) callback();
      }
    });
  }

  // --- GESTION DES SECTIONS ET LEÇONS ---

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

  toggleAddLesson(sectionId: string): void {
    this.editLessonId.set(null);
    if (this.activeLessonFormSectionId() === sectionId) {
      this.activeLessonFormSectionId.set(null);
    } else {
      this.lessonForm.reset({ duration: 0, orderIndex: 0, freePreview: false, description: '' });
      this.activeLessonFormSectionId.set(sectionId);
    }
  }

  onSaveLesson(sectionId: string): void {
    if (this.lessonForm.invalid) return;
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
      orderIndex: lesson.orderIndex || 0,
      freePreview: lesson.freePreview,
      description: lesson.description || ''
    });
  }

  cancelEditLesson(): void {
    this.editLessonId.set(null);
  }

  onUpdateLesson(sectionId: string, lesson: LessonDTO): void {
    if (this.lessonForm.invalid) return;

    const payload = {
      ...this.lessonForm.value,
      type: lesson.type || 'VIDEO'
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

  // --- GESTION DE L'UPLOAD DES MÉDIAS ---

  isMediaUploading(lessonId: string): boolean {
    return this.uploadingMedia().has(lessonId);
  }

  getLessonProgress(lessonId: string): number {
    return this.lessonProgress().get(lessonId) || 0;
  }

  private setMediaError(lessonId: string, message: string | null): void {
    this.mediaErrors.update(map => {
      const newMap = new Map(map);
      if (message) newMap.set(lessonId, message);
      else newMap.delete(lessonId);
      return newMap;
    });
  }

  private stopUploadingState(lessonId: string): void {
    this.uploadingMedia.update(set => {
      const newSet = new Set(set);
      newSet.delete(lessonId);
      return newSet;
    });
    this.lessonProgress.update(map => {
      const newMap = new Map(map);
      newMap.delete(lessonId);
      return newMap;
    });
  }

  private updateLessonProgress(lessonId: string, percent: number): void {
    this.lessonProgress.update(map => {
      const newMap = new Map(map);
      newMap.set(lessonId, percent);
      return newMap;
    });
  }

  // Permet de lire la durée locale si besoin
  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject('Fichier vidéo invalide');
      video.src = URL.createObjectURL(file);
    });
  }



  async onFileSelected(event: any, sectionId: string, lesson: LessonDTO): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    this.setMediaError(lesson.id, null);

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isVideo = file.type.startsWith('video/');

    if (!isPDF && !isVideo) {
      this.setMediaError(lesson.id, this.translate.instant('COURSE_EDITOR.CURRICULUM.ERR_FORMAT'));
      event.target.value = '';
      return;
    }

    // 1. VÉRIFICATION DU POIDS
    const maxSizeMB = isVideo ? (environment.uploadConstraints?.lessonVideoMaxSizeMB || 500) : (environment.uploadConstraints?.lessonPdfMaxSizeMB || 20);
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.setMediaError(lesson.id, `Fichier trop volumineux. La taille maximale est de ${maxSizeMB} Mo.`);
      event.target.value = '';
      return;
    }

    this.uploadingMedia.update(set => {
      const newSet = new Set(set);
      newSet.add(lesson.id);
      return newSet;
    });
    this.updateLessonProgress(lesson.id, 0);

    try {
      // =========================================================================
      // 2. NOUVEAU : VÉRIFICATION DE LA DURÉE POUR LES LEÇONS VIDÉO
      // =========================================================================
      if (isVideo) {
        const duration = await this.getVideoDuration(file);
        const maxDurationSec = environment.uploadConstraints?.lessonVideoMaxDurationSec || 1200;

        if (duration > maxDurationSec) {
          const maxMinutes = Math.floor(maxDurationSec / 60);
          this.setMediaError(lesson.id, `La vidéo est trop longue. La durée maximale autorisée est de ${maxMinutes} minutes.`);
          this.stopUploadingState(lesson.id);
          event.target.value = '';
          return;
        }
      }

      const detectedType = isPDF ? 'PDF' : 'VIDEO';

      // 3. Mise à jour des métadonnées de la leçon
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

          // 4. Récupération des URLs
          this.courseService.getLessonMediaPresignedUrl(sectionId, lesson.id, file.name, file.type, file.size).subscribe({
            next: (response) => {

              const presignedUrl = response.presignedUrl;
              const publicUrl = response.publicUrl;

              if (!presignedUrl || !publicUrl) {
                this.setMediaError(lesson.id, 'Le serveur n\'a pas renvoyé les URLs nécessaires.');
                this.stopUploadingState(lesson.id);
                return;
              }

              // 5. Upload vers R2 avec progression
              this.courseService.uploadToPresignedUrlWithProgress(presignedUrl, file, file.type).subscribe({
                next: (httpEvent) => {

                  if (httpEvent.type === HttpEventType.UploadProgress && httpEvent.total) {
                    const percentDone = Math.round((100 * httpEvent.loaded) / httpEvent.total);
                    this.updateLessonProgress(lesson.id, percentDone);
                  }
                  else if (httpEvent.type === HttpEventType.Response) {
                    this.updateLessonProgress(lesson.id, 100);

                    // 6. Confirmation finale
                    const confirmationPayload = {
                      fileUrl: publicUrl
                    };

                    this.courseService.confirmLessonMediaUpload(sectionId, lesson.id, confirmationPayload).subscribe({
                      next: () => {
                        this.fetchCourseSilent(this.courseId(), () => this.stopUploadingState(lesson.id));
                      },
                      error: (err) => {
                        console.error('Confirmation failed', err);
                        this.setMediaError(lesson.id, 'L\'upload a réussi, mais la confirmation serveur a échoué.');
                        this.stopUploadingState(lesson.id);
                      }
                    });
                  }
                },
                error: (err) => {
                  console.error('R2 Upload failed', err);
                  this.setMediaError(lesson.id, 'L\'envoi direct vers le serveur de stockage a échoué.');
                  this.stopUploadingState(lesson.id);
                }
              });

            },
            error: (err) => {
              console.error('Failed to get Presigned URL', err);
              this.setMediaError(lesson.id, 'Impossible d\'initialiser l\'upload sécurisé.');
              this.stopUploadingState(lesson.id);
            }
          });

        },
        error: (err) => {
          console.error('Lesson type update error', err);
          this.setMediaError(lesson.id, 'Erreur lors de la mise à jour des métadonnées de la leçon.');
          this.stopUploadingState(lesson.id);
        }
      });
    } catch (e) {
      this.setMediaError(lesson.id, 'Impossible de lire le fichier média ou ses métadonnées.');
      this.stopUploadingState(lesson.id);
    }
  }

  submitForReview(): void {
    this.isSubmittingReview.set(true);
    this.courseService.submitForReview(this.courseId()).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        alert("La soumission du cours a échoué.");
        this.isSubmittingReview.set(false);
      }
    });
  }
}