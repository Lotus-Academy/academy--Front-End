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

// IMPORT THE DIRECTIVE FOR RENDERED DESCRIPTION
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';

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
    TranslateModule,
    LivePreviewDirective // ADDED TO IMPORTS
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

  // Auth & Access States
  isProcessingPayment = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);
  isAlreadyEnrolled = signal<boolean>(false);
  currentUser = computed(() => this.authService.getUser());

  // Verify if the user has full access (Admin, Owner, or Enrolled)
  hasFullAccess = computed(() => {
    const user = this.currentUser();
    const courseData = this.course();
    if (!user || !courseData) return false;

    if (user.role === 'ADMIN') return true;
    if (user.role === 'INSTRUCTOR' && courseData.instructorId === user.userId) return true;

    return this.isAlreadyEnrolled();
  });

  // Dynamically determine the main action button text
  actionButtonLabel = computed(() => {
    if (this.isProcessingPayment()) return 'Redirecting...';

    const user = this.currentUser();
    const courseData = this.course();

    if (user?.role === 'ADMIN' || (user?.role === 'INSTRUCTOR' && courseData?.instructorId === user.userId)) {
      return 'COURSE_DETAIL.ACCESS_COURSE'; // "Access Course"
    }

    if (this.isAlreadyEnrolled()) {
      return 'COURSE_DETAIL.RESUME_COURSE'; // "Resume Course"
    }

    return 'COURSE_DETAIL.ENROLL_NOW'; // "Enroll Now"
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

  isDescriptionExpanded = signal<boolean>(false);

  toggleDescription(): void {
    this.isDescriptionExpanded.set(!this.isDescriptionExpanded());
  }

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

        // Check enrollment ONLY if user is logged in, not Admin, and not the course Owner
        const user = this.currentUser();
        if (this.isAuthenticated() && user?.role !== 'ADMIN' && !(user?.role === 'INSTRUCTOR' && data.instructorId === user.userId)) {
          this.checkEnrollmentStatus(id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error fetching course:', error);
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
        console.error("Enrollment check error", err);
        this.isLoading.set(false);
      }
    });
  }

  handleEnrollAction(): void {
    const courseData = this.course();
    if (!courseData) return;

    // 1. Redirect to login if not authenticated
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const user = this.currentUser();

    // 2. Admin has absolute access
    if (user?.role === 'ADMIN') {
      this.router.navigate(['/player', courseData.id]);
      return;
    }

    // 3. Strict rule for Instructors
    if (user?.role === 'INSTRUCTOR') {
      if (courseData.instructorId === user.userId) {
        this.router.navigate(['/player', courseData.id]);
      } else {
        alert("As an instructor, you cannot enroll in courses created by other instructors.");
      }
      return;
    }

    // 4. Student already owns the course
    if (this.isAlreadyEnrolled()) {
      this.router.navigate(['/player', courseData.id]);
      return;
    }

    // 5. Student not enrolled -> Redirect to payment
    this.isProcessingPayment.set(true);

    this.paymentService.createCheckoutSession(courseData.id).subscribe({
      next: (response: any) => {
        const stripeCheckoutUrl = response.url || response.checkoutUrl || response;
        window.location.href = stripeCheckoutUrl;
      },
      error: (err) => {
        console.error("Stripe session creation error", err);
        alert("Unable to process payment. Please try again later.");
        this.isProcessingPayment.set(false);
      }
    });
  }

  handleLessonClick(lesson: any): void {
    const courseData = this.course();
    if (!courseData) return;

    // If lesson is free preview OR user has full access, open player
    if (lesson.freePreview || this.hasFullAccess()) {
      this.router.navigate(['/player', courseData.id]);
    } else {
      // If locked, redirect to enrollment logic (scrolls to buy button or alerts)
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