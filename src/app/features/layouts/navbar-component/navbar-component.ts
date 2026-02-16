import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Menu, X, Search, Globe, Moon, Sun } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme-service';

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

  // Organisation pour SPA : on reste sur '/' mais on vise des fragments
  navLinks = [
    { href: '/', fragment: 'hero', label: 'Home' },
    { href: '/', fragment: 'courses', label: 'Courses' },
    { href: '/', fragment: 'topics', label: 'Teach' }, // Adapté selon votre contenu
    { href: '/', fragment: 'faq', label: 'FAQ' },
  ];

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}