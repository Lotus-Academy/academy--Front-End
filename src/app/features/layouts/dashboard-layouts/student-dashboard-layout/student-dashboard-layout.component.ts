import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';
import { STUDENT_SIDEBAR_LINKS } from './student-sidebar.config';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="LAYOUT.STUDENT_BADGE"
      badgeClasses="bg-slate-100 text-slate-700 border-slate-200 dark:bg-ds-surface dark:text-ds-muted dark:border-ds-border"
      profileLink="/user/profile"
      profileRoleText="LAYOUT.STUDENT_ROLE">
      
      <ng-content></ng-content>
      
    </app-shared-layout>
  `
})
export class StudentLayoutComponent {
  @Input({ required: true }) title!: string;

  navLinks = STUDENT_SIDEBAR_LINKS;
}