import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Play,
  PlayCircle,
  Star,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  Compass,
  Loader2,
  Flame
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';
import { HomeLayoutComponent } from "../../layouts/home-layout/home-layout.component";

interface EnrollmentDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  instructorName: string;
  progress: number;
}

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, HomeLayoutComponent],
  templateUrl: './student-home.component.html'
})
export class StudentHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);

  readonly icons = { Play, PlayCircle, Star, Users, Clock, ChevronRight, TrendingUp, Compass, Loader2, Flame };

  isLoading = signal<boolean>(true);
  currentUser = computed(() => this.authService.getUser());

  // Signaux de données
  recentEnrollments = signal<EnrollmentDTO[]>([]);
  trendingCourses = signal<CourseResponseDTO[]>([]);
  topRatedCourses = signal<CourseResponseDTO[]>([]);
  newCourses = signal<CourseResponseDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);

  continueWatching = computed(() => {
    return this.recentEnrollments().filter(e => e.progress > 0 && e.progress < 100).slice(0, 4);
  });

  ngOnInit(): void {
    this.loadHomepageData();
  }

  private loadHomepageData(): void {
    this.isLoading.set(true);

    // 1. Inscriptions (Continuer la lecture)
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (res: any) => {
        const enrollmentsArray = Array.isArray(res) ? res : (res.content || []);
        const mappedEnrollments = enrollmentsArray.map((e: any) => ({
          ...e,
          progress: e.progress ? Math.round(e.progress) : 0
        }));
        this.recentEnrollments.set(mappedEnrollments);
      },
      error: (err) => console.error('Erreur inscriptions', err)
    });

    // 2. Tendances du moment
    this.courseService.getTrendingCourses().subscribe({
      next: (res) => this.trendingCourses.set(res || []),
      error: (err) => console.error('Erreur tendances', err)
    });

    // 3. Les mieux notés
    this.courseService.getTopRatedCourses().subscribe({
      next: (res) => this.topRatedCourses.set(res || []),
      error: (err) => console.error('Erreur mieux notés', err)
    });

    // 4. Nouveautés
    this.courseService.getNewestCourses().subscribe({
      next: (res) => this.newCourses.set(res || []),
      error: (err) => console.error('Erreur nouveautés', err)
    });

    // 5. Catégories Populaires
    this.courseService.getPopularCategories().subscribe({
      next: (res) => {
        this.categories.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur catégories', err);
        this.isLoading.set(false);
      }
    });
  }
}