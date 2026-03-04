import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home, Play, Heart, Settings } from 'lucide-angular';
import { SharedLayoutComponent } from '../../../../shared/components/shared-layout/shared-layout.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, SharedLayoutComponent],
  template: `
    <app-shared-layout 
      [title]="title"
      [navLinks]="navLinks"
      badgeText="Espace Étudiant"
      badgeClasses="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
      profileLink="/student/profile"
      profileRoleText="Étudiant">
      <ng-content></ng-content>
    </app-shared-layout>
  `
})
export class StudentLayoutComponent {
  @Input({ required: true }) title!: string;

  navLinks = [
    { href: '/dashboard', label: 'Mon Apprentissage', icon: Home },
    { href: '/courses', label: 'Catalogue', icon: Play },
    { href: '/student/favorites', label: 'Mes Favoris', icon: Heart },
    { href: '/student/profile', label: 'Paramètres', icon: Settings }
  ];
}