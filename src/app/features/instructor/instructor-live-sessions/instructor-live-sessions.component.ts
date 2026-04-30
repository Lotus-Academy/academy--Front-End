import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- AJOUTÉ POUR LES FILTRES
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Plus, Video, Calendar, PlayCircle,
  StopCircle, XCircle, Radio, Clock, Loader2, MonitorPlay,
  Copy, Check, AlertTriangle, Info, Search, Filter, CheckCircle
} from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { LiveSessionInstructorDTO } from '../../../core/services/live-session.service';
import { InstructorLayoutComponent } from "../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component";

@Component({
  selector: 'app-instructor-live-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule, DatePipe, InstructorLayoutComponent],
  templateUrl: './instructor-live-sessions.component.html'
})
export class InstructorLiveSessionsComponent implements OnInit {
  private liveSessionService = inject(LiveSessionService);
  private router = inject(Router);

  readonly icons = {
    Plus, Video, Calendar, PlayCircle, StopCircle,
    XCircle, Radio, Clock, Loader2, MonitorPlay, Copy, Check, AlertTriangle, Info, Search, Filter, CheckCircle
  };

  sessions = signal<LiveSessionInstructorDTO[]>([]);
  isLoading = signal<boolean>(true);
  actionLoadingId = signal<string | null>(null);
  copiedId = signal<string | null>(null);

  // --- ÉTATS POUR LES FILTRES INTELLIGENTS ---
  searchQuery = signal<string>('');
  statusFilter = signal<string>('ALL');

  // --- ÉTATS POUR L'UX (Toasts & Modales) ---
  globalMessage = signal<{ type: 'error' | 'success' | 'info', text: string } | null>(null);
  confirmDialog = signal<{
    isOpen: boolean,
    sessionId: string,
    action: 'START' | 'COMPLETE' | 'CANCEL'
  }>({ isOpen: false, sessionId: '', action: 'START' });

  // --- CALCUL DES SESSIONS FILTRÉES ---
  filteredSessions = computed(() => {
    let list = this.sessions();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    if (this.statusFilter() !== 'ALL') {
      list = list.filter(s => s.status === this.statusFilter());
    }

    return list;
  });

  ngOnInit(): void {
    this.loadMySessions();
  }

  // Utilitaire pour afficher un toast non-bloquant
  private showMessage(type: 'error' | 'success' | 'info', text: string) {
    this.globalMessage.set({ type, text });
    setTimeout(() => this.globalMessage.set(null), 4000);
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

  // --- GESTION DE LA MODALE ---
  requestAction(sessionId: string, action: 'START' | 'COMPLETE' | 'CANCEL'): void {
    this.confirmDialog.set({ isOpen: true, sessionId, action });
  }

  cancelDialog(): void {
    this.confirmDialog.set({ isOpen: false, sessionId: '', action: 'START' });
  }

  confirmAction(): void {
    const { sessionId, action } = this.confirmDialog();
    this.confirmDialog.set({ isOpen: false, sessionId: '', action: 'START' });

    switch (action) {
      case 'START':
        this.executeStart(sessionId);
        break;
      case 'COMPLETE':
        this.executeComplete(sessionId);
        break;
      case 'CANCEL':
        this.executeCancel(sessionId);
        break;
    }
  }

  // --- EXÉCUTION DES ACTIONS API ---
  private executeStart(sessionId: string): void {
    this.actionLoadingId.set(sessionId);
    this.liveSessionService.startSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.showMessage('success', 'Broadcast started! Students are being notified.');
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error starting session', err);
        this.actionLoadingId.set(null);
        if (err.status === 409) {
          this.showMessage('error', 'This session is already running or cannot be started.');
        } else {
          this.showMessage('error', 'Failed to start the session.');
        }
      }
    });
  }

  private executeComplete(sessionId: string): void {
    this.actionLoadingId.set(sessionId);
    this.liveSessionService.completeSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.showMessage('success', 'Broadcast ended and marked as completed.');
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error completing session', err);
        this.actionLoadingId.set(null);
        this.showMessage('error', 'Failed to end the session.');
      }
    });
  }

  private executeCancel(sessionId: string): void {
    this.actionLoadingId.set(sessionId);
    this.liveSessionService.cancelSession(sessionId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.showMessage('success', 'Session cancelled successfully.');
        this.loadMySessions();
      },
      error: (err) => {
        console.error('Error cancelling session', err);
        this.actionLoadingId.set(null);
        this.showMessage('error', 'Failed to cancel the session.');
      }
    });
  }

  joinRoom(sessionId: string): void {
    this.router.navigate(['/live-session', sessionId]);
  }

  copyToClipboard(text: string | undefined, id: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(id);
      this.showMessage('success', 'Stream URL copied to clipboard.');
      setTimeout(() => this.copiedId.set(null), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
      this.showMessage('error', 'Failed to copy to clipboard.');
    });
  }
}