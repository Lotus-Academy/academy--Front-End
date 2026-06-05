import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  LucideAngularModule, Menu, X, Search, Moon, Sun, CheckCircle, ChevronDown,
  LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info, Globe, TrendingUp, BarChart3, Brain, Shield, Heart, BookOpen, Cpu
} from 'lucide-angular';

import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';
import { CourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';

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
  private courseService = inject(CourseService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isLoggedIn = computed(() => this.authService.isAuthenticated());
  user = computed(() => this.authService.getUser());

  isMobileMenuOpen = false;
  isNotificationsOpen = signal<boolean>(false);
  isLanguageMenuOpen = signal<boolean>(false);

  // États d'ouverture Coursera-like
  isExploreMenuOpen = signal<boolean>(false);
  isSearchFocused = signal<boolean>(false);

  searchQuery = signal<string>('');
  filteredCourses = signal<CourseResponseDTO[]>([]);

  // Signal brut alimenté par les VRAIES catégories renvoyées par ton API Spring Boot
  popularCategories = signal<CategoryDTO[]>([]);

  // Pipeline de debounce pour l'Instant Search de la Navbar
  private searchSubject = new Subject<string>();

  notifications = signal<AppNotification[]>([]);
  unreadNotifications = computed(() => this.notifications().filter(n => !n.read).length);

  readonly icons = {
    Menu, X, Search, Moon, Sun, CheckCircle, ChevronDown, Globe,
    LayoutDashboard, Bell, CheckCheck, AlertTriangle, Info, TrendingUp, BarChart3, Brain, Shield, Heart
  };

  // Configuration visuelle pour mapper tes icônes sur les vrais noms de ta DB
  private topicConfig: Record<string, { icon: any, color: string, subKey: string }> = {
    "Algorithmic Trading": { icon: TrendingUp, color: "text-lotus bg-lotus/10 border-lotus/20", subKey: "NAVBAR.EXPLORE_SUB_ALGO" },
    "Quantitative Finance": { icon: BarChart3, color: "text-blue-600 bg-blue-500/10 border-blue-500/20", subKey: "NAVBAR.EXPLORE_SUB_QUANT" },
    "Programming": { icon: Cpu, color: "text-purple-600 bg-purple-500/10 border-purple-500/20", subKey: "NAVBAR.EXPLORE_SUB_ML" },
    "Machine Learning": { icon: Brain, color: "text-purple-600 bg-purple-500/10 border-purple-500/20", subKey: "NAVBAR.EXPLORE_SUB_ML" },
    "Risk Management": { icon: Shield, color: "text-amber-600 bg-amber-500/10 border-amber-500/20", subKey: "NAVBAR.EXPLORE_SUB_RISK" },
    "Trading Psychology": { icon: Heart, color: "text-rose-600 bg-rose-500/10 border-rose-500/20", subKey: "NAVBAR.EXPLORE_SUB_PSYCHO" }
  };

  // Génération dynamique et réactive des catégories réelles pour le Méga-Menu Explore
  topics = computed(() => {
    return this.popularCategories().map(cat => {
      const config = this.topicConfig[cat.name] || { icon: BookOpen, color: "text-slate-600 bg-slate-100 border-slate-200", subKey: "HOME.TOPICS.SUBTITLE" };
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: config.icon,
        color: config.color,
        subKey: config.subKey
      };
    });
  });

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

    // 1. Appel synchrone à l'API pour récupérer les vraies catégories configurées en base de données
    this.courseService.getPopularCategories().subscribe({
      next: (data) => this.popularCategories.set(data),
      error: (err) => console.error('Erreur de chargement des catégories réelles', err)
    });

    // 2. Branchement de l'Instant Search sur le endpoint réel de ton CourseService
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length === 0) {
          return [null];
        }
        return this.courseService.searchCoursesInstant(query);
      })
    ).subscribe({
      next: (pageResult) => {
        if (pageResult && pageResult.content) {
          this.filteredCourses.set(pageResult.content);
        } else {
          this.filteredCourses.set([]);
        }
      },
      error: (err) => console.error('Erreur Instant Search Navbar', err)
    });
  }

  ngOnDestroy(): void {
    if (this.isLoggedIn()) {
      this.notificationService.disconnectStream();
    }
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/courses'], { queryParams: { search: query } });
      this.searchQuery.set('');
      this.isSearchFocused.set(false);
      this.isMobileMenuOpen = false;
    }
  }

  closeAllMenus(): void {
    this.isExploreMenuOpen.set(false);
    this.isSearchFocused.set(false);
    this.isLanguageMenuOpen.set(false);
    this.isMobileMenuOpen = false;
  }

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