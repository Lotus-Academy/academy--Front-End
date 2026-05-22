import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InstructorTermsService, InstructorTermsResponse } from '../../../core/services/instructor-terms.service';
import { LucideAngularModule, Plus, Eye, History, Loader2, AlertTriangle, Send, ChevronLeft, X, CheckCircle2, FileText, MessageSquare } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LivePreviewDirective } from '../../../shared/directives/live-preview.directive';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

@Component({
  selector: 'app-admin-terms-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslateModule,
    DatePipe,
    LivePreviewDirective,
    AdminLayoutComponent
  ],
  templateUrl: './admin-terms-manager.component.html'
})
export class AdminTermsManagerComponent implements OnInit {
  private termsService = inject(InstructorTermsService);
  private fb = inject(FormBuilder);

  // Signaux d'état
  termsHistory = signal<InstructorTermsResponse[]>([]);
  showCreateForm = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string>('');
  selectedTermForView = signal<InstructorTermsResponse | null>(null);

  readonly icons = { Plus, Eye, History, Loader2, AlertTriangle, Send, ChevronLeft, X, CheckCircle2, FileText, MessageSquare };

  termsForm: FormGroup = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(20)]],
    releaseNotes: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.termsService.getAllTermsVersions().subscribe({
      next: (data) => {
        this.termsHistory.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.selectedTermForView.set(null);
    }
  }

  viewTerm(term: InstructorTermsResponse): void {
    this.showCreateForm.set(false);
    this.selectedTermForView.set(term);
  }

  publishNewVersion(): void {
    if (this.termsForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.termsService.createNewVersion(this.termsForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showCreateForm.set(false);
        this.termsForm.reset();
        this.loadHistory();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Failed to publish version. Please verify your data.');
      }
    });
  }
}