import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  PlayCircle,
  Clock,
  BookOpen,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Globe,
  MonitorPlay,
  Unlock,
  User,
  Loader2,
  X
} from 'lucide-angular';

import { NavbarComponent } from '../../layouts/navbar-component/navbar.component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';
import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { PaymentService } from '../../../core/services/payment.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    CurrencyPipe,
    TranslateModule
  ],
  templateUrl: './course-detail-component.html'
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private paymentService = inject(PaymentService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);

  readonly icons = {
    PlayCircle, Clock, BookOpen, CheckCircle, Lock,
    ChevronDown, ChevronUp, Award, Globe, MonitorPlay, Unlock, User, Loader2, X
  };

  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);
  isPlayingTrailer = signal<boolean>(false);

  // États d'authentification et d'accès
  isProcessingPayment = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);
  isAlreadyEnrolled = signal<boolean>(false);
  currentUser = computed(() => this.authService.getUser());

  // Vérifie si l'utilisateur possède un accès total (Admin, Propriétaire ou Inscrit)
  hasFullAccess = computed(() => {
    const user = this.currentUser();
    const courseData = this.course();
    if (!user || !courseData) return false;

    if (user.role === 'ADMIN') return true;
    if (user.role === 'INSTRUCTOR' && courseData.instructorId === user.userId) return true;

    return this.isAlreadyEnrolled();
  });

  // Détermine dynamiquement le texte du bouton d'action principal
  actionButtonLabel = computed(() => {
    if (this.isProcessingPayment()) return 'Redirection...';

    const user = this.currentUser();
    const courseData = this.course();

    if (user?.role === 'ADMIN' || (user?.role === 'INSTRUCTOR' && courseData?.instructorId === user.userId)) {
      return 'COURSE_DETAIL.ACCESS_COURSE'; // Clé à ajouter : "Accéder au cours"
    }

    if (this.isAlreadyEnrolled()) {
      return 'COURSE_DETAIL.RESUME_COURSE'; // Clé à ajouter : "Reprendre le cours"
    }

    return 'COURSE_DETAIL.ENROLL_NOW'; // "S'inscrire maintenant"
  });

  totalSections = computed(() => this.course()?.sections?.length || 0);

  totalLessons = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  totalDuration = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => {
      const secDuration = section.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
      return acc + secDuration;
    }, 0);
  });

  expandedSections = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.isAuthenticated.set(this.authService.isAuthenticated());

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseDetails(id);
    }
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);

    this.courseService.getCourseById(id).subscribe({
      next: (data: CourseResponseDTO) => {
        this.course.set(data);
        if (data.sections && data.sections.length > 0) {
          this.toggleSection(data.sections[0].id);
        }

        // On vérifie l'inscription uniquement si l'utilisateur est connecté et n'est ni Admin ni le Propriétaire
        const user = this.currentUser();
        if (this.isAuthenticated() && user?.role !== 'ADMIN' && !(user?.role === 'INSTRUCTOR' && data.instructorId === user.userId)) {
          this.checkEnrollmentStatus(id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du cours :', error);
        this.isLoading.set(false);
      }
    });
  }

  private checkEnrollmentStatus(courseId: string): void {
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (enrollments: any[]) => {
        const enrolled = enrollments.some(e => e.courseId === courseId || (e.course && e.course.id === courseId));
        this.isAlreadyEnrolled.set(enrolled);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Erreur vérification inscription", err);
        this.isLoading.set(false);
      }
    });
  }

  handleEnrollAction(): void {
    const courseData = this.course();
    if (!courseData) return;

    // 1. Redirection vers le login si non connecté
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const user = this.currentUser();

    // 2. L'administrateur a un accès absolu
    if (user?.role === 'ADMIN') {
      this.router.navigate(['/player', courseData.id]);
      return;
    }

    // 3. Gestion stricte pour l'instructeur
    if (user?.role === 'INSTRUCTOR') {
      if (courseData.instructorId === user.userId) {
        this.router.navigate(['/player', courseData.id]);
      } else {
        alert("En tant qu'instructeur, vous ne pouvez pas vous inscrire aux cours d'autres formateurs.");
      }
      return;
    }

    // 4. L'étudiant possède déjà le cours
    if (this.isAlreadyEnrolled()) {
      this.router.navigate(['/player', courseData.id]);
      return;
    }

    // 5. Étudiant non inscrit -> Redirection vers le paiement
    this.isProcessingPayment.set(true);

    this.paymentService.createCheckoutSession(courseData.id).subscribe({
      next: (response: any) => {
        const stripeCheckoutUrl = response.url || response.checkoutUrl || response;
        window.location.href = stripeCheckoutUrl;
      },
      error: (err) => {
        console.error("Erreur de création de session Stripe", err);
        alert("Impossible de procéder au paiement. Veuillez réessayer plus tard.");
        this.isProcessingPayment.set(false);
      }
    });
  }

  handleLessonClick(lesson: any): void {
    const courseData = this.course();
    if (!courseData) return;

    // Si la leçon est en aperçu gratuit OU si l'utilisateur a un accès total, on ouvre le lecteur
    if (lesson.freePreview || this.hasFullAccess()) {
      this.router.navigate(['/player', courseData.id]);
    } else {
      // Si la leçon est bloquée, on redirige vers la logique d'inscription
      // Cela fera défiler la page vers le bouton d'achat ou déclenchera l'alerte/redirection appropriée
      this.handleEnrollAction();
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  }

  toggleSection(sectionId: string): void {
    const currentExpanded = new Set(this.expandedSections());
    if (currentExpanded.has(sectionId)) {
      currentExpanded.delete(sectionId);
    } else {
      currentExpanded.add(sectionId);
    }
    this.expandedSections.set(currentExpanded);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }

  openTrailer(): void {
    if (this.course()?.trailerUrl) {
      this.isPlayingTrailer.set(true);
      document.body.style.overflow = 'hidden';
    }
  }

  closeTrailer(): void {
    this.isPlayingTrailer.set(false);
    document.body.style.overflow = 'auto';
  }
}