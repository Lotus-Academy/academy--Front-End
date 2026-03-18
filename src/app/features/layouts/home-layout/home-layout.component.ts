import { Component } from '@angular/core';
import { FooterComponent } from '../footer-component/footer-component';
import { NavbarComponent } from '../navbar-component/navbar.component';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.css',
})
export class HomeLayoutComponent {

}
