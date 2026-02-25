import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, User, ShieldAlert } from 'lucide-angular';

import { AdminLayoutComponent } from '../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component'; // Ajustez le chemin
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminLayoutComponent, DatePipe],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  readonly icons = { Search, User, ShieldAlert };

  isLoading = signal<boolean>(true);
  students = signal<any[]>([]); // Utilisez votre UserDTO ici si disponible
  searchQuery = signal<string>('');

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.students().filter(s =>
      (s.firstName + ' ' + s.lastName).toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.adminService.getAllStudents(0, 50).subscribe({
      next: (res) => {
        this.students.set(res.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }
}