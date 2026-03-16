import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Clock, ChevronRight, Search, Filter, Play, Video, Loader2, BookOpen
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { CategoryDTO } from '../../../core/models/course.dto';

// Interface correspondant exactement à la réponse de votre backend Spring Boot
export interface EnrollmentDTO {
  id: string;
  enrolledAt: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  instructorName: string;
  progress: number; // Ex: 33.33
  completed: boolean;
  lastAccessedAt?: string;
  categoryId?: string; // Optionnel si le backend l'ajoute plus tard
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);

  readonly icons = { Clock, ChevronRight, Search, Filter, Play, Video, Loader2, BookOpen };

  isLoading = signal<boolean>(true);

  categories = signal<CategoryDTO[]>([]);
  myEnrollments = signal<EnrollmentDTO[]>([]);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  filteredEnrollments = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.myEnrollments().filter(enrollment => {
      const matchesSearch = (enrollment.courseTitle && enrollment.courseTitle.toLowerCase().includes(query)) ||
        (enrollment.instructorName && enrollment.instructorName.toLowerCase().includes(query));

      // Note: Si le backend ne renvoie pas categoryId, le filtre par catégorie ne s'appliquera pas.
      const matchesCategory = category === 'all' || enrollment.categoryId === category;

      return matchesSearch && matchesCategory;
    });
  });

  continueWatching = computed(() => {
    return this.myEnrollments().filter(e => e.progress > 0 && e.progress < 100);
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    this.courseService.getCategories().subscribe(res => this.categories.set(res));

    this.enrollmentService.getMyEnrollments().subscribe({
      next: (res: any) => {
        const enrollmentsArray = Array.isArray(res) ? res : (res.content || []);

        // On arrondit la progression envoyée par Spring Boot (ex: 33.33 devient 33)
        const mappedEnrollments = enrollmentsArray.map((e: any) => ({
          ...e,
          progress: e.progress ? Math.round(e.progress) : 0
        }));

        this.myEnrollments.set(mappedEnrollments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des inscriptions', err);
        this.isLoading.set(false);
      }
    });
  }
}