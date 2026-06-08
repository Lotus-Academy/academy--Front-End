import { Component, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown,
  CheckCircle, AlertTriangle, Info, AlertCircle, FileEdit, CheckCheck, Gift, Share2, Cpu, TrendingUp, BarChart3, Brain, Shield, Heart
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';
import { CategoryDTO } from '../../../core/models/course.dto';

export interface NavLink {
  labelKey: string;
  href: string;
  icon: any;
  requiresApproval: boolean;
  dividerBefore?: boolean;
  badgeKey?: string;
  isDisabled?: boolean;
}

@Component({
  selector: 'app-shared-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, DatePipe, TranslateModule],
  templateUrl: './shared-layout.component.html'
})
export class SharedLayoutComponent implements OnInit, OnDestroy {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) navLinks!: NavLink[];
  @Input({ required: true }) badgeText!: string;
  @Input({ required: true }) badgeClasses!: string;
  @Input({ required: true }) profileLink!: string;
  @Input({ required: true }) profileRoleText!: string;
  @Input() profileStatus?: 'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED';
  @Input() hasValidTerms?: boolean = true;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  public languageService = inject(LanguageService);

  readonly icons = {
    Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown, CheckCheck,
    CheckCircle, AlertTriangle, Info, AlertCircle, FileEdit, Gift, Share2, Cpu, TrendingUp, BarChart3, Brain, Shield, Heart
  };

  // Signaux réactifs pour les menus d'interfaçage
  isSidebarOpen = signal<boolean>(false);
  isSidebarCollapsed = signal<boolean>(false); // <-- AJOUT : COMMUTATEUR ÉCRAN PC
  isNotificationsOpen = signal<boolean>(false);
  isLanguageMenuOpen = signal<boolean>(false);

  user = computed(() => this.authService.getUser());
  notifications = signal<AppNotification[]>([]);
  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  referralCode = signal<string | null>(null);
  copySuccess = signal<boolean>(false);

  // Configuration locale temporaire pour éviter d'éventuels bugs d'icônes
  popularCategories = signal<CategoryDTO[]>([]);
  topics = computed(() => []);

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (userData) => {
        if (userData.referralCode) this.referralCode.set(userData.referralCode);
      }
    });

    this.notificationService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => console.error('Erreur lors du chargement des notifications', err)
    });

    this.notificationService.connectToStream((newNotif: AppNotification) => {
      this.notifications.update(current => [newNotif, ...current]);
    });

    // Récupération de l'état réduit enregistré en session
    const savedState = localStorage.getItem('dashboard_sidebar_collapsed');
    if (savedState === 'true') {
      this.isSidebarCollapsed.set(true);
    }
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectStream();
  }

  copyReferralLink(): void {
    const code = this.referralCode();
    if (!code) return;
    const referralLink = `${environment.clientApiUrl}/login?ref=${code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  // --- ACTIONS COMMUTATEURS ---
  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(v => {
      const newState = !v;
      localStorage.setItem('dashboard_sidebar_collapsed', String(newState));
      return newState;
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.isLanguageMenuOpen.set(false);
    this.isNotificationsOpen.update(v => !v);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  toggleLanguageMenu(): void {
    this.isNotificationsOpen.set(false);
    this.isLanguageMenuOpen.update(v => !v);
  }

  closeLanguageMenu(): void {
    this.isLanguageMenuOpen.set(false);
  }

  switchLanguage(lang: 'fr' | 'en'): void {
    this.languageService.setLanguage(lang);
    this.closeLanguageMenu();
  }

  markAsRead(notification: AppNotification): void {
    if (notification.read) return;
    this.notifications.update(notifs => notifs.map(n => n.id === notification.id ? { ...n, read: true } : n));
    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => this.notifications.update(notifs => notifs.map(n => n.id === notification.id ? { ...n, read: false } : n))
    });
  }

  markAllAsRead(): void {
    if (this.unreadNotifications() === 0) return;
    this.notifications.update(notifs => notifs.map(n => ({ ...n, read: true })));
    this.notificationService.markAllAsRead().subscribe();
  }

  handleSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}