import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download, ShieldAlert, CheckCheck } from 'lucide-angular';

import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';
import { CertificateService } from '../../../core/services/certificate.service';

import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';
import { CertificateDTO } from '../../../core/models/certificate.dto';

@Component({
  selector: 'app-student-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, LivePreviewDirective],
  templateUrl: './student-quiz.component.html'
})
export class StudentQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private certificateService = inject(CertificateService); // <-- AJOUT

  readonly icons = { ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download, ShieldAlert, CheckCheck };

  courseId = signal<string>('');
  quiz = signal<any | null>(null);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  selectedAnswers = signal<Record<string, string>>({});
  quizResult = signal<{ score: number; passed: boolean } | null>(null);
  
  // --- NOUVEAUX SIGNAUX POUR LE CERTIFICAT EXISTANT ---
  alreadyCertified = signal<boolean>(false);
  existingCertificate = signal<CertificateDTO | null>(null);
  
  isDownloading = signal<boolean>(false);

  currentUser = computed(() => this.authService.getUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.checkExistingCertificateAndLoadQuiz(id);
    }
  }

  /**
   * Vérifie d'abord si l'étudiant a déjà un certificat.
   * Si oui, on bloque l'accès au quiz. Sinon, on charge le quiz normalement.
   */
  private checkExistingCertificateAndLoadQuiz(id: string): void {
    this.isLoading.set(true);

    // Ne pas vérifier les certificats si on est Admin (Mode lecture seule)
    if (this.isAdmin()) {
        this.loadQuiz(id);
        return;
    }

    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        // Cherche s'il existe un certificat pour ce cours exact
        const cert = certificates.find(c => c.courseId === id);
        
        if (cert) {
            this.alreadyCertified.set(true);
            this.existingCertificate.set(cert);
            this.isLoading.set(false); // On ne charge même pas le quiz
        } else {
            // L'étudiant n'a pas le certificat, on charge le quiz
            this.loadQuiz(id);
        }
      },
      error: (err) => {
        console.error('Error checking certificates', err);
        // En cas d'erreur de vérification, on tente quand même de charger le quiz par sécurité
        this.loadQuiz(id);
      }
    });
  }

  private loadQuiz(id: string): void {
    this.quizService.getQuiz(id).subscribe({
      next: (data) => {
        this.quiz.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading quiz', err);
        this.isLoading.set(false);
        this.router.navigate(['/player', id]);
      }
    });
  }

  selectOption(questionId: string, optionId: string): void {
    if (this.quizResult() || this.isAdmin()) return;

    this.selectedAnswers.update(answers => ({
      ...answers,
      [questionId]: optionId
    }));
    this.errorMessage.set('');
  }

  isOptionSelected(questionId: string, optionId: string): boolean {
    return this.selectedAnswers()[questionId] === optionId;
  }

  submitAnswers(): void {
    if (this.isAdmin()) return; 

    const currentQuiz = this.quiz();
    if (!currentQuiz) return;

    const answersKeys = Object.keys(this.selectedAnswers());

    if (answersKeys.length !== currentQuiz.questions.length) {
      this.errorMessage.set('Please answer all questions before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload = {
      answers: answersKeys.map(qId => ({
        questionId: qId,
        selectedOptionId: this.selectedAnswers()[qId]
      }))
    };

    this.quizService.submitQuiz(this.courseId(), payload).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.quizResult.set({ score: result.score, passed: result.passed });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
        this.errorMessage.set('An error occurred while submitting the quiz. Please try again.');
      }
    });
  }

  retryQuiz(): void {
    this.selectedAnswers.set({});
    this.quizResult.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Télécharge le certificat. S'il s'agit d'un certificat existant détecté au chargement,
   * on utilise l'ID de ce certificat. Sinon (nouveau succès), on laisse le backend générer/trouver via le courseId.
   */
  downloadCertificate(): void {
    if (this.isAdmin()) return;

    this.isDownloading.set(true);

    // Si on télécharge un certificat pré-existant
    if (this.alreadyCertified() && this.existingCertificate()) {
        this.certificateService.downloadCertificate(this.existingCertificate()!.id).subscribe({
            next: this.handleDownloadSuccess.bind(this),
            error: this.handleDownloadError.bind(this)
        });
    } 
    // Si on vient juste de réussir le quiz (ancien comportement)
    else {
        this.quizService.downloadCertificate(this.courseId()).subscribe({
            next: this.handleDownloadSuccess.bind(this),
            error: this.handleDownloadError.bind(this)
        });
    }
  }

  private handleDownloadSuccess(blob: Blob): void {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lotus_Academy_Certificate_${this.courseId()}.pdf`; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.isDownloading.set(false);
  }

  private handleDownloadError(err: any): void {
      console.error('Error downloading certificate', err);
      this.isDownloading.set(false);
      alert('An error occurred while downloading your certificate.');
  }
}