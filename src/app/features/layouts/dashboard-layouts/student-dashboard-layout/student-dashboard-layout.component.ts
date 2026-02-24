import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Play,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,         // Pour les notifications
  Globe,        // Pour la langue
  Sun,          // Pour le mode clair
  Moon,         // Pour le mode sombre
  ChevronDown   // Pour les menus déroulants
} from 'lucide-angular';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme-service'; // Assurez-vous du chemin

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './student-dashboard-layout.component.html'
})
export class StudentLayoutComponent {
  @Input({ required: true }) title!: string;

  private authService = inject(AuthService);
  public themeService = inject(ThemeService); // Rendu public pour le HTML
  private router = inject(Router);

  readonly icons = { Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown };

  isSidebarOpen = signal<boolean>(false);
  user = computed(() => this.authService.getUser());

  // Simulation du nombre de notifications non lues
  unreadNotifications = signal<number>(3);

  navLinks = [
    { href: '/dashboard', label: 'Mon Apprentissage', icon: Home },
    { href: '/courses', label: 'Catalogue', icon: Play },
    { href: '/dashboard/following', label: 'Mes Favoris', icon: Heart },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings }
  ];

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  handleSignOut() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}