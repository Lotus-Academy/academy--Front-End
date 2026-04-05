import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule, Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle, Eye
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO, LessonDTO } from '../../../core/models/course.dto';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';

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

  readonly icons = { Plus, GripVertical, FileBox, Edit2, Trash2, CheckCircle, UploadCloud, Loader2, X, FileText, PlayCircle, Eye };

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  // Addition states
  isAddingSection = signal<boolean>(false);
  activeLessonFormSectionId = signal<string | null>(null);

  // Inline Editing states
  editSectionId = signal<string | null>(null);
  editLessonId = signal<string | null>(null);

  // Upload states
  uploadingMedia = signal<Set<string>>(new Set());

  // Forms
  sectionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]]
  });

  lessonForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    duration: [0, [Validators.required, Validators.min(0)]],
    orderIndex: [0, [Validators.required, Validators.min(0)]], // ADDED ORDER INDEX
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

  // --- SECTION MANAGEMENT ---

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
    if (confirm("Are you sure you want to delete this section and all its lessons?")) {
      this.courseService.deleteSection(this.courseId(), sectionId).subscribe({
        next: () => this.fetchCourseSilent(this.courseId())
      });
    }
  }

  // --- LESSON MANAGEMENT ---

  toggleAddLesson(sectionId: string): void {
    this.editLessonId.set(null);
    if (this.activeLessonFormSectionId() === sectionId) {
      this.activeLessonFormSectionId.set(null);
    } else {
      // RESET WITH ORDER INDEX
      this.lessonForm.reset({ duration: 0, orderIndex: 0, freePreview: false, description: '' });
      this.activeLessonFormSectionId.set(sectionId);
    }
  }

  onSaveLesson(sectionId: string): void {
    if (this.lessonForm.invalid) return;

    // Default to VIDEO when creating a manual lesson without a file
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

    // PATCH VALUE WITH ORDER INDEX
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

    // The form now dictates the orderIndex, so we don't hardcode it from the old object
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
    if (confirm("Are you sure you want to delete this lesson?")) {
      this.courseService.deleteLesson(sectionId, lessonId).subscribe({
        next: () => this.fetchCourseSilent(this.courseId())
      });
    }
  }

  // --- MEDIA MANAGEMENT ---

  isMediaUploading(lessonId: string): boolean {
    return this.uploadingMedia().has(lessonId);
  }

  onFileSelected(event: any, sectionId: string, lesson: LessonDTO): void {
    const file: File = event.target.files[0];

    if (!file) return;

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isVideo = file.type.startsWith('video/');

    if (!isPDF && !isVideo) {
      alert(this.translate.instant('COURSE_EDITOR.CURRICULUM.ERR_FORMAT'));
      event.target.value = '';
      return;
    }

    const detectedType = isPDF ? 'PDF' : 'VIDEO';

    this.uploadingMedia.update(set => {
      const newSet = new Set(set);
      newSet.add(lesson.id);
      return newSet;
    });

    const updatePayload = {
      title: lesson.title,
      description: lesson.description || '',
      duration: lesson.duration || 0,
      freePreview: lesson.freePreview || false,
      orderIndex: lesson.orderIndex, // Kept intact for the media update
      type: detectedType
    };

    this.courseService.updateLesson(sectionId, lesson.id, updatePayload).subscribe({
      next: () => {
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
            console.error('Upload error', err);
            alert('File upload failed.');
            this.uploadingMedia.update(set => {
              const newSet = new Set(set);
              newSet.delete(lesson.id);
              return newSet;
            });
          }
        });
      },
      error: (err) => {
        console.error('Lesson type update error', err);
        this.uploadingMedia.update(set => {
          const newSet = new Set(set);
          newSet.delete(lesson.id);
          return newSet;
        });
      }
    });
  }

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