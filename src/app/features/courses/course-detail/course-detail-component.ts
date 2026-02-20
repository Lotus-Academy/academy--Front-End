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
  MonitorPlay,
  Unlock // Ajout pour les vidéos gratuites
} from 'lucide-angular';

import { NavbarComponent } from '../../layouts/navbar-component/navbar-component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';
import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';

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
    ChevronDown, ChevronUp, Award, Globe, MonitorPlay, Unlock
  };

  // État du composant avec le vrai type du backend
  course = signal<CourseResponseDTO | null>(null);
  isLoading = signal<boolean>(true);

  // Valeurs calculées dynamiquement à partir des sections du backend
  totalSections = computed(() => this.course()?.sections?.length || 0);

  totalLessons = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  totalDuration = computed(() => {
    const sections = this.course()?.sections || [];
    return sections.reduce((acc, section) => {
      const secDuration = section.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
      return acc + secDuration;
    }, 0);
  });

  // Gestion de l'accordéon
  expandedSections = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseDetails(id);
    }
  }

  loadCourseDetails(id: string): void {
    this.isLoading.set(true);

    this.courseService.getCourseById(id).subscribe({
      next: (data: CourseResponseDTO) => {
        this.course.set(data);

        // Ouvrir la première section par défaut
        if (data.sections && data.sections.length > 0) {
          this.toggleSection(data.sections[0].id);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du cours :', error);
        this.isLoading.set(false);
      }
    });
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


















/* const mockDetail: CourseDetailDTO = {
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
  };*/
