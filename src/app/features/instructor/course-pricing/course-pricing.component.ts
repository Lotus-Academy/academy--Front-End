import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Image as ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film, CheckCircle } from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service'; // Correction du tiret

@Component({
  selector: 'app-course-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './course-pricing.component.html'
})
export class CoursePricingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService); // Pour les messages d'erreur si besoin

  readonly icons = { ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film, CheckCircle };

  courseId = signal<string>('');
  currentCourse = signal<any>(null);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isUploadingThumbnail = signal<boolean>(false);
  isUploadingTrailer = signal<boolean>(false);

  // Feedback visuel
  saveSuccessMessage = signal<boolean>(false);

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
        console.error('Erreur de chargement', err);
        this.isLoading.set(false);
      }
    });
  }

  onThumbnailSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.courseId()) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image (JPG, PNG).');
        event.target.value = '';
        return;
      }

      this.isUploadingThumbnail.set(true);
      this.courseService.uploadCourseThumbnail(this.courseId(), file).subscribe({
        next: (updatedCourse) => {
          this.currentCourse.set(updatedCourse); // Met à jour l'image à chaud
          this.isUploadingThumbnail.set(false);
        },
        error: () => {
          alert('Échec de l\'upload de l\'image.');
          this.isUploadingThumbnail.set(false);
        }
      });
    }
  }

  onTrailerSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.courseId()) {
      if (file.type !== 'video/mp4') {
        alert('Veuillez sélectionner une vidéo au format MP4.');
        event.target.value = '';
        return;
      }

      this.isUploadingTrailer.set(true);
      this.courseService.uploadCourseTrailer(this.courseId(), file).subscribe({
        next: (updatedCourse) => {
          this.currentCourse.set(updatedCourse); // Met à jour la vidéo à chaud
          this.isUploadingTrailer.set(false);
        },
        error: () => {
          alert('Échec de l\'upload de la vidéo. Fichier potentiellement trop lourd.');
          this.isUploadingTrailer.set(false);
        }
      });
    }
  }

  onSave(): void {
    if (this.pricingForm.invalid) return;
    this.isSaving.set(true);
    this.saveSuccessMessage.set(false);

    const updatedData = {
      ...this.currentCourse(),
      price: this.pricingForm.value.price
    };

    this.courseService.updateCourse(this.courseId(), updatedData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccessMessage.set(true);
        // Efface le message de succès après 3 secondes
        setTimeout(() => this.saveSuccessMessage.set(false), 3000);
      },
      error: () => {
        alert('Erreur lors de la sauvegarde du prix.');
        this.isSaving.set(false);
      }
    });
  }
}