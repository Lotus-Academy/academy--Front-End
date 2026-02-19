import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Menu, X, Search, Globe, Moon, Sun } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme-service';

// Définition d'une interface claire pour les liens
interface NavLink {
  href: string;
  label: string;
  fragment?: string; // Optionnel : utilisé uniquement pour le scroll sur la même page
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar-component.html'
})
export class NavbarComponent {
  public themeService = inject(ThemeService);
  isMobileMenuOpen = false;
  readonly icons = { Menu, X, Search, Globe, Moon, Sun };

  // Organisation mixte : navigation vers des pages (Courses) et scroll par fragments (Home, FAQ)
  navLinks: NavLink[] = [
    { href: '/', fragment: 'hero', label: 'Home' },
    { href: '/courses', label: 'Courses' }, // Pointeur mis à jour vers la nouvelle page
    { href: '/', fragment: 'topics', label: 'Teach' },
    { href: '/', fragment: 'faq', label: 'FAQ' },
  ];

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}