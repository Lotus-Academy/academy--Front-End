import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  PlayCircle,
  Clock,
  BookOpen,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Globe,
  MonitorPlay,
  Unlock,
  User,
  Loader2
} from 'lucide-angular';

import { NavbarComponent } from '../../layouts/navbar-component/navbar-component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';
import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    CurrencyPipe,
    TranslateModule
  ],
  templateUrl: './course-detail-component.html'
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  readonly icons = {
    PlayCircle, Clock, BookOpen, CheckCircle, Lock,
    ChevronDown, ChevronUp, Award, Globe, MonitorPlay, Unlock, User, Loader2
  };

  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);

  totalSections = computed(() => this.course()?.sections?.length || 0);

  totalLessons = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  totalDuration = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => {
      const secDuration = section.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
      return acc + secDuration;
    }, 0);
  });

  expandedSections = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseDetails(id);
    }
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);

    this.courseService.getCourseById(id).subscribe({
      next: (data: CourseResponseDTO) => {
        this.course.set(data);

        // Ouvrir la première section par défaut
        if (data.sections && data.sections.length > 0) {
          this.toggleSection(data.sections[0].id);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du cours :', error);
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
}