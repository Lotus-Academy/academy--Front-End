import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Brain,
  Shield,
  Heart,
  Database,
  BookOpen,
  Star,
  Cpu,
  Activity,
  CheckCircle,
  LayoutDashboard,
  Search
} from 'lucide-angular';
import { HomeLayoutComponent } from '../../layouts/home-layout/home-layout.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, HomeLayoutComponent, TranslateModule, CourseCardComponent],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private courseService = inject(CourseService);
  private router = inject(Router);

  // Signaux d'état utilisateur globaux
  user = computed(() => this.authService.getUser());

  // Signaux alimentés par les VRAIES données de l'API
  featuredCourses = signal<CourseResponseDTO[]>([]);
  popularCategories = signal<CategoryDTO[]>([]);
  filteredCourses = signal<CourseResponseDTO[]>([]);

  // Signaux de contrôle UI
  isSearchFocused = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Gestion du flux asynchrone de recherche (Debounce pour préserver le rate limiting de l'API)
  private searchSubject = new Subject<string>();

  readonly icons = {
    ArrowRight, Play, TrendingUp, Users, Award,
    BarChart3, Brain, Shield, Heart, Database, BookOpen, Star, Cpu, Activity, CheckCircle, LayoutDashboard, Search
  };

  stats = [
    { value: "50,000+", labelKey: "HOME.STATS.STUDENTS" },
    { value: "200+", labelKey: "HOME.STATS.COURSES" },
    { value: "4.9 / 5", labelKey: "HOME.STATS.RATING" },
  ];

  // Métadonnées d'affichage pour les thématiques phares (icônes et styles)
  private topicConfig: Record<string, { icon: any, color: string }> = {
    "Algorithmic Trading": { icon: TrendingUp, color: "text-lotus bg-lotus/10 border-lotus/20" },
    "Quantitative Finance": { icon: BarChart3, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    "Programming": { icon: Cpu, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
    "Machine Learning": { icon: Brain, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
    "Risk Management": { icon: Shield, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    "Trading Psychology": { icon: Heart, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" }
  };

  // Signal calculé combinant les catégories de l'API avec leurs configurations visuelles
  topics = computed(() => {
    return this.popularCategories().map(cat => {
      const config = this.topicConfig[cat.name] || { icon: BookOpen, color: "text-slate-600 bg-slate-100 border-slate-200" };
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: config.icon,
        color: config.color,
        query: cat.name
      };
    });
  });

  marqueeItems: string[] = [
    'LOTUS CAPITAL GESTION', '•', 'STANFORD QUANT GROUP', '•',
    'MIT TECH', '•', 'BLOOMBERG TERMINAL', '•',
    'CHICAGO MERCANTILE EXCHANGE', '•', 'LONDON STOCK EXCHANGE', '•',
    'LOTUS CAPITAL GESTION', '•', 'STANFORD QUANT GROUP', '•',
    'MIT TECH', '•', 'BLOOMBERG TERMINAL', '•',
    'CHICAGO MERCANTILE EXCHANGE', '•', 'LONDON STOCK EXCHANGE'
  ];

  testimonials = [
    {
      name: 'Alex Thompson',
      role: 'Quantitative Analyst at Goldman Sachs',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      content: "Lotus Academy's courses gave me the practical skills I needed to advance my career. The instructors are world-class.",
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Independent Trader',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      content: "The algorithmic trading course helped me automate my strategies and significantly improve my returns. Worth every penny!",
      rating: 5
    },
    {
      name: 'David Chen',
      role: 'Portfolio Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      content: "The risk management course completely changed how I approach portfolio construction. The expertise shared here is unmatched.",
      rating: 5
    }
  ];

  activeIndex: number | null = null;

  faqs = [
    { questionKey: 'HOME.FAQ.Q1', answerKey: 'HOME.FAQ.A1' },
    { questionKey: 'HOME.FAQ.Q2', answerKey: 'HOME.FAQ.A2' },
    //{ questionKey: 'HOME.FAQ.Q3', answerKey: 'HOME.FAQ.A3' },
    //{ questionKey: 'HOME.FAQ.Q4', answerKey: 'HOME.FAQ.A4' }
  ];

  toggleFaq(index: number): void {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  ngOnInit(): void {
    // 1. Chargement des VRAIS cours tendance (Trending) depuis l'API
    this.courseService.getTrendingCourses().subscribe({
      next: (courses) => this.featuredCourses.set(courses.slice(0, 4)),
      error: (err) => console.error("Erreur lors de la récupération des cours de l'API", err)
    });

    // 2. Chargement des VRAIES catégories populaires depuis l'API
    this.courseService.getPopularCategories().subscribe({
      next: (categories) => this.popularCategories.set(categories.slice(0, 5)),
      error: (err) => console.error("Erreur lors de la récupération des catégories de l'API", err)
    });

    // 3. Pipeline réactif de l'Instant Search (Debounce pour ne pas surcharger PostgreSQL)
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
      error: (err) => console.error("Erreur lors du traitement de la recherche instantanée", err)
    });
  }

  // Déclenché à chaque modification de saisie dans la zone de recherche
  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  // Redirection vers le catalogue complet lors de la validation
  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/courses'], { queryParams: { search: query } });
      this.searchQuery.set('');
      this.isSearchFocused.set(false);
    }
  }
}