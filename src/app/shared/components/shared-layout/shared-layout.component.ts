import { Component, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  LucideAngularModule, Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown,
  CheckCircle, AlertTriangle, Info, AlertCircle, FileEdit
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme-service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

export interface NavLink {
  href: string;
  label: string;
  icon: any;
  requiresApproval?: boolean;
}

@Component({
  selector: 'app-shared-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, DatePipe, TranslateModule],
  templateUrl: './shared-layout.component.html'
})
export class SharedLayoutComponent implements OnInit, OnDestroy {
  // --- PARAMÈTRES REÇUS DES COMPOSANTS ENFANTS (Admin, Instructor, Student) ---
  @Input({ required: true }) title!: string;
  @Input({ required: true }) navLinks!: NavLink[];

  @Input({ required: true }) badgeText!: string;
  @Input({ required: true }) badgeClasses!: string;

  @Input({ required: true }) profileLink!: string;
  @Input({ required: true }) profileRoleText!: string;

  // Spécifique à l'instructeur
  @Input() profileStatus?: 'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED';

  // --- INJECTIONS DES SERVICES ---
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  public languageService = inject(LanguageService);

  // --- GESTION DES ICÔNES ---
  readonly icons = {
    Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown,
    CheckCircle, AlertTriangle, Info, AlertCircle, FileEdit
  };

  // --- ÉTATS RÉACTIFS ---
  isSidebarOpen = signal<boolean>(false);
  user = computed(() => this.authService.getUser());

  isNotificationsOpen = signal<boolean>(false);
  notifications = signal<AppNotification[]>([]);
  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  // Signal pour le menu des langues
  isLanguageMenuOpen = signal<boolean>(false);

  // --- CYCLE DE VIE ---
  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (err) => console.error('Erreur lors du chargement des notifications', err)
    });

    this.notificationService.connectToStream((newNotif: AppNotification) => {
      this.notifications.update(current => [newNotif, ...current]);
    });
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectStream();
  }

  // --- MÉTHODES D'INTERACTION ---
  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update(v => !v);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  // --- GESTION DES LANGUES ---
  toggleLanguageMenu(): void {
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
    this.notifications.update(notifs =>
      notifs.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
  }

  handleSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}