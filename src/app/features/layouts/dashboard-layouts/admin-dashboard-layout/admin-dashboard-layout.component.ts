import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';
import { ADMIN_SIDEBAR_LINKS } from './admin-sidebar.config';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="LAYOUT.ADMIN_BADGE"
      badgeClasses="bg-green/10 text-green border-green/20 dark:bg-green/10 dark:text-green dark:border-green/30"
      profileLink="/admin/profile"
      profileRoleText="LAYOUT.ADMIN_ROLE">
      
      <ng-content></ng-content>
      
    </app-shared-layout>
  `
})
export class AdminLayoutComponent {
  @Input({ required: true }) title!: string;

  navLinks = ADMIN_SIDEBAR_LINKS;
}