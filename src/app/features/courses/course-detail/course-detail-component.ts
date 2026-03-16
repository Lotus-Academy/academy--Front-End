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
  X // <-- AJOUT DE L'ICÔNE X
} from 'lucide-angular';

import { NavbarComponent } from '../../layouts/navbar-component/navbar-component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';
import { CourseService } from '../../../core/services/course.service'; // Correction de l'import (tiret vers point)
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

  //for the payment
  isProcessingPayment = signal<boolean>(false);
  isAlreadyEnrolled = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);

  readonly icons = {
    PlayCircle, Clock, BookOpen, CheckCircle, Lock,
    ChevronDown, ChevronUp, Award, Globe, MonitorPlay, Unlock, User, Loader2, X // <-- AJOUT ICI
  };

  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);



  // NOUVEAU : État pour gérer la modale de la vidéo
  isPlayingTrailer = signal<boolean>(false);

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
    // 1. Vérification de la connexion
    this.isAuthenticated.set(this.authService.isAuthenticated());

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseDetails(id);

      // 2. Si l'utilisateur est connecté, on vérifie s'il possède déjà ce cours
      if (this.isAuthenticated()) {
        this.checkEnrollmentStatus(id);
      }
    }
  }

  private checkEnrollmentStatus(courseId: string): void {
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (enrollments) => {
        // On cherche si l'ID du cours actuel est dans la liste des achats
        // Ajustez "e.course.id" ou "e.courseId" selon le DTO exact renvoyé par /enrollments/me
        const enrolled = enrollments.some(e => e.courseId === courseId || (e.course && e.course.id === courseId));
        this.isAlreadyEnrolled.set(enrolled);
      },
      error: (err) => console.error("Erreur vérification inscription", err)
    });
  }

  // Gère le clic sur le bouton d'inscription/accès
  handleEnrollAction(): void {
    const courseData = this.course();
    if (!courseData) return;

    // Cas 1 : L'utilisateur n'est pas connecté
    if (!this.isAuthenticated()) {
      // On l'envoie vers le login, et on dit au login de revenir sur ce cours après
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // Cas 2 : L'utilisateur est connecté ET possède déjà le cours
    if (this.isAlreadyEnrolled()) {
      // On l'envoie vers la salle de classe (Lecteur vidéo) que nous allons construire ensuite
      this.router.navigate(['/player', courseData.id]);
      return;
    }

    // Cas 3 : Utilisateur connecté mais pas encore inscrit -> Go au paiement !
    this.isProcessingPayment.set(true);

    this.paymentService.createCheckoutSession(courseData.id).subscribe({
      next: (response: any) => {
        // On récupère le lien exact dans l'objet JSON renvoyé par Spring Boot
        // (Généralement, la clé s'appelle "url" ou "checkoutUrl", j'ai mis les deux pour être sûr)
        const stripeCheckoutUrl = response.url || response.checkoutUrl || response;

        // Redirection vers le domaine sécurisé de Stripe
        window.location.href = stripeCheckoutUrl;
      },
      error: (err) => {
        console.error("Erreur de création de session Stripe", err);
        alert("Impossible de procéder au paiement. Veuillez réessayer plus tard.");
        this.isProcessingPayment.set(false);
      }
    });
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);

    this.courseService.getCourseById(id).subscribe({
      next: (data: CourseResponseDTO) => {
        this.course.set(data);
        if (data.sections && data.sections.length > 0) {
          this.toggleSection(data.sections[0].id);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du cours :', error);
        this.isLoading.set(false);
      }
    });
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

  // NOUVEAU : Méthodes pour ouvrir/fermer le trailer
  openTrailer(): void {
    if (this.course()?.trailerUrl) {
      this.isPlayingTrailer.set(true);
      // Optionnel : Bloquer le scroll du body quand la modale est ouverte
      document.body.style.overflow = 'hidden';
    }
  }

  closeTrailer(): void {
    this.isPlayingTrailer.set(false);
    // Rétablir le scroll
    document.body.style.overflow = 'auto';
  }
}