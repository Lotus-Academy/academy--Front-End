import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from "@ngx-translate/core";

import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { InstructorDashboardComponent } from './instructor-dashboard/instructor-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { StudentLayoutComponent } from '../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component';
import { InstructorLayoutComponent } from '../layouts/dashboard-layouts/instructor-dashboard-layout/instructor-dashboard-layout.component';
import { AdminLayoutComponent } from '../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    StudentDashboardComponent,
    InstructorDashboardComponent,
    AdminDashboardComponent,
    StudentLayoutComponent,
    InstructorLayoutComponent,
    AdminLayoutComponent
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