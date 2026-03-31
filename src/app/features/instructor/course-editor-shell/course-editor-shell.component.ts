import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Settings,
  BookOpen,
  Image as ImageIcon,
  Tag,
  CheckSquare,
  ArrowLeft,
  Loader2
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-course-editor-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, TranslateModule],
  templateUrl: './course-editor-shell.component.html'
})
export class CourseEditorShellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);

  readonly icons = { Settings, BookOpen, ImageIcon, Tag, CheckSquare, ArrowLeft, Loader2 };

  courseId = signal<string>('');
  courseTitle = signal<string>('Chargement...');
  courseStatus = signal<string>('');

  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    // Récupération de l'ID depuis la route parente
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.fetchCourseMinimalInfo(id);
    }
  }

  fetchCourseMinimalInfo(id: string): void {
    this.courseService.getCourseById(id).subscribe({
      next: (data: CourseResponseDTO) => {
        this.courseTitle.set(data.title);
        this.courseStatus.set(data.status);
      },
      error: (err) => console.error('Error while getting course informations', err)
    });
  }

  // Nouvelle méthode pour gérer la soumission directement depuis le menu latéral
  submitForReview(): void {
    if (confirm("Do you want to confirm the course submission ?")) {
      this.isSubmitting.set(true);
      this.courseService.submitForReview(this.courseId()).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/instructor/courses']);
        },
        error: (err) => {
          console.error('Erreur lors de la soumission', err);
          this.isSubmitting.set(false);
          alert('An error occured while submitting the course. Make sure you have completed every section and lesson, and that you have filled in all the required information.');
        }
      });
    }
  }
}