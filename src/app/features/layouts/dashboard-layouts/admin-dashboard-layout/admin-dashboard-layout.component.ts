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
  ChevronDown,   // Pour les menus déroulants
  LayoutDashboard,
  Upload,
  BarChart3,
  Users,
  UserCheck,
  Video,
  FolderOpen
} from 'lucide-angular';

import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme-service'; // Assurez-vous du chemin

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-dashboard-layout.component.html'
})
export class AdminLayoutComponent {
  @Input({ required: true }) title!: string;


  //iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
  private authService = inject(AuthService);
  public themeService = inject(ThemeService); // Rendu public pour le HTML
  private router = inject(Router);

  readonly icons = { Menu, X, LogOut, Bell, Globe, Sun, Moon, ChevronDown };

  isSidebarOpen = signal<boolean>(false);
  user = computed(() => this.authService.getUser());

  // Simulation du nombre de notifications non lues
  unreadNotifications = signal<number>(3);

  navLinks = [
    { href: '/dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: Users },
    { href: '/dashboard/instructors', label: 'Instructeurs', icon: UserCheck },
    { href: '/dashboard/videos', label: 'Cours', icon: Video },
    { href: '/dashboard/categories', label: 'Catégories', icon: FolderOpen },
    { href: '/dashboard/analytics', label: 'Analytiques', icon: BarChart3 }
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