import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Play,
  Video,
  Loader2
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO, PageCourseResponseDTO } from '../../../core/models/course.dto';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component'; // Assurez-vous du chemin exact

// Interfaces temporaires en attendant l'implémentation complète du StudentService
export interface FollowedInstructorDTO { id: string; instructorId: string; displayName: string; avatarUrl?: string; }
export interface CategoryDTO { id: string; name: string; }

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, CourseCardComponent, TranslateModule],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  private courseService = inject(CourseService);

  readonly icons = { Clock, ChevronRight, Search, Filter, Play, Video, Loader2 };

  isLoading = signal<boolean>(true);

  // Données
  continueWatching = signal<any[]>([]); // Simulation de la reprise de lecture
  following = signal<FollowedInstructorDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  availableCourses = signal<CourseResponseDTO[]>([]);

  // Filtres
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.availableCourses().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(query) ||
        (course.instructorName && course.instructorName.toLowerCase().includes(query));
      const matchesCategory = category === 'all' || course.categoryId === category;
      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Récupération des catégories via le CourseService corrigé
    this.courseService.getCategories().subscribe(res => this.categories.set(res));

    // Récupération du catalogue paginé
    this.courseService.getPublishedCourses(0, 20).subscribe({
      next: (res: PageCourseResponseDTO) => {
        this.availableCourses.set(res.content);
        this.generateMockData(res.content); // Génération de fausses données pour la démo
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cours', err);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Temporaire : Génère des fausses données pour la section "Continuer" 
   * et "Following" en se basant sur le catalogue existant.
   */
  private generateMockData(courses: CourseResponseDTO[]) {
    if (courses.length > 0) {
      // Mock Continuer à regarder
      this.continueWatching.set([
        {
          courseId: courses[0].id,
          courseTitle: courses[0].title,
          courseThumbnail: courses[0].thumbnailUrl,
          lastWatchedLessonTitle: 'Introduction aux concepts de base',
          courseProgressPercentage: 35,
          lastWatchedTimestamp: 124 // 2:04
        }
      ]);

      // Mock Instructeurs suivis
      const uniqueInstructors = Array.from(new Set(courses.map(c => c.instructorId)))
        .map(id => {
          const course = courses.find(c => c.instructorId === id);
          return {
            id: id,
            instructorId: id,
            displayName: course?.instructorName || 'Instructeur',
            avatarUrl: course?.instructorPictureUrl
          };
        }).slice(0, 5); // Limiter à 5

      this.following.set(uniqueInstructors);
    }
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}