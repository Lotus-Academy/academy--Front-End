import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';
import { InstructorProfileService } from '../../../../core/services/instructor-profile.service';

import { INSTRUCTOR_SIDEBAR_LINKS } from './instructor-sidebar.config';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="LAYOUT.INSTRUCTOR_BADGE"
      badgeClasses="bg-lotus/10 text-lotus border-lotus/20 dark:bg-lotus/10 dark:text-lotus dark:border-lotus/30"
      profileLink="/instructor/profile"
      profileRoleText="LAYOUT.INSTRUCTOR_ROLE"
      [profileStatus]="profileStatus()">
      <ng-content></ng-content>
    </app-shared-layout>
  `
})
export class InstructorLayoutComponent implements OnInit {
  @Input({ required: true }) title!: string;
  private instructorProfileService = inject(InstructorProfileService);

  profileStatus = signal<'LOADING' | 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED'>('LOADING');

  navLinks = INSTRUCTOR_SIDEBAR_LINKS;

  ngOnInit(): void {
    this.instructorProfileService.getMyProfile().subscribe({
      next: (profile) => this.profileStatus.set(profile.approvalStatus),
      error: (err) => this.profileStatus.set(err.status === 404 ? 'MISSING' : 'MISSING')
    });
  }
}