// src/app/core/services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Initialisation basée sur le localStorage
  darkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  constructor() {
    // Cet effet s'exécute automatiquement dès que darkMode() change
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

  toggleTheme() {
    this.darkMode.update(v => !v);
  }
}