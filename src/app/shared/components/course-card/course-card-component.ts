import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Inclut DecimalPipe (number) et DatePipe
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LucideAngularModule, Star, Clock, Users, BookOpen, X, ThumbsUp, Loader2, MessageSquare } from 'lucide-angular';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { LocationService } from '../../../core/services/location.service';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './course-card-component.html'
})
export class CourseCardComponent implements OnInit {
  @Input({ required: true }) course!: CourseResponseDTO;
  @Input() index: number = 0;

  private locationService = inject(LocationService);
  private http = inject(HttpClient);

  location = this.locationService.location;

  readonly icons = { Star, Clock, Users, BookOpen, X, ThumbsUp, Loader2, MessageSquare };

  // --- ÉTATS DU MODAL D'AVIS ---
  isReviewsModalOpen = signal<boolean>(false);
  isLoadingReviews = signal<boolean>(false);
  reviews = signal<any[]>([]);

  ngOnInit(): void {
    this.locationService.fetchLocation().subscribe();
  }

  getLevelClasses(level: string): string {
    const base = 'px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest font-bold border backdrop-blur-sm ';
    switch (level?.toLowerCase()) {
      case 'beginner': return base + 'bg-green/10 text-green border-green/20';
      case 'intermediate': return base + 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-500';
      case 'advanced': return base + 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-500';
      default: return base + 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-ds-border/50 dark:text-ds-muted dark:border-ds-border';
    }
  }

  getLevelTranslationKey(level: string): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'COURSE_CARD.LEVEL_BEGINNER';
      case 'intermediate': return 'COURSE_CARD.LEVEL_INTERMEDIATE';
      case 'advanced': return 'COURSE_CARD.LEVEL_ADVANCED';
      default: return 'COURSE_CARD.LEVEL_ALL_LEVELS';
    }
  }

  // --- GESTION DU MODAL ---
  openReviewsModal(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.isReviewsModalOpen.set(true);
    document.body.style.overflow = 'hidden';

    if (this.reviews().length === 0) {
      this.fetchReviews();
    }
  }

  closeReviewsModal(): void {
    this.isReviewsModalOpen.set(false);
    document.body.style.overflow = 'auto';
  }

  private fetchReviews(): void {
    this.isLoadingReviews.set(true);
    // On demande les 10 derniers avis du cours
    this.http.get<any>(`${environment.apiUrl}/api/v1/courses/${this.course.id}/reviews?size=10`).subscribe({
      next: (res) => {
        this.reviews.set(res.content || []);
        this.isLoadingReviews.set(false);
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        this.isLoadingReviews.set(false);
      }
    });
  }

  markReviewAsHelpful(reviewId: string): void {
    this.http.patch(`${environment.apiUrl}/api/v1/reviews/${reviewId}/helpful`, {}).subscribe({
      next: () => {
        const updated = this.reviews().map(r =>
          r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
        );
        this.reviews.set(updated);
      }
    });
  }
}