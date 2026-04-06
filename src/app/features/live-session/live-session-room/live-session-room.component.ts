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

  safeYoutubeUrl = signal<SafeResourceUrl | null>(null);
  safeToolUrl = signal<SafeResourceUrl | null>(null);

  currentUser = computed(() => this.authService.getUser());

  // Profile state from backend
  userProfile = signal<UserDTO | null>(null);
  isProfileLoading = signal<boolean>(true);

  // Elite Access Validation
  isEliteUser = computed(() => {
    const user = this.currentUser();
    const profile = this.userProfile();

    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') return true;

    // Prevent locking if the profile is still being fetched from the server
    if (!profile) return false;

    // Strict validation against real-time database values
    return profile.subscriptionTier === 'ELITE' && profile.subscriptionStatus === 'ACTIVE';
  });

  // Layout States
  isToolVisible = signal<boolean>(true);
  isChatVisible = signal<boolean>(true);

  // Chat States
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
    // Future implementation: Close WebSocket connections for the live chat
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
        this.setupYoutubeIframe(data.youtubeUrl);
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

  private setupYoutubeIframe(url: string): void {
    if (!url) return;

    let embedUrl = url;
    if (url.includes('watch?v=')) {
      embedUrl = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
      embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
    }

    const finalUrl = `${embedUrl}?autoplay=1&rel=0&modestbranding=1`;
    this.safeYoutubeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl));
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