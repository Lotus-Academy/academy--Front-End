import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent {
  // Données fictives pour l'UI
  inProgressCourses = [
    { id: 1, title: 'Trading Masterclass', instructor: 'Sarah Johnson', progress: 65, thumb: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' },
    { id: 2, title: 'Python for Finance', instructor: 'Michael Chen', progress: 30, thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400' }
  ];
}
