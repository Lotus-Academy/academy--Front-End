import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
// Ajout de ChevronDown et CheckCircle pour le menu de langue
import { LucideAngularModule, Menu, X, Search, Globe, Moon, Sun, ChevronDown, CheckCircle } from 'lucide-angular';
import { ThemeService } from '../../../core/services/theme-service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

interface NavLink {
  href: string;
  labelKey: string; // Changé de label à labelKey pour la traduction
  fragment?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  // Ajout du TranslateModule
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule, TranslateModule],
  templateUrl: './navbar-component.html'
})
export class NavbarComponent {
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService); // Injection du service de langue

  isMobileMenuOpen = false;
  isLanguageMenuOpen = signal<boolean>(false); // Signal pour le dropdown de langue

  readonly icons = { Menu, X, Search, Globe, Moon, Sun, ChevronDown, CheckCircle };

  navLinks: NavLink[] = [
    { href: '/', fragment: 'hero', labelKey: 'NAVBAR.HOME' },
    { href: '/courses', labelKey: 'NAVBAR.COURSES' },
    { href: '/instructor-register', fragment: 'topics', labelKey: 'NAVBAR.TEACH' },
    { href: '/', fragment: 'faq', labelKey: 'NAVBAR.FAQ' },
  ];

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // --- Gestion du menu des langues ---
  toggleLanguageMenu(): void {
    this.isLanguageMenuOpen.update(v => !v);
  }

  closeLanguageMenu(): void {
    this.isLanguageMenuOpen.set(false);
  }

  switchLanguage(lang: 'fr' | 'en'): void {
    this.languageService.setLanguage(lang);
    this.closeLanguageMenu();
  }
}