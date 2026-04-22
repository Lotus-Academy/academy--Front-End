import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CertificateDTO } from '../../core/models/certificate.dto';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/certificates`;

  /**
   * Récupère la liste de tous les certificats obtenus par l'étudiant
   */
  getMyCertificates(): Observable<CertificateDTO[]> {
    return this.http.get<CertificateDTO[]>(`${this.apiUrl}/my-certificates`);
  }

  /**
   * Télécharge le fichier PDF d'un certificat spécifique
   */
  downloadCertificate(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}