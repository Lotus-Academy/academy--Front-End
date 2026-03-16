import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download } from 'lucide-angular';

import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-student-quiz',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule],
  templateUrl: './student-quiz.component.html'
})
export class StudentQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private translate = inject(TranslateService);

  readonly icons = { ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download };

  courseId = signal<string>('');
  quiz = signal<any | null>(null);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Stockage des réponses : { "questionId": "optionId" }
  selectedAnswers = signal<Record<string, string>>({});

  // Gestion du résultat après soumission
  quizResult = signal<{ score: number; passed: boolean } | null>(null);

  isDownloading = signal<boolean>(false);

  ngOnInit(): void {
    // Le paramètre "id" (courseId) peut être dans la route courante ou parente selon votre configuration
    const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadQuiz(id);
    }
  }

  private loadQuiz(id: string): void {
    this.isLoading.set(true);
    this.quizService.getQuiz(id).subscribe({
      next: (data) => {
        this.quiz.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du quiz', err);
        this.isLoading.set(false);
        this.router.navigate(['/player', id]);
      }
    });
  }

  selectOption(questionId: string, optionId: string): void {
    if (this.quizResult()) return; // Verrouiller la sélection si le quiz est déjà soumis

    this.selectedAnswers.update(answers => ({
      ...answers,
      [questionId]: optionId
    }));
    this.errorMessage.set(''); // Effacer l'erreur éventuelle
  }

  isOptionSelected(questionId: string, optionId: string): boolean {
    return this.selectedAnswers()[questionId] === optionId;
  }

  submitAnswers(): void {
    const currentQuiz = this.quiz();
    if (!currentQuiz) return;

    const answersKeys = Object.keys(this.selectedAnswers());

    // Vérification stricte : Toutes les questions doivent avoir une réponse
    if (answersKeys.length !== currentQuiz.questions.length) {
      this.errorMessage.set(this.translate.instant('STUDENT_QUIZ.ERROR_MISSING'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Formatage du DTO selon le Swagger (QuizSubmissionDTO)
    const payload = {
      answers: answersKeys.map(qId => ({
        questionId: qId,
        selectedOptionId: this.selectedAnswers()[qId]
      }))
    };

    this.quizService.submitQuiz(this.courseId(), payload).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        // On suppose que le backend renvoie un objet avec { score: number, passed: boolean }
        console.log("RÉPONSE DU BACKEND :", result);
        this.quizResult.set({ score: result.score, passed: result.passed });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
        this.errorMessage.set(this.translate.instant('STUDENT_QUIZ.ERROR_GENERIC'));
      }
    });
  }

  retryQuiz(): void {
    this.selectedAnswers.set({});
    this.quizResult.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  downloadCertificate(): void {
    this.isDownloading.set(true);
    this.quizService.downloadCertificate(this.courseId()).subscribe({
      next: (blob: Blob) => {
        // Logique native pour forcer le téléchargement d'un fichier Blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificat_${this.courseId()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.isDownloading.set(false);
      },
      error: (err) => {
        console.error('Erreur téléchargement certificat', err);
        this.isDownloading.set(false);
      }
    });
  }
}