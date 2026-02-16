import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Import du Layout et des Dashboards
import { DashboardLayoutComponent } from '../layouts/dashboard-layout-component/dashboard-layout-component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { InstructorDashboardComponent } from './instructor-dashboard/instructor-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardLayoutComponent, // Ajout crucial ici
    StudentDashboardComponent,
    InstructorDashboardComponent,
    AdminDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.getUser();

  // Titre dynamique pour le layout
  get dashboardTitle(): string {
    if (this.user?.role === 'ADMIN') return 'Administration';
    if (this.user?.role === 'INSTRUCTOR') return 'Espace Instructeur';
    return 'Mon Apprentissage';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}