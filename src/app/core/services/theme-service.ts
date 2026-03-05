import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  // Initialisation avec notre nouvelle logique par défaut
  darkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    // Cet effet s'exécute à l'initialisation puis à chaque changement
    effect(() => {
      const isDark = this.darkMode();

      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggleTheme(): void {
    this.darkMode.update(v => !v);
  }

  /**
   * Détermine le thème initial lors du premier chargement.
   */
  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('theme');

    // 1. Si l'utilisateur a explicitement choisi un thème (même clair), on le respecte
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    // 2. S'il n'y a pas de sauvegarde (première visite), on IMPOSE le mode sombre
    // Cela correspond à l'esthétique Fintech Terminal de Lotus Academy
    return true;
  }
}