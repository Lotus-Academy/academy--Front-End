import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- Nécessaire pour [(ngModel)]
import { TranslateModule } from '@ngx-translate/core';
import { 
  LucideAngularModule, Trophy, Download, Award, Loader2, 
  FileText, CheckCircle, Search, Filter, X, Eye, ShieldCheck
} from 'lucide-angular';

import { CertificateService } from '../../../core/services/certificate.service';
import { CertificateDTO } from '../../../core/models/certificate.dto';
import { StudentLayoutComponent } from "../../layouts/dashboard-layouts/student-dashboard-layout/student-dashboard-layout.component";

@Component({
  selector: 'app-my-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule, DatePipe, StudentLayoutComponent],
  templateUrl: './my-certificates.component.html'
})
export class MyCertificatesComponent implements OnInit {
  private certificateService = inject(CertificateService);

  readonly icons = { 
    Trophy, Download, Award, Loader2, FileText, CheckCircle, Search, Filter, X, Eye, ShieldCheck
  };

  // --- STATE ---
  certificates = signal<CertificateDTO[]>([]);
  isLoading = signal<boolean>(true);
  downloadingId = signal<string | null>(null);
  
  // --- SEARCH & FILTER ---
  searchQuery = signal<string>('');
  selectedCourseFilter = signal<string>('All');
  
  // --- MODAL STATE ---
  selectedCertificate = signal<CertificateDTO | null>(null);

  // Génère la liste unique des cours pour le menu déroulant du filtre
  uniqueCourses = computed(() => {
    const courses = this.certificates().map(c => c.courseTitle);
    return ['All', ...new Set(courses)];
  });

  // Filtre les certificats en temps réel
  filteredCertificates = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const courseFilter = this.selectedCourseFilter();

    return this.certificates().filter(cert => {
      const matchesSearch = cert.courseTitle.toLowerCase().includes(query) || 
                            cert.serialNumber.toLowerCase().includes(query);
      const matchesCourse = courseFilter === 'All' || cert.courseTitle === courseFilter;
      
      return matchesSearch && matchesCourse;
    });
  });

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.isLoading.set(true);
    this.certificateService.getMyCertificates().subscribe({
      next: (data) => {
        this.certificates.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load certificates', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCourseFilter.set('All');
  }

  openDetails(cert: CertificateDTO): void {
    this.selectedCertificate.set(cert);
  }

  closeDetails(): void {
    this.selectedCertificate.set(null);
  }

  downloadPdf(certificate: CertificateDTO, event?: Event): void {
    if (event) event.stopPropagation(); // Empêche d'ouvrir la modale si on clique juste sur le bouton
    
    this.downloadingId.set(certificate.id);
    
    this.certificateService.downloadCertificate(certificate.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const safeTitle = certificate.courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `Lotus_Academy_Certificate_${safeTitle}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.downloadingId.set(null);
      },
      error: (err) => {
        console.error('Failed to download certificate', err);
        alert('An error occurred while downloading the certificate. Please try again.');
        this.downloadingId.set(null);
      }
    });
  }
}