import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Calendar, PenTool, CheckCircle, Loader2, AlertTriangle, Save, ChevronLeft, Server } from 'lucide-angular';

import { LiveSessionService } from '../../../core/services/live-session.service';
import { CourseService } from '../../../core/services/course.service';
import { CategoryDTO } from '../../../core/models/course.dto';
import { InstructorLayoutComponent } from "../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component";

@Component({
  selector: 'app-live-session-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, RouterLink, InstructorLayoutComponent],
  templateUrl: './live-session-create.component.html'
})
export class LiveSessionCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private liveSessionService = inject(LiveSessionService);
  private courseService = inject(CourseService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly icons = { Calendar, PenTool, CheckCircle, Loader2, AlertTriangle, Save, ChevronLeft, Server };

  categories = signal<CategoryDTO[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Mis à jour : Plus de champ YouTube
  sessionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required]],
    courseId: ['', [Validators.required]], // CHANGEMENT : Le Swagger indique courseId, pas categoryId
    scheduledAt: ['', [Validators.required]],
    toolType: ['NONE', [Validators.required]],
    autoTraderEnabled: [{ value: false, disabled: true }]
  });

  // Pour le MVP, on doit récupérer les cours de l'instructeur au lieu des catégories générales
  // Car le Swagger DTO spécifie "courseId"
  courses = signal<any[]>([]);

  ngOnInit(): void {
    this.loadMyCourses();

    this.sessionForm.get('toolType')?.valueChanges.subscribe(val => {
      const autoTraderControl = this.sessionForm.get('autoTraderEnabled');
      if (val === 'TRADING_TERMINAL') {
        autoTraderControl?.enable();
      } else {
        autoTraderControl?.setValue(false);
        autoTraderControl?.disable();
      }
    });
  }

  loadMyCourses(): void {
    // Récupérer les cours de l'instructeur pour le menu déroulant
    this.courseService.getInstructorCourses().subscribe({
      next: (data: any) => { // Ajuster selon le retour de getInstructorCourses
        // Si getInstructorCourses renvoie une pagination (PageCourseResponseDTO) :
        this.courses.set(data.content || data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading courses', err);
        this.errorMessage.set('Could not load your courses.');
        this.isLoading.set(false);
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.sessionForm.get(field);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    const scheduledDate = new Date(this.sessionForm.value.scheduledAt);
    if (scheduledDate <= new Date()) {
      this.errorMessage.set('The scheduled date and time must be in the future.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload = this.sessionForm.getRawValue();
    payload.scheduledAt = scheduledDate.toISOString();

    this.liveSessionService.scheduleSession(payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Live session successfully scheduled! Stream keys generated.');
        setTimeout(() => {
          this.router.navigate(['/instructor/live-sessions']);
        }, 2500);
      },
      error: (err) => {
        console.error('Scheduling error', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to schedule the session. Please try again.');
      }
    });
  }
}