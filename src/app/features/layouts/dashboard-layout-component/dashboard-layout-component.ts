import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, Video, FolderOpen, BarChart3, LogOut, UserCheck, Play, Heart, Settings, Menu, X } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme-service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './dashboard-layout-component.html'
})
export class DashboardLayoutComponent {
  @Input() title: string = '';
  @Input() user: any = null;

  public themeService = inject(ThemeService);
  isSidebarOpen = false;

  readonly icons = { LayoutDashboard, Users, Video, FolderOpen, BarChart3, LogOut, UserCheck, Play, Heart, Settings, Menu, X };

  // Liens fictifs basés sur votre version React
  get menuLinks() {
    if (this.user?.role === 'ADMIN') {
      return [
        { path: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
        { path: '/dashboard/users', label: 'Users', icon: 'Users' },
        { path: '/dashboard/instructors', label: 'Instructors', icon: 'UserCheck' },
        { path: '/dashboard/videos', label: 'Videos', icon: 'Video' },
        { path: '/dashboard/categories', label: 'Categories', icon: 'FolderOpen' }
      ];
    }
    return [
      { path: '/dashboard', label: 'Home', icon: 'LayoutDashboard' },
      { path: '/dashboard/browse', label: 'Browse', icon: 'Play' },
      { path: '/dashboard/favorites', label: 'Favorites', icon: 'Heart' },
      { path: '/dashboard/settings', label: 'Settings', icon: 'Settings' }
    ];
  }
}