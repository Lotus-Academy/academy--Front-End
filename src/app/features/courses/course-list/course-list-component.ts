import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, Search, Filter, X, Loader2, ChevronDown } from 'lucide-angular';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card-component';
import { CourseService } from '../../../core/services/course.service';
import { CourseResponseDTO, PageCourseResponseDTO, CategoryDTO } from '../../../core/models/course.dto';
import { NavbarComponent } from '../../layouts/navbar-component/navbar.component';
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
  templateUrl: './course-list-component.html',
  styleUrl: './course-list-component.css'
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);
  private route = inject(ActivatedRoute);

  readonly icons = { Search, Filter, X, Loader2, ChevronDown };

  allCourses = signal<CourseResponseDTO[]>([]);
  isLoading = signal<boolean>(true);

  // États de filtrage réactifs
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedLevel = signal<string>('All');
  selectedPrice = signal<string>('All');
  categories = signal<CategoryDTO[]>([]);
  filtersOpen = signal<boolean>(false);

  levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  priceFilters = ['All', 'Free', 'Paid'];

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' ||
    this.selectedCategory() !== 'All' ||
    this.selectedLevel() !== 'All' ||
    this.selectedPrice() !== 'All'
  );

  // Moteur d'évaluation synchrone (Miroir local filtré)
  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const level = this.selectedLevel();
    const price = this.selectedPrice();

    return this.allCourses().filter(course => {
      const matchesSearch = !query || course.title.toLowerCase().includes(query) ||
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
    // Écoute croisée des requêtes de recherche provenant de la Navbar (paramètre 'search' ou 'categoryId')
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery.set(params['search']);
      }
      if (params['categoryId']) {
        this.selectedCategory.set(params['categoryId']);
      }
    });
    this.fetchData();
  }

  fetchData() {
    this.isLoading.set(true);

    // Chargement des vraies catégories
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Erreur chargement catégories', err)
    });

    // Chargement de l'intégralité du catalogue publié
    this.courseService.getPublishedCourses(0, 100).subscribe({
      next: (pageData: PageCourseResponseDTO) => {
        this.allCourses.set(pageData.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cours', err);
        this.isLoading.set(false);
      }
    });
  }

  // Permet de retrouver le libellé textuel d'une catégorie à partir de son ID UUID pour les badges
  getCategoryName(id: string): string {
    const cat = this.categories().find(c => c.id === id);
    return cat ? cat.name : id;
  }

  toggleFilters() {
    this.filtersOpen.update(v => !v);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedLevel.set('All');
    this.selectedPrice.set('All');
  }

  translateLevel(level: string): string {
    if (level === 'All') return 'COURSE_LIST.FILTERS.ALL';
    return `COURSE_LIST.FILTERS.${level.toUpperCase()}`;
  }

  translatePrice(price: string): string {
    if (price === 'All') return 'COURSE_LIST.FILTERS.ALL';
    return `COURSE_LIST.FILTERS.${price.toUpperCase()}`;
  }
}