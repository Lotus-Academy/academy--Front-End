import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, X } from 'lucide-angular';

//import { NavbarComponent } from '../../../layout/navbar/navbar-component';
//import { FooterComponent } from '../../../layout/footer/footer-component';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';
import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO } from '../../../core/models/course.dto';
import { NavbarComponent } from "../../layouts/navbar-component/navbar-component";
import { FooterComponent } from "../../layouts/footer-component/footer-component";

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NavbarComponent,
    FooterComponent,
    CourseCardComponent,

  ],
  templateUrl: './course-list-component.html'
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  readonly icons = { Search, Filter, X };

  // Données
  allCourses = signal<CourseResponseDTO[]>([]);
  isLoading = signal<boolean>(true);

  // Filtres (équivalent des useState)
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedLevel = signal<string>('All');
  selectedPrice = signal<string>('All');

  // Options de filtrage
  categories = ['All', 'Trading', 'Cryptomonnaie', 'Programmation', 'Machine Learning'];
  levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  priceFilters = ['All', 'Free', 'Paid'];

  // État dérivé : Vérifie si un filtre est actif (équivalent de hasActiveFilters)
  hasActiveFilters = computed(() => {
    return this.searchQuery() !== '' ||
      this.selectedCategory() !== 'All' ||
      this.selectedLevel() !== 'All' ||
      this.selectedPrice() !== 'All';
  });

  // Calcul réactif des cours filtrés (équivalent du useMemo)
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const level = this.selectedLevel();
    const price = this.selectedPrice();

    return this.allCourses().filter(course => {
      // Recherche textuelle
      const matchesSearch = course.title.toLowerCase().includes(query) ||
        course.instructorName.toLowerCase().includes(query);

      // Filtre Catégorie
      const matchesCategory = category === 'All' || course.categoryName === category;

      // Filtre Niveau
      const matchesLevel = level === 'All' || course.level === level;

      // Filtre Prix
      const matchesPrice = price === 'All' ||
        (price === 'Free' && course.price === 0) ||
        (price === 'Paid' && course.price > 0);

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  });

  ngOnInit() {
    this.fetchCourses();
  }

  fetchCourses() {
    this.isLoading.set(true);
    this.courseService.getPublishedCourses().subscribe({
      next: (courses) => {
        this.allCourses.set(courses.content);
        this.isLoading.set(false);

        // Optionnel : Extraire dynamiquement les catégories des données réelles
        const uniqueCats = ['All', 'informatique', 'trading', 'cryptomonnaie', 'programmation', 'machine learning'];
        this.categories = uniqueCats;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cours', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedLevel.set('All');
    this.selectedPrice.set('All');
  }
}