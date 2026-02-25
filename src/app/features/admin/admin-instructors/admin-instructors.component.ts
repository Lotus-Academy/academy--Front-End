import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, UserCheck, ShieldAlert, CheckCircle, XCircle } from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService, AdminInstructorDTO } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminLayoutComponent, DatePipe],
  templateUrl: './admin-instructors.component.html'
})
export class AdminInstructorsComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Search, UserCheck, ShieldAlert, CheckCircle, XCircle };

  isLoading = signal<boolean>(true);
  instructors = signal<AdminInstructorDTO[]>([]);
  searchQuery = signal<string>('');

  filteredInstructors = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.instructors().filter(i =>
      (i.firstName + ' ' + i.lastName).toLowerCase().includes(query) ||
      i.email.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.isLoading.set(true);
    this.adminService.getAllInstructors(0, 50).subscribe({
      next: (res) => {
        this.instructors.set(res.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des instructeurs', err);
        this.isLoading.set(false);
      }
    });
  }
}