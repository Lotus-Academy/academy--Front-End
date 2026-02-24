import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Play,
  Video
} from 'lucide-angular';

import { StudentService, CourseResumeDTO, FollowedInstructorDTO, CategoryDTO } from '../../../core/services/student.service';
import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, CourseCardComponent],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  private studentService = inject(StudentService);
  private courseService = inject(CourseService);

  readonly icons = { Clock, ChevronRight, Search, Filter, Play, Video };

  // États de chargement
  isLoading = signal<boolean>(true);

  // Données
  continueWatching = signal<CourseResumeDTO[]>([]);
  following = signal<FollowedInstructorDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  availableCourses = signal<CourseResponseDTO[]>([]);

  // Filtres
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  // Cours filtrés pour la section "Recommandations / Tous les cours"
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.availableCourses().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(query) ||
        course.instructorName.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || course.categoryId === category;
      return matchesSearch && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);

    // Chargement parallèle simulé
    this.studentService.getInProgressCourses().subscribe(res => this.continueWatching.set(res));
    this.studentService.getFollowedInstructors().subscribe(res => this.following.set(res));
    this.studentService.getCategories().subscribe(res => this.categories.set(res));

    // On réutilise le CourseService pour récupérer les cours disponibles
    this.courseService.getPublishedCourses().subscribe(res => {
      this.availableCourses.set(res);
      this.isLoading.set(false);
    });
  }

  // Formatage du temps pour "Continuer à regarder"
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}