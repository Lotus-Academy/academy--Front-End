import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, ChevronLeft, Loader2, Lock, MessageSquare, AlertTriangle,
  PlayCircle, ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Send, UserPlus
} from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { LiveSessionStudentDTO } from '../../../core/services/live-session.service';

@Component({
  selector: 'app-live-session-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './live-session-room.component.html'
})
export class LiveSessionRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private liveSessionService = inject(LiveSessionService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private sanitizer = inject(DomSanitizer);

  // Ajout de UserPlus pour l'icône d'inscription
  readonly icons = {
    ChevronLeft, Loader2, Lock, MessageSquare, AlertTriangle, PlayCircle,
    ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Send, UserPlus
  };

  sessionId = signal<string>('');
  sessionData = signal<LiveSessionStudentDTO | null>(null);

  isLoading = signal<boolean>(true);
  isRegistering = signal<boolean>(false); // Nouvel état pour le bouton d'inscription
  errorMessage = signal<string>('');

  safeStreamUrl = signal<SafeResourceUrl | null>(null);
  safeToolUrl = signal<SafeResourceUrl | null>(null);

  currentUser = computed(() => this.authService.getUser());

  userProfile = signal<UserDTO | null>(null);
  isProfileLoading = signal<boolean>(true);

  // Logique d'accès complet basée sur le rôle ou l'inscription (isRegistered)
  hasFullAccess = computed(() => {
    const user = this.currentUser();
    const session = this.sessionData();

    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return true;
    if (session && session.isRegistered) return true;

    return false;
  });

  isToolVisible = signal<boolean>(true);
  isChatVisible = signal<boolean>(true);

  chatInput = signal<string>('');
  chatMessages = signal<{ user: string, text: string, time: string, isInstructor: boolean, isSystem: boolean }[]>([]);

  ngOnInit(): void {
    this.fetchUserProfile();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      this.joinSession(id);
    }
  }

  ngOnDestroy(): void {
    // Logique future : Fermer les WebSockets
  }

  private fetchUserProfile(): void {
    this.isProfileLoading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.userProfile.set(profile);
        this.isProfileLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch user profile', err);
        this.isProfileLoading.set(false);
      }
    });
  }

  toggleTool(): void {
    this.isToolVisible.set(!this.isToolVisible());
  }

  toggleChat(): void {
    this.isChatVisible.set(!this.isChatVisible());
  }

  sendMessage(): void {
    if (!this.chatInput().trim()) return;

    this.chatMessages.update(msgs => [...msgs, {
      user: this.currentUser()?.firstName || 'Student',
      text: this.chatInput(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInstructor: this.currentUser()?.role === 'INSTRUCTOR' || this.currentUser()?.role === 'ADMIN',
      isSystem: false
    }]);

    this.chatInput.set('');
  }

  private joinSession(id: string): void {
    this.isLoading.set(true);
    this.liveSessionService.joinLiveSession(id).subscribe({
      next: (data) => {
        this.sessionData.set(data);

        this.setupStreamIframe(data.whepUrl);
        this.setupToolIframe(data.toolType);

        if (data.toolType === 'NONE') {
          this.isToolVisible.set(false);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to join session', err);
        // Si l'utilisateur n'est pas du tout inscrit au cours (403)
        if (err.status === 403) {
          this.errorMessage.set('You must be enrolled in the associated course to access its live sessions.');
        } else {
          this.errorMessage.set('The session is unavailable or has not started yet.');
        }
        this.isLoading.set(false);
      }
    });
  }

  // Permet à un étudiant de s'enregistrer à la session s'il a déjà acheté le cours
  registerAndJoin(): void {
    this.isRegistering.set(true);
    this.liveSessionService.registerForSession(this.sessionId()).subscribe({
      next: () => {
        // Recharge les données pour obtenir les URL (whepUrl, etc.) si elles étaient cachées
        this.joinSession(this.sessionId());
        this.isRegistering.set(false);
      },
      error: (err) => {
        console.error('Failed to RSVP', err);
        this.errorMessage.set('Failed to register for the session. Please try again.');
        this.isRegistering.set(false);
      }
    });
  }

  private setupStreamIframe(url: string | undefined): void {
    if (!url) return;

    let playerUrl = url;
    if (playerUrl.endsWith('/whep')) {
      playerUrl = playerUrl.substring(0, playerUrl.length - 5);
    } else if (playerUrl.endsWith('/whep/')) {
      playerUrl = playerUrl.substring(0, playerUrl.length - 6);
    }

    const token = this.authService.getToken();

    if (token) {
      const separator = playerUrl.includes('?') ? '&' : '?';
      playerUrl = `${playerUrl}${separator}token=${token}`;
    }

    this.safeStreamUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(playerUrl));
  }

  private setupToolIframe(toolType: string): void {
    if (toolType === 'NONE') return;

    let toolUrl = '';

    switch (toolType) {
      case 'PYTHON_IDE':
        toolUrl = 'https://trinket.io/embed/python3';
        break;
      case 'JUPYTER_NOTEBOOK':
        toolUrl = 'https://jupyter.org/try-jupyter/lab/';
        break;
      case 'TRADING_TERMINAL':
        toolUrl = '/internal-trading-terminal';
        break;
      default:
        return;
    }

    if (toolUrl.startsWith('http')) {
      this.safeToolUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(toolUrl));
    }
  }
}