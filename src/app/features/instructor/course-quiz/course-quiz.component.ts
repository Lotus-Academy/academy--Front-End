import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Plus, Trash2, CheckCircle, Save } from 'lucide-angular';
import { CourseService } from '../../../core/services/course-service';
import { QuizService } from '../../../core/services/quiz.service';

// Import correct des DTOs officiels
import { QuizRequestDto, QuestionDto, OptionDto } from '../../../core/models/quiz.dto';

@Component({
  selector: 'app-course-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './course-quiz.component.html'
})
export class CourseQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private quizService = inject(QuizService);

  readonly icons = { Plus, Trash2, CheckCircle, Save };

  courseId = signal<string>('');
  isSaving = signal<boolean>(false);

  // Modèles de données réactifs strictement typés
  quizTitle = signal<string>('Quiz final de validation');
  passingScore = signal<number>(70);

  // courseQuizes stocke UN SEUL objet QuizRequestDto (ou null initialement), pas un tableau
  courseQuizes = signal<QuizRequestDto | null>(null);

  // questions utilise le DTO
  questions = signal<QuestionDto[]>([]);

  ngOnInit(): void {
    // 1. On s'abonne aux changements de l'URL de manière réactive
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId.set(id);
        this.loadQuizData(id); // 2. On lance la récupération UNIQUEMENT quand on a l'ID
      }
    });
  }

  // Logique isolée dans une méthode
  private loadQuizData(courseId: string): void {
    this.quizService.getCourseQuiz(courseId).subscribe({
      // On s'attend à recevoir un seul objet QuizRequestDto (pas un tableau)
      next: (data: QuizRequestDto) => {
        this.courseQuizes.set(data);

        // 3a. Si un quiz existe ET qu'il contient des questions, on les mappe
        if (data && data.questions && data.questions.length > 0) {
          const mappedQuestions: QuestionDto[] = data.questions.map((q) => ({
            text: q.text,
            options: q.options.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }));
          this.questions.set(mappedQuestions);

          // Restaurer le titre et le score si le backend les renvoie
          if (data.title) this.quizTitle.set(data.title);
          if (data.passingScore) this.passingScore.set(data.passingScore);

        } else {
          // 3b. Si le quiz existe mais est vide, on initialise une question par défaut
          this.questions.set([]); // On s'assure que c'est vide
          this.addQuestion();
        }
      },
      error: (err) => {
        console.error('Aucun quiz trouvé ou erreur lors de la récupération :', err);
        // 3c. S'il n'y a pas encore de quiz en base de données (ex: 404 Not Found)
        // on initialise l'interface avec une question par défaut pour commencer la création
        this.questions.set([]);
        this.addQuestion();
      }
    });
  }

  // --- MANIPULATION DU DOM ---

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
      // On met toutes les options à false
      newQ[qIndex].options.forEach(opt => opt.isCorrect = false);
      // On coche la bonne
      newQ[qIndex].options[oIndex].isCorrect = true;
      return newQ;
    });
  }

  // --- SOUMISSION API ---

  saveQuiz() {
    if (!this.courseId()) return;
    this.isSaving.set(true);

    // Le payload correspond exactement à l'interface QuizRequestDto
    const payload: QuizRequestDto = {
      title: this.quizTitle(),
      passingScore: this.passingScore(),
      courseId: this.courseId(),
      questions: this.questions()
    };

    this.courseService.createQuiz(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        alert('Quiz enregistré avec succès !');
      },
      error: (err) => {
        console.error(err);
        this.isSaving.set(false);
        alert('Erreur lors de la sauvegarde du quiz.');
      }
    });
  }
}