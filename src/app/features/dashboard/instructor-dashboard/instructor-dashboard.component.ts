import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Video,
  Users,
  Eye,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-angular';

// Interface basée sur vos DTOs
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { CourseService } from '../../../core/services/course-service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './instructor-dashboard.component.html'
})
export class InstructorDashboardComponent implements OnInit {
  private courseService = inject(CourseService);

  readonly icons = { Video, Users, Eye, Clock, Plus, CheckCircle, XCircle, BarChart3 };

  // Système d'onglets (remplace les Tabs de shadcn/ui)
  activeTab = signal<'courses' | 'students'>('courses');

  // État des données
  myCourses = signal<CourseResponseDTO[]>([]);
  isLoading = signal<boolean>(true);

  // Statistiques calculées
  stats = signal([
    { label: 'Cours Totaux', value: 0, icon: this.icons.Video, colorClass: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Approuvés', value: 0, icon: this.icons.Eye, colorClass: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'En attente', value: 0, icon: this.icons.Clock, colorClass: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { label: 'Étudiants', value: 124, icon: this.icons.Users, colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' } // Valeur fictive pour l'instant
  ]);

  ngOnInit(): void {
    this.fetchInstructorCourses();
  }

  fetchInstructorCourses() {
    this.isLoading.set(true);
    // TODO: Remplacer par this.courseService.getCoursesByInstructorId(...)
    this.courseService.getInstructorCourses().subscribe({
      next: (courses) => {
        this.myCourses.set(courses);
        this.updateStats(courses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  updateStats(courses: CourseResponseDTO[]) {
    this.stats.update(s => [
      { ...s[0], value: courses.length },
      { ...s[1], value: courses.filter(c => c.status === 'APPROVED').length },
      { ...s[2], value: courses.filter(c => c.status === 'PENDING_REVIEW').length },
      s[3] // Étudiants reste tel quel pour l'instant
    ]);
  }

  // Helper pour les icônes de statut
  getStatusConfig(status: string) {
    switch (status) {
      case 'APPROVED': return { label: 'Approuvé', icon: this.icons.CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200' };
      case 'REJECTED': return { label: 'Rejeté', icon: this.icons.XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200' };
      case 'PENDING_REVIEW': return { label: 'En révision', icon: this.icons.Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200' };
      default: return { label: 'Brouillon', icon: this.icons.Clock, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200' };
    }
  }
}