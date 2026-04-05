import { Component, inject, signal, computed, OnInit } from '@angular/core'; // <-- AJOUT de OnInit
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle } from 'lucide-angular'; // <-- AJOUT de AlertTriangle
import { InstructorProfileService, InstructorOnboardingRequestDTO, InstructorProfileResponseDTO } from '../../../core/services/instructor-profile.service';
import { NavbarComponent } from "../../layouts/navbar-component/navbar.component";

@Component({
  selector: 'app-instructor-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslateModule, NavbarComponent],
  templateUrl: './onboarding.component.html' // Assurez-vous que le nom du fichier matche
})
export class InstructorOnboardingComponent implements OnInit { // <-- Implémente OnInit
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorProfileService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  readonly icons = { User, BookOpen, Globe, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertTriangle };

  // NOUVEAUX ÉTATS
  isPageLoading = signal<boolean>(true); // Loader global au démarrage
  isEditMode = signal<boolean>(false);   // Vaut true si l'admin a rejeté le dossier

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

  // ==========================================
  // NOUVELLE MÉTHODE : Vérification au démarrage
  // ==========================================
  ngOnInit(): void {
    this.instructorService.getMyProfile().subscribe({
      next: (profile: InstructorProfileResponseDTO) => {
        // Si le profil est en cours d'examen ou déjà validé, on l'éjecte d'ici.
        if (profile.approvalStatus === 'APPROVED' || profile.approvalStatus === 'PENDING') {
          this.router.navigate(['/dashboard']);
          return;
        }

        // Si le profil est rejeté, on passe en mode édition et on pré-remplit !
        if (profile.approvalStatus === 'REJECTED') {
          this.isEditMode.set(true);
          this.prefillForm(profile);
        }

        this.isPageLoading.set(false);
      },
      error: (err) => {
        // Erreur 404 (Not Found) => Pas encore de profil ! C'est un nouvel utilisateur.
        // On enlève le loader et on le laisse remplir le formulaire vide.
        this.isPageLoading.set(false);
      }
    });
  }

  // ==========================================
  // NOUVELLE MÉTHODE : Pré-remplissage
  // ==========================================
  private prefillForm(profile: InstructorProfileResponseDTO): void {
    this.onboardingForm.patchValue({
      step1: {
        headline: profile.headline,
        bio: profile.bio
      },
      step2: {
        // Les tableaux string[] de Spring Boot doivent être convertis en texte (virgules) pour l'UI
        expertiseDomainsStr: profile.expertiseDomains?.join(', '),
        yearsOfExperience: profile.yearsOfExperience,
        teachingLanguagesStr: profile.teachingLanguages?.join(', ')
      },
      step3: {
        linkedinUrl: profile.linkedinUrl,
        websiteUrl: profile.websiteUrl,
        githubUrl: profile.githubUrl
      },
      step4: {
        legalName: profile.legalName,
        phoneNumber: profile.phoneNumber,
        billingAddress: profile.billingAddress,
        taxId: profile.taxId
      },
      step5: {
        availableForMentoring: profile.availableForMentoring,
        termsAccepted: false // On l'oblige à re-cocher les CGU par sécurité
      }
    });
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

    // ==========================================
    // MODIFICATION DE LA SOUMISSION
    // ==========================================
    // Si isEditMode est vrai -> On appelle updateProfile (PUT)
    // Sinon -> On appelle submitOnboarding (POST)
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
        this.errorMessage.set(err.error?.message || err.error || this.translate.instant('ONBOARDING.ERRORS.GENERIC'));
      }
    });
  }
}