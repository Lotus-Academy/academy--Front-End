import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import {
  LucideAngularModule, ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Circle, PlayCircle, Trophy, Loader2, Lock, FileText, Star, X
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseResponseDTO, SectionDTO, LessonDTO } from '../../../core/models/course.dto';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, LivePreviewDirective],
  templateUrl: './course-player.component.html'
})
export class CoursePlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  readonly icons = { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Circle, PlayCircle, Trophy, Loader2, Lock, FileText, Star, X };

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);

  currentLesson = signal<LessonDTO | null>(null);
  expandedSections = signal<Set<string>>(new Set());

  currentUser = computed(() => this.authService.getUser());
  isEnrolled = signal<boolean>(false);
  isLessonLocked = signal<boolean>(false);

  isReviewModalOpen = signal<boolean>(false);
  isSubmittingReview = signal<boolean>(false);
  reviewRating = signal<number>(0);
  reviewComment = signal<string>('');
  hoveredRating = signal<number>(0);

  safeMediaUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.currentLesson();
    if (lesson && lesson.mediaUrl && lesson.type === 'PDF' && !this.isLessonLocked()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(lesson.mediaUrl);
    }
    return null;
  });

  hasFullAccess = computed(() => {
    const user = this.currentUser();
    const courseData = this.course();
    if (!user || !courseData) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'INSTRUCTOR' && courseData.instructorId === user.userId) return true;
    return this.isEnrolled();
  });

  totalLessonsCount = computed(() => {
    const c = this.course();
    return c?.sections?.reduce((acc, section) => acc + (section.lessons?.length || 0), 0) || 0;
  });

  completedLessonsCount = computed(() => {
    const c = this.course();
    return c?.sections?.reduce((acc, section) => acc + (section.lessons?.filter(l => l.completed).length || 0), 0) || 0;
  });

  progressPercentage = computed(() => {
    const total = this.totalLessonsCount();
    return total === 0 ? 0 : Math.round((this.completedLessonsCount() / total) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadCourseData(id);
    }
  }

  private loadCourseData(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (data) => {
        this.course.set(data);
        this.checkEnrollmentStatus(id, data);
      },
      error: () => this.router.navigate(['/dashboard'])
    });
  }

  private checkEnrollmentStatus(courseId: string, courseData: CourseResponseDTO): void {
    const user = this.currentUser();
    if (user?.role === 'ADMIN' || (user?.role === 'INSTRUCTOR' && courseData.instructorId === user?.userId)) {
      this.isEnrolled.set(true);
      this.initializePlayer(courseData.sections);
      return;
    }
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (enrollments: any) => {
        const arr = Array.isArray(enrollments) ? enrollments : (enrollments.content || []);
        this.isEnrolled.set(arr.some((e: any) => e.courseId === courseId || e.course?.id === courseId));
        this.initializePlayer(courseData.sections);
      },
      error: () => {
        this.isEnrolled.set(false);
        this.initializePlayer(courseData.sections);
      }
    });
  }

  private initializePlayer(sections: SectionDTO[]): void {
    if (sections?.length > 0) {
      this.expandedSections.set(new Set(sections.map(s => s.id)));
      this.findAndSetNextUncompletedLesson(sections);
    }
    this.isLoading.set(false);
  }

  private findAndSetNextUncompletedLesson(sections: SectionDTO[]): void {
    if (!this.hasFullAccess()) {
      if (sections[0]?.lessons?.length > 0) this.selectLesson(sections[0].lessons[0]);
      return;
    }
    for (const section of sections) {
      for (const lesson of section.lessons || []) {
        if (!lesson.completed) { this.selectLesson(lesson); return; }
      }
    }
    if (sections[0]?.lessons?.length > 0) this.selectLesson(sections[0].lessons[0]);
  }

  selectLesson(lesson: LessonDTO): void {
    this.currentLesson.set(lesson);
    this.isLessonLocked.set(!this.hasFullAccess() && !lesson.freePreview);
  }

  toggleSection(sectionId: string): void {
    const expanded = new Set(this.expandedSections());
    expanded.has(sectionId) ? expanded.delete(sectionId) : expanded.add(sectionId);
    this.expandedSections.set(expanded);
  }

  isSectionExpanded(sectionId: string): boolean { return this.expandedSections().has(sectionId); }

  markLessonAsCompleteAndContinue(): void {
    if (!this.hasFullAccess()) return;
    const lesson = this.currentLesson();
    if (!lesson || lesson.completed) { this.goToNextLesson(); return; }

    this.enrollmentService.completeLesson(this.courseId(), lesson.id).subscribe({
      next: () => {
        const data = this.course();
        if (data) {
          const updated = data.sections.map(s => ({
            ...s, lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, completed: true } : l)
          }));
          this.course.set({ ...data, sections: updated });
        }
        this.goToNextLesson();
      }
    });
  }

  private goToNextLesson(): void {
    const data = this.course();
    const lesson = this.currentLesson();
    if (!data || !lesson) return;

    let foundCurrent = false;
    for (const section of data.sections) {
      for (const l of section.lessons || []) {
        if (foundCurrent) { this.selectLesson(l); return; }
        if (l.id === lesson.id) foundCurrent = true;
      }
    }
    if (this.progressPercentage() === 100 && this.hasFullAccess()) {
      this.router.navigate(['/player', this.courseId(), 'quiz']);
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // --- LOGIQUE DES AVIS ---
  openReviewModal(): void {
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.reviewRating.set(0);
    this.reviewComment.set('');
  }

  setRating(rating: number): void {
    this.reviewRating.set(rating);
  }

  setHoveredRating(rating: number): void {
    this.hoveredRating.set(rating);
  }

  updateComment(event: Event): void {
    this.reviewComment.set((event.target as HTMLTextAreaElement).value);
  }

  submitReview(): void {
    if (this.reviewRating() === 0 || !this.reviewComment().trim()) return;

    this.isSubmittingReview.set(true);
    const payload = {
      courseId: this.courseId(),
      rating: this.reviewRating(),
      comment: this.reviewComment().trim()
    };

    this.http.post(`${environment.apiUrl}/api/v1/courses/${this.courseId()}/reviews`, payload).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.closeReviewModal();
        // Après, je dois afficher un toast de succès
      },
      error: (err) => {
        console.error('Error submitting review', err);
        this.isSubmittingReview.set(false);
      }
    });
  }
}