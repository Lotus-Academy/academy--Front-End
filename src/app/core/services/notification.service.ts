import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Interface correspondant à la structure de notification du layout
export interface AppNotification {
  id: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  read: boolean;
  createdAt: string;
}

// Interface pour les préférences décrite dans la documentation
export interface NotificationPreferenceDTO {
  emailCourseUpdates: boolean;
  emailPromotions: boolean;
  pushNewMessages: boolean;
  pushCourseReminders: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private zone = inject(NgZone); // Nécessaire pour réintégrer les événements SSE dans le cycle de détection d'Angular

  private readonly baseUrl = `${environment.apiUrl}/api/v1/notifications`;
  private eventSource: EventSource | null = null;

  /**
   * Récupère l'historique des notifications non lues
   */
  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.baseUrl);
  }

  /**
   * Marque une notification spécifique comme lue
   */
  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
  }

  /**
   * Marque toutes les notifications de l'utilisateur comme lues
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }

  /**
   * Supprime définitivement une notification
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Gestion des préférences de notification
   */
  getPreferences(): Observable<NotificationPreferenceDTO> {
    return this.http.get<NotificationPreferenceDTO>(`${this.baseUrl}/preferences`);
  }

  updatePreferences(preferences: NotificationPreferenceDTO): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/preferences`, preferences);
  }

  /**
   * Connexion au flux Server-Sent Events (SSE) pour les notifications en temps réel
   */
  connectToStream(onNotificationReceived: (notification: AppNotification) => void): void {
    if (this.eventSource) {
      return; // Empêche l'ouverture de connexions multiples
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('Impossible de se connecter au flux SSE : Aucun jeton d\'authentification trouvé.');
      return;
    }

    // Le jeton est passé en paramètre d'URL car EventSource natif ne gère pas les headers Authorization
    const streamUrl = `${this.baseUrl}/stream?token=${token}`;
    this.eventSource = new EventSource(streamUrl);

    this.eventSource.onmessage = (event: MessageEvent) => {
      // NgZone garantit que la mise à jour déclenchera le rafraîchissement de l'interface Angular
      this.zone.run(() => {
        try {
          const newNotification: AppNotification = JSON.parse(event.data);
          onNotificationReceived(newNotification);
        } catch (error) {
          console.error('Erreur lors du traitement de la notification SSE:', error);
        }
      });
    };

    this.eventSource.onerror = (error: Event) => {
      this.zone.run(() => {
        console.error('Connexion SSE interrompue ou erreur serveur.', error);
        this.disconnectStream();
        // Une logique de reconnexion automatique (ex: setTimeout) peut être implémentée ici si nécessaire
      });
    };
  }

  /**
   * Fermeture propre du flux SSE
   */
  disconnectStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}