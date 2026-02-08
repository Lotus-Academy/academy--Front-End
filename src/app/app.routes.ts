import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },

    // Astuce : Si on tape /register, on redirige vers /login avec le paramètre mode=signup
    { path: 'register', redirectTo: '/login?mode=signup', pathMatch: 'full' },

    { path: 'dashboard', component: DashboardComponent },
    // Redirection par défaut
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];