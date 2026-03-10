import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// --- Imports pour la traduction ---
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';


export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string) => {
      // Génération d'un horodatage unique en millisecondes
      const cacheBuster = Date.now();
      // Concaténation de l'horodatage à l'URL du fichier JSON
      return http.get<any>(`/assets/i18n/${lang}.json?v=${cacheBuster}`);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),

    // 1. Configuration du client HTTP avec fetch et les intercepteurs (dont l'authentification)
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    // 2. Configuration globale du module de traduction
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};