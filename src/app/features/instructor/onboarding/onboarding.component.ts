import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle } from 'lucide-angular';
import { InstructorProfileService, InstructorOnboardingRequestDTO, InstructorProfileResponseDTO } from '../../../core/services/instructor-profile.service';
import { NavbarComponent } from "../../layouts/navbar-component/navbar.component";

@Component({
  selector: 'app-instructor-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, NavbarComponent],
  templateUrl: './onboarding.component.html'
})
export class InstructorOnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorProfileService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly icons = { User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle };

  isPageLoading = signal<boolean>(true);
  isEditMode = signal<boolean>(false);

  currentStep = signal<number>(1);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

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

  // Liste des indicatifs téléphoniques (Focus MENA / Europe / US)
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
      // LinkedIn Regex stricte mais flexible
      linkedinUrl: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?(www\\.)?linkedin\\.com\\/.*$')]],
      websiteUrl: [''],
      githubUrl: ['']
    }),
    step4: this.fb.group({
      legalName: ['', [Validators.required, Validators.maxLength(150)]],
      phonePrefix: ['+212', [Validators.required]], // Indicatif par défaut
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{6,14}$')]], // Numéro local seul
      billingAddress: ['', [Validators.required, Validators.maxLength(500)]],
      taxId: ['']
    }),
    step5: this.fb.group({
      availableForMentoring: [false],
      termsAccepted: [false, Validators.requiredTrue]
    })
  });

  progressPercentage = computed(() => ((this.currentStep() - 1) / (this.steps.length - 1)) * 100);

  ngOnInit(): void {
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

  private prefillForm(profile: InstructorProfileResponseDTO): void {
    // Extraction de l'indicatif si le numéro commence par '+'
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
        phonePrefix: prefix, // Champ sélecteur
        phoneNumber: phoneNum, // Champ input texte
        billingAddress: profile.billingAddress,
        taxId: profile.taxId
      },
      step5: {
        availableForMentoring: profile.availableForMentoring,
        termsAccepted: false
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

  submit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValues = this.onboardingForm.value;

    // Fusion du préfixe et du numéro pour le backend
    const fullPhoneNumber = `${formValues.step4.phonePrefix}${formValues.step4.phoneNumber}`;

    const requestDTO: InstructorOnboardingRequestDTO = {
      ...formValues.step1,
      expertiseDomains: formValues.step2.expertise,
      yearsOfExperience: formValues.step2.yearsOfExperience,
      teachingLanguages: formValues.step2.languages,
      ...formValues.step3,
      legalName: formValues.step4.legalName,
      phoneNumber: fullPhoneNumber, // Numéro fusionné envoyé à l'API
      billingAddress: formValues.step4.billingAddress,
      taxId: formValues.step4.taxId,
      ...formValues.step5
    };

    const request$ = this.isEditMode()
      ? this.instructorService.updateProfile(requestDTO)
      : this.instructorService.submitOnboarding(requestDTO);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || err.error || "An error occurred during submission.");
      }
    });
  }
}