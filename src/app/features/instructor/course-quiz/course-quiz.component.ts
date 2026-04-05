import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Plus, Trash2, CheckCircle, Save, Loader2, AlertTriangle, Eye } from 'lucide-angular';

import { QuizService } from '../../../core/services/quiz.service';
import { QuizRequestDto, QuestionDto, OptionDto } from '../../../core/models/quiz.dto';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';

@Component({
  selector: 'app-course-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule, LivePreviewDirective],
  templateUrl: './course-quiz.component.html'
})
export class CourseQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);
  private translate = inject(TranslateService);

  readonly icons = { Plus, Trash2, CheckCircle, Save, Loader2, AlertTriangle, Eye };

  courseId = signal<string>('');
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  isEditMode = signal<boolean>(false);

  saveSuccessMessage = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Translated default title
  quizTitle = signal<string>('Final Validation Quiz');
  passingScore = signal<number>(70);
  courseQuizes = signal<QuizRequestDto | null>(null);
  questions = signal<QuestionDto[]>([]);

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadQuizData(id);
      }
    });
  }

  private loadQuizData(courseId: string): void {
    this.isLoading.set(true);
    this.quizService.getCourseQuiz(courseId).subscribe({
      next: (data: QuizRequestDto) => {
        this.courseQuizes.set(data);
        this.isEditMode.set(true);

        if (data && data.questions && data.questions.length > 0) {
          const mappedQuestions: QuestionDto[] = data.questions.map((q) => ({
            text: q.text,
            options: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }));
          this.questions.set(mappedQuestions);

          if (data.title) this.quizTitle.set(data.title);
          if (data.passingScore) this.passingScore.set(data.passingScore);
        } else {
          this.questions.set([]);
          this.addQuestion();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        // Translated console log
        console.warn('No existing quiz found. Switching to creation mode.');
        this.isEditMode.set(false);
        this.questions.set([]);
        this.addQuestion();
        this.isLoading.set(false);
      }
    });
  }

  addQuestion() {
    this.questions.update(q => [...q, {
      text: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false }
      ]
    }]);
  }

  removeQuestion(qIndex: number) {
    this.questions.update(q => q.filter((_, i) => i !== qIndex));
  }

  addOption(qIndex: number) {
    this.questions.update(q => {
      const newQ = [...q];
      newQ[qIndex].options.push({ text: '', isCorrect: false });
      return newQ;
    });
  }

  removeOption(qIndex: number, oIndex: number) {
    this.questions.update(q => {
      const newQ = [...q];
      newQ[qIndex].options = newQ[qIndex].options.filter((_, i) => i !== oIndex);
      return newQ;
    });
  }

  setCorrectOption(qIndex: number, oIndex: number) {
    this.questions.update(q => {
      const newQ = [...q];
      newQ[qIndex].options.forEach(opt => opt.isCorrect = false);
      newQ[qIndex].options[oIndex].isCorrect = true;
      return newQ;
    });
  }

  saveQuiz() {
    if (!this.courseId()) return;

    if (this.questions().length === 0 || !this.questions()[0].text.trim()) {
      // Translated error message
      this.errorMessage.set('Please add at least one valid question.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    this.isSaving.set(true);
    this.saveSuccessMessage.set(false);
    this.errorMessage.set('');

    const payload: QuizRequestDto = {
      title: this.quizTitle(),
      passingScore: this.passingScore(),
      courseId: this.courseId(),
      questions: this.questions()
    };

    const request$ = this.isEditMode()
      ? this.quizService.updateQuiz(this.courseId(), payload)
      : this.quizService.createQuiz(this.courseId(), payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditMode.set(true);
        this.saveSuccessMessage.set(true);
        setTimeout(() => this.saveSuccessMessage.set(false), 3000);
      },
      error: (err) => {
        console.error(err);
        this.isSaving.set(false);
        this.errorMessage.set(this.translate.instant('COURSE_EDITOR.QUIZ.ALERT_ERROR'));
        setTimeout(() => this.errorMessage.set(''), 4000);
      }
    });
  }
}