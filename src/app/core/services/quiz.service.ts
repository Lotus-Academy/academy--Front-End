import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { QuizRequestDto } from '../models/quiz.dto';


@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;


  getCourseQuiz(courseId: string) {
    return this.http.get<QuizRequestDto>(`${this.apiUrl}/courses/${courseId}/quiz/edit`);
  }
}
