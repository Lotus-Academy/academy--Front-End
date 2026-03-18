import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Menu, X, Search, Globe, Moon, Sun, ChevronDown, CheckCircle,
  LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info
} from 'lucide-angular';

import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';

interface NavLink {
  href: string;
  labelKey: string;
  fragment?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  // N'oubliez pas d'ajouter le DatePipe ici
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, TranslateModule, DatePipe],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isLoggedIn = computed(() => this.authService.isAuthenticated());
  user = computed(() => this.authService.getUser());

  isMobileMenuOpen = false;
  isLanguageMenuOpen = signal<boolean>(false);
  isNotificationsOpen = signal<boolean>(false);

  notifications = signal<AppNotification[]>([]);
  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  readonly icons = {
    Menu, X, Search, Globe, Moon, Sun, ChevronDown, CheckCircle,
    LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info
  };

  navLinks: NavLink[] = [
    { href: '/', fragment: 'hero', labelKey: 'NAVBAR.HOME' },
    { href: '/courses', labelKey: 'NAVBAR.COURSES' },
    { href: '/instructor-register', fragment: 'topics', labelKey: 'NAVBAR.TEACH' },
    { href: '/', fragment: 'faq', labelKey: 'NAVBAR.FAQ' },
  ];

  ngOnInit(): void {
    // On ne charge les notifications que si l'utilisateur est connecté
    if (this.isLoggedIn()) {
      this.notificationService.getNotifications().subscribe({
        next: (data) => this.notifications.set(data),
        error: (err) => console.error('Erreur lors du chargement des notifications', err)
      });

      this.notificationService.connectToStream((newNotif: AppNotification) => {
        this.notifications.update(current => [newNotif, ...current]);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isLoggedIn()) {
      this.notificationService.disconnectStream();
    }
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // --- GESTION DE LA LANGUE ---
  toggleLanguageMenu(): void {
    this.isNotificationsOpen.set(false); // Ferme les notifications si ouvertes
    this.isLanguageMenuOpen.update(v => !v);
  }

  closeLanguageMenu(): void {
    this.isLanguageMenuOpen.set(false);
  }

  switchLanguage(lang: 'fr' | 'en'): void {
    this.languageService.setLanguage(lang);
    this.closeLanguageMenu();
  }

  // --- GESTION DES NOTIFICATIONS ---
  toggleNotifications(): void {
    this.isLanguageMenuOpen.set(false); // Ferme les langues si ouvertes
    this.isNotificationsOpen.update(v => !v);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  markAsRead(notification: AppNotification): void {
    if (notification.read) return;

    this.notifications.update(notifs =>
      notifs.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => {
        this.notifications.update(notifs =>
          notifs.map(n => n.id === notification.id ? { ...n, read: false } : n)
        );
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadNotifications() === 0) return;

    this.notifications.update(notifs =>
      notifs.map(n => ({ ...n, read: true }))
    );

    this.notificationService.markAllAsRead().subscribe();
  }
}