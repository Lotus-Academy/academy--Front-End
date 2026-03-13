import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, User, Shield, Camera, AlertTriangle, Save, CheckCircle, Loader2 } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { UserService } from '../../../core/services/user-service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly icons = { User, Shield, Camera, AlertTriangle, Save, CheckCircle, Loader2 };

  activeTab = signal<'GENERAL' | 'SECURITY'>('GENERAL');

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  profileForm: FormGroup;
  passwordForm: FormGroup;

  selectedFile: File | null = null;
  photoPreview = signal<string | null>(null);

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      headline: ['', [Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getMyProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          headline: profile.headline || '',
          bio: profile.bio || ''
        });

        if (profile.profilePictureUrl) {
          this.photoPreview.set(profile.profilePictureUrl);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du chargement du profil.');
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'GENERAL' | 'SECURITY'): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    this.userService.updateProfile(this.profileForm.value, this.selectedFile || undefined).subscribe({
      next: (updatedProfile) => {
        this.isSaving.set(false);
        this.successMessage.set(this.translate.instant('PROFILE.SUCCESS_PROFILE'));

        // UTILISATION DE LA NOUVELLE MÉTHODE DU AUTH SERVICE
        this.authService.updateCurrentUserState({
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          profilePictureUrl: updatedProfile.profilePictureUrl
        });
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set(this.translate.instant('PROFILE.ERROR_GENERIC'));
      }
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.passwordForm.reset();
        this.successMessage.set(this.translate.instant('PROFILE.SUCCESS_PASSWORD'));
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || this.translate.instant('PROFILE.ERROR_GENERIC'));
      }
    });
  }

  archiveAccount(): void {
    if (confirm("Êtes-vous certain de vouloir archiver votre compte ? Cette action est définitive.")) {
      this.userService.archiveAccount().subscribe({
        next: () => {
          this.authService.logout();
        },
        error: () => {
          this.errorMessage.set(this.translate.instant('PROFILE.ERROR_GENERIC'));
        }
      });
    }
  }
}