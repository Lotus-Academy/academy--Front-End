import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { 
  LucideAngularModule, PlayCircle, CheckCircle, Clock, 
  Trophy, BookOpen, Loader2, ArrowRight
} from 'lucide-angular';

import { EnrollmentService } from '../../../core/services/enrollment.service';
import { EnrollmentDTO } from '../../../core/models/enrollment.dto';
import { StudentLayoutComponent } from "../../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component";

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, StudentLayoutComponent],
  templateUrl: './my-learning.component.html'
})
export class MyLearningComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  readonly icons = { 
    PlayCircle, CheckCircle, Clock, Trophy, BookOpen, Loader2, ArrowRight 
  };

  // State Management
  isLoading = signal<boolean>(true);
  enrollments = signal<EnrollmentDTO[]>([]);
  activeTab = signal<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');

  // Computed signals pour le filtrage automatique
  inProgressCourses = computed(() => {
    return this.enrollments().filter(e => !e.completed);
  });

  completedCourses = computed(() => {
    return this.enrollments().filter(e => e.completed);
  });

  ngOnInit(): void {
    this.fetchMyLearning();
  }

  fetchMyLearning(): void {
    this.isLoading.set(true);
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load enrollments', err);
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'IN_PROGRESS' | 'COMPLETED'): void {
    this.activeTab.set(tab);
  }
}