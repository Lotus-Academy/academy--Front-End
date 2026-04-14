import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Plus, Video, Calendar, PlayCircle,
  StopCircle, XCircle, Radio, Clock, Loader2, MonitorPlay, Copy, Check
} from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { LiveSessionInstructorDTO } from '../../../core/models/live-session.dto';
import { InstructorLayoutComponent } from "../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component";

@Component({
  selector: 'app-instructor-live-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, DatePipe, InstructorLayoutComponent],
  templateUrl: './instructor-live-sessions.component.html'
})
export class InstructorLiveSessionsComponent implements OnInit {
  private liveSessionService = inject(LiveSessionService);
  private router = inject(Router);

  readonly icons = {
    Plus, Video, Calendar, PlayCircle, StopCircle,
    XCircle, Radio, Clock, Loader2, MonitorPlay, Copy, Check
  };

  sessions = signal<LiveSessionInstructorDTO[]>([]);
  isLoading = signal<boolean>(true);
  actionLoadingId = signal<string | null>(null);
  copiedId = signal<string | null>(null); // Gère l'état du bouton copier

  ngOnInit(): void {
    this.loadMySessions();
  }

  loadMySessions(): void {
    this.isLoading.set(true);
    this.liveSessionService.getMyInstructorSessions().subscribe({
      next: (response) => {
        this.sessions.set(response.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading instructor live sessions', err);
        this.isLoading.set(false);
        this.sessions.set([]);
      }
    });
  }

  startSession(sessionId: string): void {
    if (!confirm('Are you sure you want to start this session now? Students will be notified.')) return;

    this.actionLoadingId.set(sessionId);
    this.liveSessionService.startSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error starting session', err);
        this.actionLoadingId.set(null);
        alert('Failed to start the session.');
      }
    });
  }

  completeSession(sessionId: string): void {
    if (!confirm('Are you sure you want to end this broadcast? The session will be marked as completed.')) return;

    this.actionLoadingId.set(sessionId);
    this.liveSessionService.completeSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error completing session', err);
        this.actionLoadingId.set(null);
        alert('Failed to end the session.');
      }
    });
  }

  cancelSession(sessionId: string): void {
    if (!confirm('Are you sure you want to CANCEL this session? This action cannot be undone.')) return;

    this.actionLoadingId.set(sessionId);
    this.liveSessionService.cancelSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error cancelling session', err);
        this.actionLoadingId.set(null);
        alert('Failed to cancel the session.');
      }
    });
  }

  joinRoom(sessionId: string): void {
    this.router.navigate(['/live-session', sessionId]);
  }

  // Méthode pour copier le lien OBS dans le presse-papier
  copyToClipboard(text: string | undefined, id: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }
}