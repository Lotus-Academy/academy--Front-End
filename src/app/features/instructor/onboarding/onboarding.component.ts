import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2 } from 'lucide-angular';
import { InstructorProfileService, InstructorOnboardingRequestDTO } from '../../../core/services/instructor-profile.service';

@Component({
  selector: 'app-instructor-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './onboarding.component.html'
})
export class InstructorOnboardingComponent {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorProfileService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly icons = { User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2 };

  currentStep = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Utilisation de clés de traduction pour les titres des étapes
  steps = [
    { num: 1, titleKey: 'ONBOARDING.STEPS.PUBLIC_PROFILE', icon: this.icons.User, formGroupName: 'step1' },
    { num: 2, titleKey: 'ONBOARDING.STEPS.EXPERTISE', icon: this.icons.BookOpen, formGroupName: 'step2' },
    { num: 3, titleKey: 'ONBOARDING.STEPS.ONLINE_PRESENCE', icon: this.icons.Globe, formGroupName: 'step3' },
    { num: 4, titleKey: 'ONBOARDING.STEPS.LEGAL_FINANCE', icon: this.icons.FileText, formGroupName: 'step4' },
    { num: 5, titleKey: 'ONBOARDING.STEPS.VALIDATION', icon: this.icons.CheckCircle, formGroupName: 'step5' }
  ];

  onboardingForm: FormGroup = this.fb.group({
    step1: this.fb.group({
      headline: ['', [Validators.required, Validators.maxLength(100)]],
      bio: ['', [Validators.required, Validators.minLength(50)]]
    }),
    step2: this.fb.group({
      expertiseDomainsStr: ['', [Validators.required]],
      yearsOfExperience: [0, [Validators.required, Validators.min(0)]],
      teachingLanguagesStr: ['', [Validators.required]]
    }),
    step3: this.fb.group({
      linkedinUrl: ['', [Validators.required, Validators.pattern('^(https?://)?(www\\.)?linkedin\\.com/.*$')]],
      websiteUrl: [''],
      githubUrl: ['']
    }),
    step4: this.fb.group({
      legalName: ['', [Validators.required, Validators.maxLength(150)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]],
      billingAddress: ['', [Validators.required, Validators.maxLength(500)]],
      taxId: ['']
    }),
    step5: this.fb.group({
      availableForMentoring: [false],
      termsAccepted: [false, Validators.requiredTrue]
    })
  });

  progressPercentage = computed(() => ((this.currentStep() - 1) / (this.steps.length - 1)) * 100);

  nextStep(): void {
    const currentGroup = this.onboardingForm.get(`step${this.currentStep()}`);
    if (currentGroup && currentGroup.valid) {
      this.currentStep.update(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      currentGroup?.markAllAsTouched();
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  submit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValues = this.onboardingForm.value;

    const expertiseArray = formValues.step2.expertiseDomainsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    const languagesArray = formValues.step2.teachingLanguagesStr.split(',').map((s: string) => s.trim()).filter(Boolean);

    const requestDTO: InstructorOnboardingRequestDTO = {
      ...formValues.step1,
      expertiseDomains: expertiseArray,
      yearsOfExperience: formValues.step2.yearsOfExperience,
      teachingLanguages: languagesArray,
      ...formValues.step3,
      ...formValues.step4,
      ...formValues.step5
    };

    this.instructorService.submitOnboarding(requestDTO).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || err.error || this.translate.instant('ONBOARDING.ERRORS.GENERIC'));
      }
    });
  }
}