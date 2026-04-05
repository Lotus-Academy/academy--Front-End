import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download, ShieldAlert } from 'lucide-angular';

import { QuizService } from '../../../core/services/quiz.service';
import { AuthService } from '../../../core/services/auth.service';

// IMPORT THE DIRECTIVE
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';

@Component({
  selector: 'app-student-quiz',
  standalone: true,
  // ADD THE DIRECTIVE TO IMPORTS
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, LivePreviewDirective],
  templateUrl: './student-quiz.component.html'
})
export class StudentQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  readonly icons = { ChevronLeft, CheckCircle, XCircle, Award, Loader2, AlertTriangle, Download, ShieldAlert };

  courseId = signal<string>('');
  quiz = signal<any | null>(null);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  selectedAnswers = signal<Record<string, string>>({});
  quizResult = signal<{ score: number; passed: boolean } | null>(null);
  isDownloading = signal<boolean>(false);

  // Roles and permissions
  currentUser = computed(() => this.authService.getUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  ngOnInit(): void {
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
        console.error('Error loading quiz', err); // TRANSLATED
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
    if (this.isAdmin()) return; // Extra client-side security

    const currentQuiz = this.quiz();
    if (!currentQuiz) return;

    const answersKeys = Object.keys(this.selectedAnswers());

    if (answersKeys.length !== currentQuiz.questions.length) {
      this.errorMessage.set(this.translate.instant('STUDENT_QUIZ.ERROR_MISSING'));
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
    if (this.isAdmin()) return;

    this.isDownloading.set(true);
    this.quizService.downloadCertificate(this.courseId()).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate_${this.courseId()}.pdf`; // TRANSLATED
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.isDownloading.set(false);
      },
      error: (err) => {
        console.error('Error downloading certificate', err); // TRANSLATED
        this.isDownloading.set(false);
      }
    });
  }
}