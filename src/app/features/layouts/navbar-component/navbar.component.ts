import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Menu, X, Search, Moon, Sun, CheckCircle, ChevronDown,
  LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info, Globe
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
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, LucideAngularModule, TranslateModule, DatePipe],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isLoggedIn = computed(() => this.authService.isAuthenticated());
  user = computed(() => this.authService.getUser());

  isMobileMenuOpen = false;
  isNotificationsOpen = signal<boolean>(false);
  isLanguageMenuOpen = signal<boolean>(false);

  // --- LOGIQUE DE RECHERCHE ---
  searchQuery = signal<string>('');
  isOverlaySearchOpen = signal<boolean>(false);

  notifications = signal<AppNotification[]>([]);
  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  readonly icons = {
    Menu, X, Search, Moon, Sun, CheckCircle, ChevronDown, Globe,
    LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info
  };

  navLinks: NavLink[] = [
    { href: '/courses', labelKey: 'NAVBAR.COURSES' },
    { href: '/instructor-register', fragment: 'topics', labelKey: 'NAVBAR.TEACH' },
    { href: '/', fragment: 'faq', labelKey: 'NAVBAR.FAQ' }
  ];

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.notificationService.getNotifications().subscribe({
        next: (data) => this.notifications.set(data),
        error: (err) => console.error('Error loading notifications', err)
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

  // --- RECHERCHE ---
  toggleOverlaySearch(): void {
    this.isOverlaySearchOpen.update(v => !v);
  }

  closeOverlaySearch(): void {
    this.isOverlaySearchOpen.set(false);
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/courses'], { queryParams: { q: query } });
      this.searchQuery.set('');
      this.closeOverlaySearch();
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isOverlaySearchOpen()) {
      const clickedInside = this.elementRef.nativeElement.contains(event.target);
      const target = event.target as HTMLElement;
      const isSearchButton = target.closest('button[aria-label="Open search"]');
      
      if (!clickedInside && !isSearchButton) {
        this.closeOverlaySearch();
      }
    }
  }

  // --- MENUS ---
  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
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

  toggleNotifications(): void {
    this.isLanguageMenuOpen.set(false);
    this.isNotificationsOpen.update(v => !v);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
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
}