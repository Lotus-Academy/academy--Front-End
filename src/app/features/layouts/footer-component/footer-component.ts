import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core'; // Importation nécessaire

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './footer-component.html'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerLinks = {
    company: [
      { labelKey: 'FOOTER.COMPANY.ABOUT', href: '/about' },
      { labelKey: 'FOOTER.COMPANY.CAREERS', href: '/careers' },
      { labelKey: 'FOOTER.COMPANY.PRESS', href: '/press' },
    ],
    resources: [
      { labelKey: 'FOOTER.RESOURCES.BLOG', href: '/blog' },
      { labelKey: 'FOOTER.RESOURCES.HELP', href: '/help' },
      { labelKey: 'FOOTER.RESOURCES.FAQ', href: '/faq' },
    ],
    legal: [
      { labelKey: 'FOOTER.LEGAL.TERMS', href: '/terms' },
      { labelKey: 'FOOTER.LEGAL.PRIVACY', href: '/privacy' },
      { labelKey: 'FOOTER.LEGAL.COOKIES', href: '/cookies' },
    ],
  };
}