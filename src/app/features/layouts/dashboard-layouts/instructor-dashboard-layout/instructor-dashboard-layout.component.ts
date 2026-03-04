import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutDashboard, Upload, BarChart3 } from 'lucide-angular';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';
import { InstructorProfileService } from '../../../../core/services/instructor-profile.service';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="Espace Instructeur"
      badgeClasses="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800"
      profileLink="/instructor/profile"
      profileRoleText="Instructeur"
      [profileStatus]="profileStatus()">
      <ng-content></ng-content>
    </app-shared-layout>
  `
})
export class InstructorLayoutComponent implements OnInit {
  @Input({ required: true }) title!: string;
  private instructorProfileService = inject(InstructorProfileService);

  profileStatus = signal<'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED'>('LOADING');

  navLinks = [
    { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard, requiresApproval: false },
    { href: '/instructor/courses/new', label: 'Créer un cours', icon: Upload, requiresApproval: true },
    { href: '/instructor/analytics', label: 'Analytiques', icon: BarChart3, requiresApproval: true }
  ];

  ngOnInit(): void {
    this.instructorProfileService.getMyProfile().subscribe({
      next: (profile) => this.profileStatus.set(profile.approvalStatus),
      error: (err) => this.profileStatus.set(err.status === 404 ? 'MISSING' : 'MISSING')
    });
  }
}