import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Search, Filter, Plus, Star, Users, Video, Edit2, Lock, CheckCircle, Clock, XCircle, Loader2
} from 'lucide-angular';

import { CourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';
import { CourseService } from '../../../core/services/course.service';
import { InstructorProfileService } from '../../../core/services/instructor-profile.service';
import { InstructorLayoutComponent } from "../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component";

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule, InstructorLayoutComponent],
  templateUrl: './instructor-courses.component.html'
})
export class InstructorCoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private instructorProfileService = inject(InstructorProfileService);

  readonly icons = { Search, Filter, Plus, Star, Users, Video, Edit2, Lock, CheckCircle, Clock, XCircle, Loader2 };

  isLoading = signal<boolean>(true);

  // Données brutes
  allCourses = signal<CourseResponseDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);
  profileStatus = signal<'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED'>('LOADING');

  // Filtres
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedCategory = signal<string>('all');

  canCreateCourse = computed(() => this.profileStatus() === 'APPROVED');

  // Filtrage combiné et instantané
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();
    const category = this.selectedCategory();

    return this.allCourses().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || course.status === status;
      const matchesCategory = category === 'all' || course.categoryId === category;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.fetchProfileStatus();
    this.loadData();
  }

  fetchProfileStatus(): void {
    this.instructorProfileService.getMyProfile().subscribe({
      next: (profile) => this.profileStatus.set(profile.approvalStatus),
      error: () => this.profileStatus.set('MISSING')
    });
  }

  loadData(): void {
    this.isLoading.set(true);

    // Chargement parallèle des catégories et des cours
    this.courseService.getCategories().subscribe(res => this.categories.set(res));

    this.courseService.getInstructorCourses().subscribe({
      next: (courses) => {
        // Tri par défaut : les plus récents d'abord
        const sorted = courses.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        this.allCourses.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération du catalogue instructeur', err);
        this.isLoading.set(false);
      }
    });
  }

  getStatusConfig(status: string) {
    switch (status) {
      case 'APPROVED':
        return { labelKey: 'INSTRUCTOR_DASHBOARD.STATUS.APPROVED', icon: this.icons.CheckCircle, bg: 'bg-green/10 text-green border-green/20' };
      case 'REJECTED':
        return { labelKey: 'INSTRUCTOR_DASHBOARD.STATUS.REJECTED', icon: this.icons.XCircle, bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'PENDING_REVIEW':
        return { labelKey: 'INSTRUCTOR_DASHBOARD.STATUS.PENDING', icon: this.icons.Clock, bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
      default:
        return { labelKey: 'INSTRUCTOR_DASHBOARD.STATUS.DRAFT', icon: this.icons.Clock, bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-ds-border/50 dark:text-ds-muted dark:border-ds-border' };
    }
  }
}