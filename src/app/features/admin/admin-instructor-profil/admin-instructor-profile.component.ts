import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  FileText,
  AlertTriangle
} from 'lucide-angular';

import { AdminService, AdminUserDetailsDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-instructor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-instructor-profile.component.html'
})
export class AdminInstructorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);

  readonly icons = { ArrowLeft, CheckCircle, XCircle, Loader2, Mail, Phone, MapPin, Briefcase, Globe, Github, Linkedin, FileText, AlertTriangle };

  userId = signal<string | null>(null);
  user = signal<AdminUserDetailsDTO | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  isProcessing = signal<boolean>(false);
  actionError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadUserProfile(id);
    } else {
      this.error.set('ADMIN_INSTRUCTOR_PROFILE.ERROR_NO_ID');
      this.isLoading.set(false);
    }
  }

  loadUserProfile(id: string): void {
    this.isLoading.set(true);
    this.adminService.getUserDetails(id).subscribe({
      next: (data) => {
        this.user.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching user details:', err);
        this.error.set('ADMIN_INSTRUCTOR_PROFILE.ERROR_FETCHING');
        this.isLoading.set(false);
      }
    });
  }

  approveProfile(): void {
    const currentUser = this.user();
    // On vérifie que l'objet imbriqué instructorProfile existe bien
    if (!currentUser || !currentUser.instructorProfile?.profileId) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.approveInstructor(currentUser.instructorProfile.profileId).subscribe({
      next: () => {
        // Mise à jour de l'état réactif dans l'objet imbriqué
        this.user.update(u => {
          if (u && u.instructorProfile) {
            return { ...u, instructorProfile: { ...u.instructorProfile, approvalStatus: 'APPROVED' } };
          }
          return u;
        });
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error approving instructor:', err);
        this.actionError.set('ADMIN_INSTRUCTOR_PROFILE.ERROR_APPROVE');
        this.isProcessing.set(false);
      }
    });
  }

  rejectProfile(): void {
    const currentUser = this.user();
    if (!currentUser || !currentUser.instructorProfile?.profileId) return;

    this.isProcessing.set(true);
    this.actionError.set(null);

    this.adminService.rejectInstructor(currentUser.instructorProfile.profileId).subscribe({
      next: () => {
        this.user.update(u => {
          if (u && u.instructorProfile) {
            return { ...u, instructorProfile: { ...u.instructorProfile, approvalStatus: 'REJECTED' } };
          }
          return u;
        });
        this.isProcessing.set(false);
      },
      error: (err) => {
        console.error('Error rejecting instructor:', err);
        this.actionError.set('ADMIN_INSTRUCTOR_PROFILE.ERROR_REJECT');
        this.isProcessing.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/instructors']);
  }
}