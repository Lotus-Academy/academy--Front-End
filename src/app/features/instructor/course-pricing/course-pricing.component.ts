import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Image as ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';

@Component({
  selector: 'app-course-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './course-pricing.component.html'
})
export class CoursePricingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  readonly icons = { ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film };

  courseId = signal<string>('');
  currentCourse = signal<any>(null); // Stocke le cours complet
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isUploadingThumbnail = signal<boolean>(false);
  isUploadingTrailer = signal<boolean>(false);

  pricingForm: FormGroup = this.fb.group({
    price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadCourse(id);
      }
    });
  }

  loadCourse(id: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.currentCourse.set(course);
        this.pricingForm.patchValue({ price: course.price });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  onThumbnailSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.courseId()) {
      this.isUploadingThumbnail.set(true);
      this.courseService.uploadCourseThumbnail(this.courseId(), file).subscribe({
        next: (updatedCourse) => {
          this.currentCourse.set(updatedCourse);
          this.isUploadingThumbnail.set(false);
        },
        error: () => this.isUploadingThumbnail.set(false)
      });
    }
  }

  onTrailerSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.courseId()) {
      this.isUploadingTrailer.set(true);
      this.courseService.uploadCourseTrailer(this.courseId(), file).subscribe({
        next: (updatedCourse) => {
          this.currentCourse.set(updatedCourse);
          this.isUploadingTrailer.set(false);
        },
        error: () => this.isUploadingTrailer.set(false)
      });
    }
  }

  onSave(): void {
    if (this.pricingForm.invalid) return;
    this.isSaving.set(true);

    // Votre backend demande un CourseCreateDTO entier pour le PUT.
    // On fusionne les anciennes données avec le nouveau prix.
    const updatedData = {
      ...this.currentCourse(),
      price: this.pricingForm.value.price
    };

    this.courseService.updateCourse(this.courseId(), updatedData).subscribe({
      next: () => this.isSaving.set(false),
      error: () => this.isSaving.set(false)
    });
  }
}