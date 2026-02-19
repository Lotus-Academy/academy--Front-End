import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  PlayCircle,
  Clock,
  BookOpen,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Globe,
  MonitorPlay
} from 'lucide-angular';

import { NavbarComponent } from '../../layouts/navbar-component/navbar-component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';
import { CourseService } from '../../../core/services/course-service';
import { CourseDetailDTO, SectionDTO } from '../../../core/models/course-detail.dto';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    CurrencyPipe
  ],
  templateUrl: './course-detail-component.html'
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  readonly icons = {
    PlayCircle, Clock, BookOpen, CheckCircle, Lock,
    ChevronDown, ChevronUp, Award, Globe, MonitorPlay
  };

  // État du composant
  course = signal<CourseDetailDTO | null>(null);
  isLoading = signal<boolean>(true);

  // Gestion de l'accordéon (stocke les IDs des sections ouvertes)
  expandedSections = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseDetails(id);
    }
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);
    // Simulation de l'appel API (à remplacer par this.courseService.getCourseDetail(id))
    setTimeout(() => {
      const mockDetail: CourseDetailDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Maîtriser l\'Analyse Technique et le Price Action',
        description: 'Ce cours intensif vous apprendra à lire n\'importe quel graphique financier sans utiliser le moindre indicateur technique. Nous aborderons la psychologie des marchés, les structures de prix, et les stratégies institutionnelles de liquidité.',
        price: 149.99,
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        instructorId: 'inst-1',
        instructorEmail: 'contact@lotusacademy.com',
        instructorName: 'Martinien GABA',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
        totalSections: 2,
        totalLessons: 5,
        totalDuration: 5400, // 1h 30m en secondes
        sections: [
          {
            id: 'sec-1', title: 'Introduction aux Marchés', orderIndex: 1, courseId: '123',
            lessons: [
              { id: 'les-1', title: 'Comprendre l\'offre et la demande', duration: 900, orderIndex: 1, sectionId: 'sec-1', mediaUrl: '', isCompleted: false },
              { id: 'les-2', title: 'La psychologie du trader', duration: 1200, orderIndex: 2, sectionId: 'sec-1', mediaUrl: '', isCompleted: false }
            ]
          },
          {
            id: 'sec-2', title: 'Structures de Marché Avancées', orderIndex: 2, courseId: '123',
            lessons: [
              { id: 'les-3', title: 'Identification des cassures (BOS)', duration: 1500, orderIndex: 1, sectionId: 'sec-2', mediaUrl: '', isCompleted: false },
              { id: 'les-4', title: 'Zones de liquidité', duration: 1800, orderIndex: 2, sectionId: 'sec-2', mediaUrl: '', isCompleted: false }
            ]
          }
        ]
      };

      this.course.set(mockDetail);

      // Ouvrir la première section par défaut
      if (mockDetail.sections.length > 0) {
        this.toggleSection(mockDetail.sections[0].id);
      }

      this.isLoading.set(false);
    }, 800);
  }

  // Formate la durée en secondes vers "Xh Ym"
  formatDuration(seconds: number): string {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  }

  // Gestionnaire pour l'accordéon
  toggleSection(sectionId: string): void {
    const currentExpanded = new Set(this.expandedSections());
    if (currentExpanded.has(sectionId)) {
      currentExpanded.delete(sectionId);
    } else {
      currentExpanded.add(sectionId);
    }
    this.expandedSections.set(currentExpanded);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId);
  }
}