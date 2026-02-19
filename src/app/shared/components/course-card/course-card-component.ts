import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Star, Clock, Users } from 'lucide-angular';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CurrencyPipe],
  templateUrl: './course-card-component.html'
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CourseResponseDTO;
  @Input() index: number = 0;

  readonly icons = { Star, Clock, Users };

  // Données fictives en attendant leur ajout dans le backend
  mockRating = 4.8;
  mockStudents = 1250;
  mockDuration = '4h 30m';

  getLevelClasses(level: string): string {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ';
    switch (level?.toLowerCase()) {
      case 'beginner':
        return base + 'bg-green-100/90 text-green-700 border-green-200 dark:bg-green-900/60 dark:text-green-400 dark:border-green-800';
      case 'intermediate':
        return base + 'bg-yellow-100/90 text-yellow-700 border-yellow-200 dark:bg-yellow-900/60 dark:text-yellow-400 dark:border-yellow-800';
      case 'advanced':
        return base + 'bg-red-100/90 text-red-700 border-red-200 dark:bg-red-900/60 dark:text-red-400 dark:border-red-800';
      default:
        return base + 'bg-slate-100/90 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-300 dark:border-slate-700';
    }
  }
}