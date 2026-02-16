import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {
  pendingApprovals = [
    { id: 1, name: 'Jean Dupont', type: 'Instructeur', date: new Date() },
    { id: 2, name: 'Analyse Technique 101', type: 'Vidéo', date: new Date() }
  ];
}