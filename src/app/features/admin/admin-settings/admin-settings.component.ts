import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule, Settings, Percent, Users, Save,
  AlertTriangle, CheckCircle, Info, Loader2, ShieldCheck, Award
} from 'lucide-angular';
import { AdminSettingsService, PlatformSettings } from '../../../core/services/admin-settings.service';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, AdminLayoutComponent],
  templateUrl: './admin-settings.component.html'
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(AdminSettingsService);
  private fb = inject(FormBuilder);

  readonly icons = {
    Settings, Percent, Users, Save, AlertTriangle, CheckCircle, Info, Loader2, ShieldCheck, Award
  };

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  lastUpdatedAt = signal<string | null>(null);

  // Toast Notification State
  globalMessage = signal<{ type: 'error' | 'success' | 'info', text: string } | null>(null);

  settingsForm: FormGroup = this.fb.group({
    defaultInstructorRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    premiumInstructorRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    eliteInstructorRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    premiumReferralThreshold: [0, [Validators.required, Validators.min(1)]],
    eliteReferralThreshold: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  private showMessage(type: 'error' | 'success' | 'info', text: string) {
    this.globalMessage.set({ type, text });
    setTimeout(() => this.globalMessage.set(null), 4000);
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getPlatformSettings().subscribe({
      next: (data) => {
        this.settingsForm.patchValue({
          defaultInstructorRate: data.defaultInstructorRate,
          premiumInstructorRate: data.premiumInstructorRate,
          eliteInstructorRate: data.eliteInstructorRate,
          premiumReferralThreshold: data.premiumReferralThreshold,
          eliteReferralThreshold: data.eliteReferralThreshold
        });
        if (data.lastUpdatedAt) {
          this.lastUpdatedAt.set(data.lastUpdatedAt);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading settings', err);
        this.showMessage('error', 'Failed to load platform settings. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.showMessage('error', 'Please correct the highlighted fields before saving.');
      return;
    }

    this.isSaving.set(true);
    const updatedSettings: PlatformSettings = this.settingsForm.value;

    this.settingsService.updatePlatformSettings(updatedSettings).subscribe({
      next: (data) => {
        this.isSaving.set(false);
        this.showMessage('success', 'Platform settings successfully updated.');
        if (data.lastUpdatedAt) {
          this.lastUpdatedAt.set(data.lastUpdatedAt);
        }
        this.settingsForm.markAsPristine();
      },
      error: (err) => {
        console.error('Error saving settings', err);
        this.isSaving.set(false);
        this.showMessage('error', 'An error occurred while saving settings.');
      }
    });
  }

  // Helper for validation styling
  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}