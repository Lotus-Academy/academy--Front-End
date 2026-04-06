import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Calendar, Video, PenTool, CheckCircle, Loader2, AlertTriangle, Link, Save, ChevronLeft } from 'lucide-angular';

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

  readonly icons = { Calendar, Video, PenTool, CheckCircle, Loader2, AlertTriangle, Link, Save, ChevronLeft };

  categories = signal<CategoryDTO[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Regex basic to ensure it's a YouTube URL
  private ytRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

  sessionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    scheduledAt: ['', [Validators.required]],
    youtubeUnlistedUrl: ['', [Validators.required, Validators.pattern(this.ytRegex)]],
    toolType: ['NONE', [Validators.required]],
    autoTraderEnabled: [{ value: false, disabled: true }] // Disabled by default
  });

  ngOnInit(): void {
    this.loadCategories();

    // Dynamically handle Auto-Trader based on selected tool
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

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.errorMessage.set('Could not load program categories.');
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

    // Validate that the date is in the future
    const scheduledDate = new Date(this.sessionForm.value.scheduledAt);
    if (scheduledDate <= new Date()) {
      this.errorMessage.set('The scheduled date and time must be in the future.');
      setTimeout(() => this.errorMessage.set(''), 4000);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // getRawValue gets all values including disabled ones (like autoTraderEnabled)
    const payload = this.sessionForm.getRawValue();
    payload.scheduledAt = scheduledDate.toISOString();

    this.liveSessionService.scheduleSession(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Live session successfully scheduled!');
        setTimeout(() => {
          this.router.navigate(['/instructor/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Scheduling error', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to schedule the session. Please try again.');
      }
    });
  }
}