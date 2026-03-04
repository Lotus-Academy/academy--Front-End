import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutDashboard, Users, UserCheck, Video, FolderOpen, BarChart3, CreditCard } from 'lucide-angular';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="LAYOUT.ADMIN_SPACE"
      badgeClasses="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
      profileLink="/admin/profile"
      profileRoleText="LAYOUT.ADMIN_ROLE">
      
      <ng-content></ng-content>
      
    </app-shared-layout>
  `
})
export class AdminLayoutComponent {
  @Input({ required: true }) title!: string;

  // Remarquez l'utilisation des clés JSON ici
  navLinks = [
    { href: '/dashboard', label: 'MENU.DASHBOARD', icon: LayoutDashboard },
    { href: '/admin/users', label: 'MENU.USERS', icon: Users },
    { href: '/admin/instructors', label: 'MENU.INSTRUCTORS', icon: UserCheck },
    { href: '/admin/videos', label: 'MENU.COURSES', icon: Video },
    { href: '/admin/categories', label: 'MENU.CATEGORIES', icon: FolderOpen },
    { href: '/admin/payments', label: 'MENU.PAYMENTS', icon: CreditCard },
    { href: '/admin/analytics', label: 'MENU.ANALYTICS', icon: BarChart3 }
  ];
}