import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ExternalLink,
  Eye,
  MonitorPlay,
  BookOpen,
  Award,
  Globe
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';

@Component({
  selector: 'app-course-edit-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CourseCardComponent, CurrencyPipe],
  templateUrl: './course-edit-preview.component.html'
})
export class CourseEditPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  readonly icons = { ExternalLink, Eye, MonitorPlay, BookOpen, Award, Globe };

  courseId = signal<string>('');
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);

  // Calculs dynamiques pour l'aperçu
  totalLessons = computed(() => {
    const data = this.course();
    if (!data || !data.sections) return 0;
    return data.sections.reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  totalDuration = computed(() => {
    const data = this.course();
    if (!data || !data.sections) return 0;
    return data.sections.reduce((acc, section) => {
      const secDuration = section.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
      return acc + secDuration;
    }, 0);
  });

  ngOnInit(): void {
    // Récupération de l'ID depuis la route parente de l'éditeur
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCoursePreview(id);
      }
    });
  }

  loadCoursePreview(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (data) => {
        this.course.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'aperçu', err);
        this.isLoading.set(false);
      }
    });
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  }
}