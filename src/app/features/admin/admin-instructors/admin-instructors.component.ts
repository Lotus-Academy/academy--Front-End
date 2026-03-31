import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Filter,
  X,
  Mail,
  Calendar,
  Eye
} from 'lucide-angular';

import { AdminService, AdminInstructorDTO } from '../../../core/services/admin.service';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TranslateModule, AdminLayoutComponent],
  templateUrl: './admin-instructors.component.html'
})
export class AdminInstructorsComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { UserCheck, Search, CheckCircle, XCircle, Loader2, AlertTriangle, Filter, X, Mail, Calendar, Eye };

  // État Global
  isLoading = signal<boolean>(true);
  allInstructors = signal<AdminInstructorDTO[]>([]);

  // État des Filtres
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');

  // Statuts d'approbation possibles selon l'API
  readonly statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  // Filtrage dynamique côté client
  filteredInstructors = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    return this.allInstructors().filter(instructor => {
      const fullName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(query) ||
        instructor.email.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || instructor.approvalStatus === status;

      return matchesSearch && matchesStatus;
    });
  });

  // État des Modales
  selectedInstructor = signal<AdminInstructorDTO | null>(null);
  isApproveModalOpen = signal<boolean>(false);
  isRejectModalOpen = signal<boolean>(false);
  isProcessing = signal<boolean>(false);
  actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading.set(true);
    // On charge une large page pour la vue d'ensemble admin
    this.adminService.getAllInstructors(0, 200).subscribe({
      next: (response) => {
        this.allInstructors.set(response.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading instructors:', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('ALL');
  }

  // --- WORKFLOW D'APPROBATION ---

  openApproveModal(instructor: AdminInstructorDTO): void {
    this.selectedInstructor.set(instructor);
    this.actionError.set(null);
    this.isApproveModalOpen.set(true);
  }

  confirmApprove(): void {
    const instructor = this.selectedInstructor();
    if (!instructor) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.approveInstructor(instructor.profileId).subscribe({
      next: () => {
        this.allInstructors.update(instructors =>
          instructors.map(i => i.profileId === instructor.profileId ? { ...i, approvalStatus: 'APPROVED' } : i)
        );
        this.isProcessing.set(false);
        this.closeModals();
      },
      error: (err) => {
        console.error('Error approving instructor:', err);
        this.actionError.set('ADMIN_INSTRUCTORS.ERROR_APPROVE');
        this.isProcessing.set(false);
      }
    });
  }

  // --- WORKFLOW DE REJET ---

  openRejectModal(instructor: AdminInstructorDTO): void {
    this.selectedInstructor.set(instructor);
    this.actionError.set(null);
    this.isRejectModalOpen.set(true);
  }

  confirmReject(): void {
    const instructor = this.selectedInstructor();
    if (!instructor) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.rejectInstructor(instructor.profileId).subscribe({
      next: () => {
        this.allInstructors.update(instructors =>
          instructors.map(i => i.profileId === instructor.profileId ? { ...i, approvalStatus: 'REJECTED' } : i)
        );
        this.isProcessing.set(false);
        this.closeModals();
      },
      error: (err) => {
        console.error('Error rejecting instructor:', err);
        this.actionError.set('ADMIN_INSTRUCTORS.ERROR_REJECT');
        this.isProcessing.set(false);
      }
    });
  }

  closeModals(): void {
    this.isApproveModalOpen.set(false);
    this.isRejectModalOpen.set(false);
    this.selectedInstructor.set(null);
  }
}