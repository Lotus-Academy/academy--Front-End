import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpEventType } from '@angular/common/http';
import { LucideAngularModule, Image as ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film, CheckCircle, AlertTriangle, X } from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { environment } from '../../../../environments/environment';

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
  private translate = inject(TranslateService);

  readonly icons = { ImageIcon, DollarSign, Save, Loader2, UploadCloud, Film, CheckCircle, AlertTriangle, X };

  courseId = signal<string>('');
  currentCourse = signal<any>(null);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isUploadingThumbnail = signal<boolean>(false);

  isUploadingTrailer = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  trailerError = signal<string | null>(null);

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
        alert('Veuillez sélectionner une image (JPG, PNG, WEBP).');
        event.target.value = '';
        return;
      }

      this.isUploadingThumbnail.set(true);
      this.courseService.uploadCourseThumbnail(this.courseId(), file).subscribe({
        next: (updatedCourse) => {
          this.currentCourse.set(updatedCourse);
          this.isUploadingThumbnail.set(false);
        },
        error: () => {
          alert('Échec de l\'upload de l\'image.');
          this.isUploadingThumbnail.set(false);
        }
      });
    }
  }

  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject('Fichier vidéo invalide');
      video.src = URL.createObjectURL(file);
    });
  }

  async onTrailerSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file || !this.courseId()) return;

    this.trailerError.set(null);

    if (file.type !== 'video/mp4') {
      this.trailerError.set('Veuillez sélectionner une vidéo au format MP4.');
      event.target.value = '';
      return;
    }

    const maxSizeMB = environment.uploadConstraints?.trailerMaxSizeMB || 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.trailerError.set(`Le fichier est trop volumineux. La taille maximale autorisée est de ${maxSizeMB} Mo.`);
      event.target.value = '';
      return;
    }

    this.isUploadingTrailer.set(true);
    this.uploadProgress.set(0);

    try {
      const duration = await this.getVideoDuration(file);
      const maxDurationSec = environment.uploadConstraints?.trailerMaxDurationSec || 180;

      if (duration > maxDurationSec) {
        this.trailerError.set(`La vidéo est trop longue. La durée maximale autorisée est de ${Math.floor(maxDurationSec / 60)} minutes.`);
        this.isUploadingTrailer.set(false);
        event.target.value = '';
        return;
      }

      this.courseService.getTrailerPresignedUrl(this.courseId(), file.name, file.type, file.size).subscribe({
        next: (response) => {
          const presignedUrl = response.presignedUrl;
          const publicUrl = response.publicUrl;

          if (!presignedUrl || !publicUrl) {
            this.trailerError.set('Le serveur n\'a pas renvoyé les URLs nécessaires.');
            this.isUploadingTrailer.set(false);
            return;
          }

          this.courseService.uploadToPresignedUrlWithProgress(presignedUrl, file, file.type).subscribe({
            next: (httpEvent) => {
              if (httpEvent.type === HttpEventType.UploadProgress && httpEvent.total) {
                const percentDone = Math.round((100 * httpEvent.loaded) / httpEvent.total);
                this.uploadProgress.set(percentDone);
              }
              else if (httpEvent.type === HttpEventType.Response) {
                this.uploadProgress.set(100);

                const confirmationPayload = {
                  fileUrl: publicUrl
                };

                this.courseService.confirmTrailerUpload(this.courseId(), confirmationPayload).subscribe({
                  next: (updatedCourse) => {
                    this.currentCourse.set(updatedCourse);
                    this.isUploadingTrailer.set(false);
                    this.uploadProgress.set(0);
                  },
                  error: (err) => {
                    console.error('Confirmation failed', err);
                    this.trailerError.set('L\'upload a réussi, mais la confirmation serveur a échoué.');
                    this.isUploadingTrailer.set(false);
                    this.uploadProgress.set(0);
                  }
                });
              }
            },
            error: (err) => {
              console.error('R2 Upload failed', err);
              this.trailerError.set('L\'envoi direct vers le serveur de stockage a échoué.');
              this.isUploadingTrailer.set(false);
              this.uploadProgress.set(0);
            }
          });

        },
        error: (err) => {
          console.error('Failed to get Presigned URL', err);
          this.trailerError.set('Impossible d\'initialiser l\'upload. Vérifiez votre connexion.');
          this.isUploadingTrailer.set(false);
          this.uploadProgress.set(0);
        }
      });
    } catch (e) {
      this.trailerError.set('Impossible de lire les métadonnées de la vidéo.');
      this.isUploadingTrailer.set(false);
      this.uploadProgress.set(0);
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
        setTimeout(() => this.saveSuccessMessage.set(false), 3000);
      },
      error: () => {
        alert('Erreur lors de la sauvegarde du prix.');
        this.isSaving.set(false);
      }
    });
  }
}