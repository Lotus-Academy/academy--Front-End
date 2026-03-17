import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule, Users, Search, BarChart3, Loader2, BookOpen, Clock, CheckCircle
} from 'lucide-angular';

import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { InstructorLayoutComponent } from '../../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component';

@Component({
  selector: 'app-instructor-students',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule, InstructorLayoutComponent],
  templateUrl: './instructor-students.component.html'
})
export class InstructorStudentsComponent implements OnInit {
  private courseService = inject(CourseService);

  readonly icons = { Users, Search, BarChart3, Loader2, BookOpen, Clock, CheckCircle };

  isLoadingCourses = signal<boolean>(true);
  isLoadingStudents = signal<boolean>(false);

  // Seuls les cours approuvés seront affichés dans le menu déroulant
  approvedCourses = signal<CourseResponseDTO[]>([]);
  selectedCourseId = signal<string>('');

  courseStudents = signal<any[]>([]);
  searchQuery = signal<string>('');

  // Filtrage des étudiants en temps réel côté client
  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.courseStudents();

    return this.courseStudents().filter(student =>
      (student.studentName && student.studentName.toLowerCase().includes(query)) ||
      (student.studentEmail && student.studentEmail.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.fetchCourses();
  }

  fetchCourses(): void {
    this.isLoadingCourses.set(true);
    this.courseService.getInstructorCourses().subscribe({
      next: (courses) => {
        const approved = courses.filter(c => c.status === 'APPROVED');
        this.approvedCourses.set(approved);
        this.isLoadingCourses.set(false);
      },
      error: (err) => {
        console.error('Error fetching courses', err);
        this.isLoadingCourses.set(false);
      }
    });
  }

  onCourseSelect(courseId: string): void {
    this.selectedCourseId.set(courseId);
    this.searchQuery.set(''); // Réinitialiser la recherche au changement de cours

    if (courseId) {
      this.fetchStudents(courseId);
    } else {
      this.courseStudents.set([]);
    }
  }

  fetchStudents(courseId: string): void {
    this.isLoadingStudents.set(true);
    this.courseService.getCourseStudents(courseId).subscribe({
      next: (res) => {
        const content = res.content || [];
        const formattedStudents = content.map((student: any) => ({
          ...student,
          progress: student.progress ? Math.round(student.progress) : 0
        }));
        this.courseStudents.set(formattedStudents);
        this.isLoadingStudents.set(false);
      },
      error: (err) => {
        console.error('Error fetching students', err);
        this.isLoadingStudents.set(false);
      }
    });
  }
}