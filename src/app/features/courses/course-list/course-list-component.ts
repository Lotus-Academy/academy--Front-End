import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search, Filter, X, Loader2 } from 'lucide-angular';

import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';
import { CourseService } from '../../../core/services/course-service';
import { CourseResponseDTO, PageCourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';
import { NavbarComponent } from '../../layouts/navbar-component/navbar-component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';

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
    TranslateModule
  ],
  templateUrl: './course-list-component.html'
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  readonly icons = { Search, Filter, X, Loader2 };

  allCourses = signal<CourseResponseDTO[]>([]);
  isLoading = signal<boolean>(true);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedLevel = signal<string>('All');
  selectedPrice = signal<string>('All');

  // Les catégories viendront de l'API
  categories = signal<CategoryDTO[]>([]);

  // Niveaux et Prix codés en dur (utiliseront les clés JSON pour l'affichage HTML)
  levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  priceFilters = ['All', 'Free', 'Paid'];

  hasActiveFilters = computed(() => {
    return this.searchQuery() !== '' ||
      this.selectedCategory() !== 'All' ||
      this.selectedLevel() !== 'All' ||
      this.selectedPrice() !== 'All';
  });

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const level = this.selectedLevel();
    const price = this.selectedPrice();

    return this.allCourses().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(query) ||
        (course.instructorName && course.instructorName.toLowerCase().includes(query));

      const matchesCategory = category === 'All' || course.categoryId === category;

      const matchesLevel = level === 'All' || (course.level && course.level.toUpperCase() === level);

      const matchesPrice = price === 'All' ||
        (price === 'Free' && course.price === 0) ||
        (price === 'Paid' && course.price > 0);

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  });

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);

    // 1. Récupération des catégories
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Erreur chargement catégories', err)
    });

    // 2. Récupération du catalogue paginé (on prend la première page, très large pour l'instant)
    this.courseService.getPublishedCourses(0, 100).subscribe({
      next: (pageData: PageCourseResponseDTO) => {
        this.allCourses.set(pageData.content); // Extraction du tableau
        this.isLoading.set(false);
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

  // Helper pour traduire les badges dynamiquement
  translateLevel(level: string): string {
    if (level === 'All') return 'COURSE_LIST.FILTERS.ALL';
    return `COURSE_LIST.FILTERS.${level.toUpperCase()}`;
  }

  translatePrice(price: string): string {
    if (price === 'All') return 'COURSE_LIST.FILTERS.ALL';
    return `COURSE_LIST.FILTERS.${price.toUpperCase()}`;
  }
}