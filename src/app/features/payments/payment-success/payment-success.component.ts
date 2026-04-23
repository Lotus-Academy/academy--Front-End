import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LucideAngularModule, CheckCircle, ArrowRight, BookOpen, Loader2 } from 'lucide-angular';
import { NavbarComponent } from '../../layouts/navbar-component/navbar.component';
import { FooterComponent } from '../../layouts/footer-component/footer-component';



@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule, NavbarComponent, FooterComponent],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly icons = { CheckCircle, ArrowRight, BookOpen, Loader2 };

  sessionId = signal<string | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    setTimeout(() => {
      this.sessionId.set(this.route.snapshot.queryParamMap.get('session_id'));
      this.isLoading.set(false);
    }, 800);
  }
}