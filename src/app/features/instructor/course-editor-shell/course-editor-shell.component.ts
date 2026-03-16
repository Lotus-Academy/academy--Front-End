import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Settings,
  BookOpen,
  Image as ImageIcon,
  Tag,
  CheckSquare,
  ArrowLeft
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
  private courseService = inject(CourseService);

  readonly icons = { Settings, BookOpen, ImageIcon, Tag, CheckSquare, ArrowLeft };

  courseId = signal<string>('');
  courseTitle = signal<string>('Chargement...');
  courseStatus = signal<string>('');

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
      error: (err) => console.error('Erreur lors de la récupération des infos du cours', err)
    });
  }
}