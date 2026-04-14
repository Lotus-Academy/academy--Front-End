import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, ChevronLeft, Loader2, Lock, MessageSquare, AlertTriangle,
  PlayCircle, ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Send
} from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserDTO } from '../../../core/services/user.service';
import { LiveSessionStudentDTO } from '../../../core/models/live-session.dto';

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

  readonly icons = {
    ChevronLeft, Loader2, Lock, MessageSquare, AlertTriangle, PlayCircle,
    ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Send
  };

  sessionId = signal<string>('');
  sessionData = signal<LiveSessionStudentDTO | null>(null);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // URL sécurisée pour le flux WebRTC (MediaMTX) au lieu de YouTube
  safeStreamUrl = signal<SafeResourceUrl | null>(null);
  safeToolUrl = signal<SafeResourceUrl | null>(null);

  currentUser = computed(() => this.authService.getUser());

  userProfile = signal<UserDTO | null>(null);
  isProfileLoading = signal<boolean>(true);

  isEliteUser = computed(() => {
    const user = this.currentUser();
    const profile = this.userProfile();

    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return true;

    if (!profile) return false;

    return profile.subscriptionTier === 'ELITE' && profile.subscriptionStatus === 'ACTIVE';
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
        console.error('Failed to fetch real-time subscription status', err);
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

        // Utilisation de whepUrl
        this.setupStreamIframe(data.whepUrl);
        this.setupToolIframe(data.toolType);

        if (data.toolType === 'NONE') {
          this.isToolVisible.set(false);
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to join session', err);
        if (err.status === 403) {
          this.errorMessage.set('Your current subscription tier does not grant access to live sessions. Please upgrade.');
        } else {
          this.errorMessage.set('The session is unavailable or has not started yet.');
        }
        this.isLoading.set(false);
      }
    });
  }

  // Configuration de l'Iframe pour le player WebRTC de MediaMTX
  private setupStreamIframe(url: string | undefined): void {
    if (!url) return;

    // 1. On nettoie l'URL pour pointer vers le lecteur web HTML de MediaMTX
    let playerUrl = url;
    if (playerUrl.endsWith('/whep')) {
      playerUrl = playerUrl.substring(0, playerUrl.length - 5);
    } else if (playerUrl.endsWith('/whep/')) {
      playerUrl = playerUrl.substring(0, playerUrl.length - 6);
    }

    // 2. On récupère le Token JWT de l'utilisateur connecté
    const token = this.authService.getToken();

    // 3. On ajoute le token en paramètre d'URL pour l'authentification MediaMTX
    if (token) {
      // On vérifie s'il y a déjà des paramètres (avec '?') pour utiliser '&' ou '?'
      const separator = playerUrl.includes('?') ? '&' : '?';
      playerUrl = `${playerUrl}${separator}token=${token}`;
    }

    // 4. On sécurise l'URL finale pour l'Iframe
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