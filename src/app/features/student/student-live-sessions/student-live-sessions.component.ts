import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Calendar, PlayCircle, StopCircle,
  XCircle, Clock, Loader2, MonitorPlay, Compass, Bookmark, CheckCircle, Video
} from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { CourseService } from '../../../core/services/course.service';
import { LiveSessionStudentDTO } from '../../../core/models/live-session.dto';
import { CategoryDTO } from '../../../core/models/course.dto';
import { StudentLayoutComponent } from "../../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component";

@Component({
  selector: 'app-student-live-sessions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslateModule, DatePipe, StudentLayoutComponent],
  templateUrl: './student-live-sessions.component.html'
})
export class StudentLiveSessionsComponent implements OnInit, OnDestroy {
  private liveSessionService = inject(LiveSessionService);
  private courseService = inject(CourseService);
  private router = inject(Router);

  readonly icons = {
    Calendar, PlayCircle, StopCircle, XCircle, Clock,
    Loader2, MonitorPlay, Compass, Bookmark, CheckCircle, Video
  };

  activeTab = signal<'SCHEDULE' | 'EXPLORE'>('SCHEDULE');

  mySchedule = signal<LiveSessionStudentDTO[]>([]);
  exploreSessions = signal<LiveSessionStudentDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);

  selectedCategoryId = signal<string>('');

  isLoading = signal<boolean>(true);
  isActionLoading = signal<string | null>(null);

  private timerInterval: any;
  currentTime = signal<Date>(new Date());

  ngOnInit(): void {
    this.loadMySchedule();
    this.loadCategories();

    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  getStatusLabel(session: LiveSessionStudentDTO): string {
    const startTime = new Date(session.scheduledAt);
    if (session.status === 'LIVE' || (this.currentTime() >= startTime && session.status === 'SCHEDULED')) {
      return `Started at ${this.formatTime(startTime)}`;
    }
    return `Starts at ${this.formatTime(startTime)}`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isSessionActionable(session: LiveSessionStudentDTO): boolean {
    const startTime = new Date(session.scheduledAt);
    return session.status === 'LIVE' || this.currentTime() >= startTime;
  }

  setTab(tab: 'SCHEDULE' | 'EXPLORE'): void {
    this.activeTab.set(tab);
    if (tab === 'EXPLORE' && this.categories().length > 0 && !this.selectedCategoryId()) {
      this.selectCategory(this.categories()[0].id);
    }
  }

  loadMySchedule(): void {
    this.isLoading.set(true);
    this.liveSessionService.getMyRegisteredSessions().subscribe({
      next: (response) => {
        // Filtrer pour ne garder que les sessions pertinentes (SCHEDULED ou LIVE)
        const activeSessions = response.content.filter(s => s.status === 'SCHEDULED' || s.status === 'LIVE');
        this.mySchedule.set(activeSessions);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading schedule', err);
        this.isLoading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error loading categories', err)
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
    this.isLoading.set(true);
    this.liveSessionService.getUpcomingSessionsByCategory(categoryId).subscribe({
      next: (response) => {
        // Ne montrer que les sessions que l'on peut encore rejoindre (exclure COMPLETED/CANCELLED)
        const availableSessions = response.content.filter(s => s.status === 'SCHEDULED' || s.status === 'LIVE');
        this.exploreSessions.set(availableSessions);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading explore sessions', err);
        this.isLoading.set(false);
      }
    });
  }

  registerForSession(sessionId: string): void {
    this.isActionLoading.set(sessionId);
    this.liveSessionService.registerForSession(sessionId).subscribe({
      next: () => {
        this.isActionLoading.set(null);
        this.exploreSessions.update(sessions =>
          sessions.map(s => s.id === sessionId ? { ...s, isRegistered: true } : s)
        );
        // Rafraîchir le planning après l'inscription
        this.loadMySchedule();
      },
      error: (err) => {
        console.error('Error registering', err);
        this.isActionLoading.set(null);
        alert('Could not register for this session.');
      }
    });
  }

  unregisterFromSession(sessionId: string, fromTab: 'SCHEDULE' | 'EXPLORE'): void {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    this.isActionLoading.set(sessionId);
    this.liveSessionService.unregisterFromSession(sessionId).subscribe({
      next: () => {
        this.isActionLoading.set(null);
        if (fromTab === 'SCHEDULE') {
          this.mySchedule.update(sessions => sessions.filter(s => s.id !== sessionId));
          this.exploreSessions.update(sessions =>
            sessions.map(s => s.id === sessionId ? { ...s, isRegistered: false } : s)
          );
        } else {
          this.exploreSessions.update(sessions =>
            sessions.map(s => s.id === sessionId ? { ...s, isRegistered: false } : s)
          );
          this.mySchedule.update(sessions => sessions.filter(s => s.id !== sessionId));
        }
      },
      error: (err) => {
        console.error('Error unregistering', err);
        this.isActionLoading.set(null);
        alert('Could not cancel registration.');
      }
    });
  }

  joinRoom(sessionId: string): void {
    this.router.navigate(['/live-session', sessionId]);
  }
}