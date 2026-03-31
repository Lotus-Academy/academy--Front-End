import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertTriangle,
  Filter,
  X
} from 'lucide-angular';

import { AdminService } from '../../../core/services/admin.service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslateModule, AdminLayoutComponent, RouterLink],
  templateUrl: './admin-courses.component.html'
})
export class AdminCoursesComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { BookOpen, Search, CheckCircle, XCircle, Eye, Loader2, AlertTriangle, Filter, X };

  // Global State
  isLoading = signal<boolean>(true);
  allCourses = signal<CourseResponseDTO[]>([]);

  // Filters State
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');

  // Allowed statuses based on the API
  readonly statuses = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DRAFT'];

  // Computed value for filtered results
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    return this.allCourses().filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(query) ||
        (course.instructorName && course.instructorName.toLowerCase().includes(query)) ||
        (course.categoryName && course.categoryName.toLowerCase().includes(query));

      const matchesStatus = status === 'ALL' || course.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  // Modal State
  selectedCourse = signal<CourseResponseDTO | null>(null);
  isApproveModalOpen = signal<boolean>(false);
  isRejectModalOpen = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading.set(true);
    // Fetching a large page for admin overview
    this.adminService.getAllCourses(0, 200).subscribe({
      next: (response) => {
        this.allCourses.set(response.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
  }

  // --- APPROVAL WORKFLOW ---

  openApproveModal(course: CourseResponseDTO): void {
    this.selectedCourse.set(course);
    this.actionError.set(null);
    this.isApproveModalOpen.set(true);
  }

  confirmApprove(): void {
    const course = this.selectedCourse();
    if (!course) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.approveCourse(course.id).subscribe({
      next: () => {
        this.allCourses.update(courses =>
          courses.map(c => c.id === course.id ? { ...c, status: 'APPROVED' } : c)
        );
        this.isProcessing.set(false);
        this.closeModals();
      },
      error: (err) => {
        console.error('Error approving course:', err);
        this.actionError.set('ADMIN_COURSES.ERROR_APPROVE');
        this.isProcessing.set(false);
      }
    });
  }

  // --- REJECTION WORKFLOW ---

  openRejectModal(course: CourseResponseDTO): void {
    this.selectedCourse.set(course);
    this.actionError.set(null);
    this.isRejectModalOpen.set(true);
  }

  confirmReject(): void {
    const course = this.selectedCourse();
    if (!course) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.rejectCourse(course.id).subscribe({
      next: () => {
        this.allCourses.update(courses =>
          courses.map(c => c.id === course.id ? { ...c, status: 'REJECTED' } : c)
        );
        this.isProcessing.set(false);
        this.closeModals();
      },
      error: (err) => {
        console.error('Error rejecting course:', err);
        this.actionError.set('ADMIN_COURSES.ERROR_REJECT');
        this.isProcessing.set(false);
      }
    });
  }

  closeModals(): void {
    this.isApproveModalOpen.set(false);
    this.isRejectModalOpen.set(false);
    this.selectedCourse.set(null);
  }
}