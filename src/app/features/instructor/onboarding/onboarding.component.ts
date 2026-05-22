import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle, ExternalLink, X, Download } from 'lucide-angular';
import { InstructorProfileService, InstructorOnboardingRequestDTO, InstructorProfileResponseDTO } from '../../../core/services/instructor-profile.service';
import { InstructorTermsService, InstructorTermsResponse } from '../../../core/services/instructor-terms.service';
import { NavbarComponent } from "../../layouts/navbar-component/navbar.component";
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';
import html2pdf from 'html2pdf.js';


@Component({
  selector: 'app-instructor-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, NavbarComponent, LivePreviewDirective],
  templateUrl: './onboarding.component.html'
})
export class InstructorOnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorProfileService);
  private termsService = inject(InstructorTermsService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Ajout de X et Download pour le modal
  readonly icons = { User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle, ExternalLink, X, Download };

  isPageLoading = signal<boolean>(true);
  isEditMode = signal<boolean>(false);

  // État des Termes Légaux
  activeTermsVersion = signal<string>('v1.0');
  activeTermsContent = signal<string>('');
  showTermsModal = signal<boolean>(false); // Contrôle du modal
  isDownloadingPdf = signal<boolean>(false);

  currentStep = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // ... (Garder steps, expertiseOptions, languageOptions, phonePrefixes) ...
  steps = [
    { num: 1, titleKey: 'ONBOARDING.STEPS.PUBLIC_PROFILE', icon: this.icons.User, formGroupName: 'step1' },
    { num: 2, titleKey: 'ONBOARDING.STEPS.EXPERTISE', icon: this.icons.BookOpen, formGroupName: 'step2' },
    { num: 3, titleKey: 'ONBOARDING.STEPS.ONLINE_PRESENCE', icon: this.icons.Globe, formGroupName: 'step3' },
    { num: 4, titleKey: 'ONBOARDING.STEPS.LEGAL_FINANCE', icon: this.icons.FileText, formGroupName: 'step4' },
    { num: 5, titleKey: 'ONBOARDING.STEPS.VALIDATION', icon: this.icons.CheckCircle, formGroupName: 'step5' }
  ];

  expertiseOptions = [
    'Algorithmic Trading', 'Risk Management', 'Machine Learning',
    'Quantitative Analysis', 'Forex', 'Crypto Trading', 'Portfolio Strategy',
    'Financial Modeling', 'Data Science', 'Python Programming'
  ];

  languageOptions = [
    'English', 'Français', 'Spanish', 'Arabic', 'German', 'Mandarin'
  ];

  phonePrefixes = [
    { code: '+212', label: 'MA (+212)' },
    { code: '+1', label: 'US/CA (+1)' },
    { code: '+33', label: 'FR (+33)' },
    { code: '+44', label: 'UK (+44)' },
    { code: '+971', label: 'AE (+971)' },
    { code: '+966', label: 'SA (+966)' },
    { code: '+49', label: 'DE (+49)' },
    { code: '+34', label: 'ES (+34)' },
    { code: '+91', label: 'IN (+91)' }
  ];


  onboardingForm: FormGroup = this.fb.group({
    // ... (Garder la configuration des étapes 1 à 4) ...
    step1: this.fb.group({
      headline: ['', [Validators.required, Validators.maxLength(100)]],
      bio: ['', [Validators.required, Validators.minLength(50)]]
    }),
    step2: this.fb.group({
      expertise: [[], [Validators.required, Validators.minLength(1)]],
      yearsOfExperience: [null, [Validators.required, Validators.min(0)]],
      languages: [[], [Validators.required, Validators.minLength(1)]]
    }),
    step3: this.fb.group({
      linkedinUrl: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?(www\\.)?linkedin\\.com\\/.*$')]],
      websiteUrl: [''],
      githubUrl: ['']
    }),
    step4: this.fb.group({
      legalName: ['', [Validators.required, Validators.maxLength(150)]],
      phonePrefix: ['+212', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{6,14}$')]],
      billingAddress: ['', [Validators.required, Validators.maxLength(500)]],
      taxId: ['']
    }),
    step5: this.fb.group({
      availableForMentoring: [false],
      termsAccepted: [false, Validators.requiredTrue],
      contentOwnershipConfirmed: [false, Validators.requiredTrue],
      distributionRightsGranted: [false, Validators.requiredTrue],
      revenueShareUnderstood: [false, Validators.requiredTrue],
      complianceAgreed: [false, Validators.requiredTrue]
    })
  });

  progressPercentage = computed(() => ((this.currentStep() - 1) / (this.steps.length - 1)) * 100);

  ngOnInit(): void {
    // Récupérer le contenu complet des termes pour le modal
    this.termsService.getActiveTerms().subscribe({
      next: (terms: InstructorTermsResponse) => {
        if (terms && terms.version) {
          this.activeTermsVersion.set(terms.version);
          this.activeTermsContent.set(terms.content);
        }
      }
    });

    this.instructorService.getMyProfile().subscribe({
      next: (profile: InstructorProfileResponseDTO) => {
        if (profile.approvalStatus === 'APPROVED' || profile.approvalStatus === 'PENDING') {
          this.router.navigate(['/dashboard']);
          return;
        }

        if (profile.approvalStatus === 'REJECTED') {
          this.isEditMode.set(true);
          this.prefillForm(profile);
        }
        this.isPageLoading.set(false);
      },
      error: () => {
        this.isPageLoading.set(false);
      }
    });
  }

  // ... (Garder prefillForm, toggleSelection, isFieldInvalid, nextStep, prevStep) ...
  private prefillForm(profile: InstructorProfileResponseDTO): void {
    let prefix = '+212';
    let phoneNum = profile.phoneNumber || '';

    if (phoneNum.startsWith('+')) {
      const match = this.phonePrefixes.find(p => phoneNum.startsWith(p.code));
      if (match) {
        prefix = match.code;
        phoneNum = phoneNum.substring(match.code.length).trim();
      }
    }

    this.onboardingForm.patchValue({
      step1: { headline: profile.headline, bio: profile.bio },
      step2: {
        expertise: profile.expertiseDomains || [],
        yearsOfExperience: profile.yearsOfExperience,
        languages: profile.teachingLanguages || []
      },
      step3: {
        linkedinUrl: profile.linkedinUrl,
        websiteUrl: profile.websiteUrl,
        githubUrl: profile.githubUrl
      },
      step4: {
        legalName: profile.legalName,
        phonePrefix: prefix,
        phoneNumber: phoneNum,
        billingAddress: profile.billingAddress,
        taxId: profile.taxId
      },
      step5: {
        availableForMentoring: profile.availableForMentoring,
        termsAccepted: false,
        contentOwnershipConfirmed: false,
        distributionRightsGranted: false,
        revenueShareUnderstood: false,
        complianceAgreed: false
      }
    });
  }

  toggleSelection(controlName: 'expertise' | 'languages', value: string): void {
    const control = this.onboardingForm.get(`step2.${controlName}`);
    if (!control) return;

    const currentValues: string[] = control.value || [];
    const index = currentValues.indexOf(value);

    if (index === -1) {
      control.setValue([...currentValues, value]);
    } else {
      control.setValue(currentValues.filter(v => v !== value));
    }
    control.markAsTouched();
  }

  isFieldInvalid(step: string, field: string): boolean {
    const control = this.onboardingForm.get(`${step}.${field}`);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

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

  // --- Gestion du Modal et Téléchargement ---

  toggleTermsModal(): void {
    this.showTermsModal.update(v => !v);
    if (this.showTermsModal()) {
      document.body.style.overflow = 'hidden'; // Empêche le défilement du fond
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  downloadTermsAsPdf(): void {
    this.isDownloadingPdf.set(true);
    const element = document.getElementById('legal-terms-content');

    if (!element) {
      this.isDownloadingPdf.set(false);
      return;
    }

    const opt = {
      margin: 10,
      filename: `Lotus-Academy-Instructor-Terms-${this.activeTermsVersion()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save().then(() => {
      this.isDownloadingPdf.set(false);
    });
  }

  // ... (Garder submit) ...
  submit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValues = this.onboardingForm.value;
    const fullPhoneNumber = `${formValues.step4.phonePrefix}${formValues.step4.phoneNumber}`;

    const requestDTO: InstructorOnboardingRequestDTO = {
      ...formValues.step1,
      expertiseDomains: formValues.step2.expertise,
      yearsOfExperience: formValues.step2.yearsOfExperience,
      teachingLanguages: formValues.step2.languages,
      ...formValues.step3,
      legalName: formValues.step4.legalName,
      phoneNumber: fullPhoneNumber,
      billingAddress: formValues.step4.billingAddress,
      taxId: formValues.step4.taxId,
      availableForMentoring: formValues.step5.availableForMentoring,

      termsAccepted: formValues.step5.termsAccepted,
      contentOwnershipConfirmed: formValues.step5.contentOwnershipConfirmed,
      distributionRightsGranted: formValues.step5.distributionRightsGranted,
      revenueShareUnderstood: formValues.step5.revenueShareUnderstood,
      complianceAgreed: formValues.step5.complianceAgreed,
      termsVersion: this.activeTermsVersion()
    };

    const request$ = this.isEditMode()
      ? this.instructorService.updateProfile(requestDTO)
      : this.instructorService.submitOnboarding(requestDTO);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/instructor/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || err.error || "An error occurred during submission.");
      }
    });
  }
}