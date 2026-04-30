import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Calendar, PlayCircle, StopCircle,
  XCircle, Clock, Loader2, MonitorPlay, Compass, Bookmark,
  CheckCircle, Video, Search, Filter, AlertTriangle, Info // Info added
} from 'lucide-angular';

import { LiveSessionService, LiveSessionStudentDTO } from '../../../core/services/live-session.service';
import { CourseService } from '../../../core/services/course.service';
import { CategoryDTO } from '../../../core/models/course.dto';
import { StudentLayoutComponent } from "../../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component";

@Component({
  selector: 'app-student-live-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule, DatePipe, StudentLayoutComponent],
  templateUrl: './student-live-sessions.component.html'
})
export class StudentLiveSessionsComponent implements OnInit, OnDestroy {
  private liveSessionService = inject(LiveSessionService);
  private courseService = inject(CourseService);
  private router = inject(Router);

  readonly icons = {
    Calendar, PlayCircle, StopCircle, XCircle, Clock,
    Loader2, MonitorPlay, Compass, Bookmark, CheckCircle, Video, Search, Filter, AlertTriangle, Info
  };

  activeTab = signal<'SCHEDULE' | 'EXPLORE'>('SCHEDULE');

  mySchedule = signal<LiveSessionStudentDTO[]>([]);
  exploreSessions = signal<LiveSessionStudentDTO[]>([]);
  categories = signal<CategoryDTO[]>([]);

  selectedCategoryId = signal<string>('');

  searchQuery = signal<string>('');
  statusFilter = signal<'ALL' | 'LIVE' | 'SCHEDULED'>('ALL');
  toolFilter = signal<string>('ALL');

  isLoading = signal<boolean>(true);
  isActionLoading = signal<string | null>(null);

  // --- NOUVEAUX ÉTATS POUR L'UX (Alertes & Confirmations) ---
  globalMessage = signal<{ type: 'error' | 'success' | 'info', text: string } | null>(null);
  confirmDialog = signal<{ isOpen: boolean, sessionId: string, tab: 'SCHEDULE' | 'EXPLORE' }>({ isOpen: false, sessionId: '', tab: 'SCHEDULE' });

  private timerInterval: any;
  currentTime = signal<Date>(new Date());

  filteredExploreSessions = computed(() => {
    let sessions = this.exploreSessions();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      sessions = sessions.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.instructorName.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter() !== 'ALL') {
      sessions = sessions.filter(s => s.status === this.statusFilter());
    }

    if (this.toolFilter() !== 'ALL') {
      sessions = sessions.filter(s => s.toolType === this.toolFilter());
    }

    return sessions;
  });

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

  // Utilitaire pour afficher un toast
  private showMessage(type: 'error' | 'success' | 'info', text: string) {
    this.globalMessage.set({ type, text });
    setTimeout(() => this.globalMessage.set(null), 5000); // Disparaît après 5 secondes
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
    this.liveSessionService.getMySchedule().subscribe({
      next: (response) => {
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

    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.toolFilter.set('ALL');

    this.liveSessionService.getUpcomingSessionsByCategory(categoryId).subscribe({
      next: (response) => {
        // Nettoyage des logs de debug
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

  registerForSession(session: LiveSessionStudentDTO): void {
    this.isActionLoading.set(session.id);
    this.liveSessionService.registerForSession(session.id).subscribe({
      next: () => {
        this.isActionLoading.set(null);
        this.exploreSessions.update(sessions =>
          sessions.map(s => s.id === session.id ? { ...s, isRegistered: true } : s)
        );
        this.loadMySchedule();
        this.showMessage('success', 'Successfully registered for the session!');

        if (session.status === 'LIVE' || this.isSessionActionable(session)) {
          this.joinRoom(session.id);
        }
      },
      error: (err) => {
        console.error('Error registering', err);
        this.isActionLoading.set(null);

        if (err.status === 403) {
          // Toast esthétique avec redirection retardée
          this.showMessage('error', 'You must be enrolled in the course to join its live sessions. Redirecting...');
          setTimeout(() => {
            this.router.navigate(['/courses', session.courseId]);
          }, 3000);
        } else {
          this.showMessage('error', 'Could not register for this session. Please try again.');
        }
      }
    });
  }

  // --- LOGIQUE DE CONFIRMATION CUSTOMISÉE ---
  requestUnregister(sessionId: string, fromTab: 'SCHEDULE' | 'EXPLORE'): void {
    this.confirmDialog.set({ isOpen: true, sessionId, tab: fromTab });
  }

  cancelUnregister(): void {
    this.confirmDialog.set({ isOpen: false, sessionId: '', tab: 'SCHEDULE' });
  }

  confirmUnregister(): void {
    const { sessionId, tab } = this.confirmDialog();
    this.confirmDialog.set({ isOpen: false, sessionId: '', tab: 'SCHEDULE' });
    this.isActionLoading.set(sessionId);

    this.liveSessionService.unregisterFromSession(sessionId).subscribe({
      next: () => {
        this.isActionLoading.set(null);
        this.showMessage('success', 'Registration cancelled successfully.');

        if (tab === 'SCHEDULE') {
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
        this.showMessage('error', 'Could not cancel registration.');
      }
    });
  }

  joinRoom(sessionId: string): void {
    this.router.navigate(['/live-session', sessionId]);
  }
}