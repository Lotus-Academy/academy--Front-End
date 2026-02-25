import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, BookOpen, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService } from '../../../core/services/admin.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminLayoutComponent],
  templateUrl: './admin-courses.component.html'
})
export class AdminCoursesComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Search, BookOpen, Eye, CheckCircle, XCircle, Loader2 };

  isLoading = signal<boolean>(true);
  processingActionIds = signal<Set<string>>(new Set());
  courses = signal<CourseResponseDTO[]>([]);
  searchQuery = signal<string>('');

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.courses().filter(c =>
      c.title.toLowerCase().includes(query) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.adminService.getAllCourses(0, 50).subscribe({
      next: (res) => {
        this.courses.set(res.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  isProcessing(id: string): boolean {
    return this.processingActionIds().has(id);
  }

  setProcessing(id: string, isProcessing: boolean): void {
    this.processingActionIds.update(set => {
      const newSet = new Set(set);
      isProcessing ? newSet.add(id) : newSet.delete(id);
      return newSet;
    });
  }

  approveCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.approveCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'APPROVED' } : c));
        this.setProcessing(courseId, false);
      },
      error: () => this.setProcessing(courseId, false)
    });
  }

  rejectCourse(courseId: string): void {
    this.setProcessing(courseId, true);
    this.adminService.rejectCourse(courseId).subscribe({
      next: () => {
        this.courses.update(courses => courses.map(c => c.id === courseId ? { ...c, status: 'REJECTED' } : c));
        this.setProcessing(courseId, false);
      },
      error: () => this.setProcessing(courseId, false)
    });
  }
}