import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorTermsService, InstructorTermsResponse } from '../../../core/services/instructor-terms.service';
import { InstructorOnboardingRequestDTO, InstructorProfileService } from '../../../core/services/instructor-profile.service';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';
import { LucideAngularModule, CheckCircle2, Loader2, AlertCircle } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-instructor-terms-acceptance',
  standalone: true,
  imports: [CommonModule, FormsModule, LivePreviewDirective, LucideAngularModule],
  templateUrl: './instructor-terms-acceptance.component.html'
})
export class InstructorTermsAcceptanceComponent implements OnInit {
  private termsService = inject(InstructorTermsService);
  private profileService = inject(InstructorProfileService);
  private router = inject(Router);

  activeTerms = signal<InstructorTermsResponse | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  // État des cases à cocher
  accepted = {
    terms: false,
    ownership: false,
    distribution: false,
    revenue: false,
    compliance: false
  };

  readonly icons = { CheckCircle2, Loader2, AlertCircle };

  ngOnInit(): void {
    this.termsService.getActiveTerms().subscribe({
      next: (data) => {
        this.activeTerms.set(data);
        this.isLoading.set(false);
      }
    });
  }

  isFormValid(): boolean {
    return Object.values(this.accepted).every(val => val === true);
  }

  confirmAcceptance(): void {
    if (!this.isFormValid() || !this.activeTerms()) return;

    this.isSubmitting.set(true);

    this.profileService.getMyProfile().subscribe(profile => {
      const payload: InstructorOnboardingRequestDTO = {
        headline: profile.headline,
        bio: profile.bio,
        profilePictureUrl: profile.profilePictureUrl,
        expertiseDomains: profile.expertiseDomains?.length > 0 ? profile.expertiseDomains : ['General'],
        yearsOfExperience: profile.yearsOfExperience,
        teachingLanguages: profile.teachingLanguages?.length > 0 ? profile.teachingLanguages : ['English'],
        linkedinUrl: profile.linkedinUrl,
        websiteUrl: profile.websiteUrl,
        githubUrl: profile.githubUrl,
        legalName: profile.legalName,
        phoneNumber: profile.phoneNumber,
        billingAddress: profile.billingAddress || 'N/A',
        taxId: profile.taxId || '',
        availableForMentoring: profile.availableForMentoring || false,

        termsAccepted: true,
        contentOwnershipConfirmed: true,
        distributionRightsGranted: true,
        revenueShareUnderstood: true,
        complianceAgreed: true,
        termsVersion: this.activeTerms()!.version
      };

      this.profileService.updateProfile(payload).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Erreur API:', err.error);
        }
      });
    });
  }
}