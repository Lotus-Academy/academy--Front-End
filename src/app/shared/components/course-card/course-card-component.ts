import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Star, Clock, Users, BookOpen } from 'lucide-angular';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CurrencyPipe, TranslateModule],
  templateUrl: './course-card-component.html'
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CourseResponseDTO;
  @Input() index: number = 0;

  readonly icons = { Star, Clock, Users, BookOpen };

  getLevelClasses(level: string): string {
    const base = 'px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest font-bold border backdrop-blur-sm ';
    switch (level?.toLowerCase()) {
      case 'beginner':
        return base + 'bg-green/10 text-green border-green/20';
      case 'intermediate':
        return base + 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-500';
      case 'advanced':
        return base + 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-500';
      default:
        return base + 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-ds-border/50 dark:text-ds-muted dark:border-ds-border';
    }
  }

  getLevelTranslationKey(level: string): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'COURSE_CARD.LEVEL_BEGINNER';
      case 'intermediate': return 'COURSE_CARD.LEVEL_INTERMEDIATE';
      case 'advanced': return 'COURSE_CARD.LEVEL_ADVANCED';
      default: return 'COURSE_CARD.LEVEL_ALL_LEVELS';
    }
  }
}