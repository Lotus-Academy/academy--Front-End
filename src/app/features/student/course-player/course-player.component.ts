import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // <-- NOUVEAU
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Circle, PlayCircle, Trophy, Loader2, Lock, FileText // <-- AJOUT DE FileText
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CourseResponseDTO, SectionDTO, LessonDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './course-player.component.html'
})
export class CoursePlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private sanitizer = inject(DomSanitizer); // <-- INJECTION DU SANITIZER

  readonly icons = { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Circle, PlayCircle, Trophy, Loader2, Lock, FileText };

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);

  currentLesson = signal<LessonDTO | null>(null);
  expandedSections = signal<Set<string>>(new Set());

  // NOUVEAU : Calcul dynamique de l'URL sécurisée pour le PDF
  safeMediaUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.currentLesson();
    if (lesson && lesson.mediaUrl && lesson.type === 'PDF') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(lesson.mediaUrl);
    }
    return null;
  });

  totalLessonsCount = computed(() => {
    const c = this.course();
    if (!c || !c.sections) return 0;
    return c.sections.reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  completedLessonsCount = computed(() => {
    const c = this.course();
    if (!c || !c.sections) return 0;
    return c.sections.reduce((acc, section) => {
      const completedInSection = section.lessons?.filter(l => l.completed).length || 0;
      return acc + completedInSection;
    }, 0);
  });

  progressPercentage = computed(() => {
    const total = this.totalLessonsCount();
    if (total === 0) return 0;
    return Math.round((this.completedLessonsCount() / total) * 100);
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
      next: (data: CourseResponseDTO) => {
        this.course.set(data);

        if (data.sections && data.sections.length > 0) {
          const allSectionIds = data.sections.map(s => s.id);
          this.expandedSections.set(new Set(allSectionIds));
          this.findAndSetNextUncompletedLesson(data.sections);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du cours', err);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private findAndSetNextUncompletedLesson(sections: SectionDTO[]): void {
    for (const section of sections) {
      if (section.lessons) {
        for (const lesson of section.lessons) {
          if (!lesson.completed) {
            this.selectLesson(lesson);
            return;
          }
        }
      }
    }
    if (sections[0] && sections[0].lessons && sections[0].lessons.length > 0) {
      this.selectLesson(sections[0].lessons[0]);
    }
  }

  selectLesson(lesson: LessonDTO): void {
    this.currentLesson.set(lesson);
  }

  toggleSection(sectionId: string): void {
    const currentExpanded = new Set(this.expandedSections());
    if (currentExpanded.has(sectionId)) {
      currentExpanded.delete(sectionId);
    } else {
      currentExpanded.add(sectionId);
    }
    this.expandedSections.set(currentExpanded);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  markLessonAsCompleteAndContinue(): void {
    const lesson = this.currentLesson();
    if (!lesson || lesson.completed) {
      this.goToNextLesson();
      return;
    }

    this.enrollmentService.completeLesson(this.courseId(), lesson.id).subscribe({
      next: () => {
        const currentCourseData = this.course();
        if (currentCourseData) {
          const updatedSections = currentCourseData.sections.map(section => {
            return {
              ...section,
              lessons: section.lessons.map(l => l.id === lesson.id ? { ...l, completed: true } : l)
            };
          });
          this.course.set({ ...currentCourseData, sections: updatedSections });
        }
        this.goToNextLesson();
      },
      error: (err) => console.error("Erreur lors de la complétion de la leçon", err)
    });
  }

  private goToNextLesson(): void {
    const currentCourseData = this.course();
    const lesson = this.currentLesson();

    if (!currentCourseData || !lesson) return;

    let foundCurrent = false;

    for (const section of currentCourseData.sections) {
      if (!section.lessons) continue;

      for (const l of section.lessons) {
        if (foundCurrent) {
          this.selectLesson(l);
          return;
        }
        if (l.id === lesson.id) {
          foundCurrent = true;
        }
      }
    }

    if (this.progressPercentage() === 100) {
      this.router.navigate(['/player', this.courseId(), 'quiz']);
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}