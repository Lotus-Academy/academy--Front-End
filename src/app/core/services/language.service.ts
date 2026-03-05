import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translateService = inject(TranslateService);
  private readonly LANG_KEY = 'lotus_academy_lang';

  constructor() {
    this.initLanguage();
  }

  /**
   * Initialise la langue au démarrage de l'application
   */
  private initLanguage(): void {
    const savedLang = localStorage.getItem(this.LANG_KEY);
    // Langues supportées
    this.translateService.addLangs(['fr', 'en']);
    // Langue par défaut si aucune n'est trouvée
    this.translateService.setDefaultLang('fr');

    if (savedLang) {
      this.translateService.use(savedLang);
    } else {
      // Détection de la langue du navigateur
      const browserLang = this.translateService.getBrowserLang();
      const langToUse = browserLang?.match(/en|fr/) ? browserLang : 'fr';
      this.translateService.use(langToUse);
    }
  }

  /**
   * Change la langue et sauvegarde la préférence
   */
  public setLanguage(lang: 'fr' | 'en'): void {
    this.translateService.use(lang);
    localStorage.setItem(this.LANG_KEY, lang);
  }

  /**
   * Retourne la langue actuellement active
   */
  public getCurrentLanguage(): string {
    return this.translateService.currentLang ?? this.translateService.getDefaultLang();
  }

  /**
   * Bascule entre le français et l'anglais
   */
  public toggleLanguage(): void {
    const current = this.getCurrentLanguage();
    this.setLanguage(current === 'fr' ? 'en' : 'fr');
  }
}