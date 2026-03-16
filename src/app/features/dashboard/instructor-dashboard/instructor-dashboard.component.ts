import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Video,
  Users,
  Eye,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2,
  Lock
} from 'lucide-angular';

import { CourseResponseDTO } from '../../../core/models/course.dto';
import { CourseService } from '../../../core/services/course.service';
import { InstructorProfileService } from '../../../core/services/instructor-profile.service'; // <-- AJOUT DU SERVICE

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './instructor-dashboard.component.html'
})
export class InstructorDashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private instructorProfileService = inject(InstructorProfileService); // Injection du service

  readonly icons = { Video, Users, Eye, Clock, Plus, CheckCircle, XCircle, BarChart3, Loader2, Lock };

  activeTab = signal<'courses' | 'students'>('courses');

  myCourses = signal<CourseResponseDTO[]>([]);
  isLoading = signal<boolean>(true);

  // GESTION DU STATUT DU PROFIL
  profileStatus = signal<'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED'>('LOADING');

  canCreateCourse = computed(() => this.profileStatus() === 'APPROVED');

  stats = signal([
    { labelKey: 'INSTRUCTOR_DASHBOARD.STATS.TOTAL_COURSES', value: 0, icon: this.icons.Video, colorClass: 'text-lotus bg-lotus/10 border-lotus/20' },
    { labelKey: 'INSTRUCTOR_DASHBOARD.STATS.APPROVED', value: 0, icon: this.icons.CheckCircle, colorClass: 'text-green bg-green/10 border-green/20' },
    { labelKey: 'INSTRUCTOR_DASHBOARD.STATS.PENDING', value: 0, icon: this.icons.Clock, colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    { labelKey: 'INSTRUCTOR_DASHBOARD.STATS.STUDENTS', value: 0, icon: this.icons.Users, colorClass: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-ds-muted dark:bg-ds-border/50 dark:border-ds-border' }
  ]);

  ngOnInit(): void {
    this.fetchProfileStatus();
    this.fetchInstructorCourses();
  }

  // NOUVELLE MÉTHODE : Récupérer le statut de l'instructeur
  fetchProfileStatus() {
    this.instructorProfileService.getMyProfile().subscribe({
      next: (profile) => this.profileStatus.set(profile.approvalStatus),
      error: (err) => {
        this.profileStatus.set(err.status === 404 ? 'MISSING' : 'MISSING');
      }
    });
  }

  fetchInstructorCourses() {
    this.isLoading.set(true);
    this.courseService.getInstructorCourses().subscribe({
      next: (courses) => {
        this.myCourses.set(courses);
        this.updateStats(courses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des cours', err);
        this.isLoading.set(false);
      }
    });
  }

  updateStats(courses: CourseResponseDTO[]) {
    const totalStudents = courses.reduce((sum, course) => sum + (course.studentsCount || 0), 0);

    this.stats.update(s => [
      { ...s[0], value: courses.length },
      { ...s[1], value: courses.filter(c => c.status === 'APPROVED').length },
      { ...s[2], value: courses.filter(c => c.status === 'PENDING_REVIEW').length },
      { ...s[3], value: totalStudents }
    ]);
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