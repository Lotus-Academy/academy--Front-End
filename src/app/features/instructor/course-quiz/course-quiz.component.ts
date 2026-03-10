import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, Plus, Trash2, CheckCircle, Save, Loader2 } from 'lucide-angular';

import { CourseService } from '../../../core/services/course-service';
import { QuizService } from '../../../core/services/quiz.service';
import { QuizRequestDto, QuestionDto, OptionDto } from '../../../core/models/quiz.dto';

@Component({
  selector: 'app-course-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule],
  templateUrl: './course-quiz.component.html'
})
export class CourseQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private quizService = inject(QuizService);
  private translate = inject(TranslateService);

  readonly icons = { Plus, Trash2, CheckCircle, Save, Loader2 };

  courseId = signal<string>('');
  isSaving = signal<boolean>(false);
  isLoading = signal<boolean>(true);

  quizTitle = signal<string>('Quiz final de validation');
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
        console.error('Aucun quiz trouvé ou erreur', err);
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
    this.isSaving.set(true);

    const payload: QuizRequestDto = {
      title: this.quizTitle(),
      passingScore: this.passingScore(),
      courseId: this.courseId(),
      questions: this.questions()
    };

    this.courseService.createQuiz(this.courseId(), payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert(this.translate.instant('COURSE_EDITOR.QUIZ.ALERT_SUCCESS'));
      },
      error: (err) => {
        console.error(err);
        this.isSaving.set(false);
        alert(this.translate.instant('COURSE_EDITOR.QUIZ.ALERT_ERROR'));
      }
    });
  }
}