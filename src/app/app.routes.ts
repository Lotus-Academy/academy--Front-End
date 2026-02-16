import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home-component/home-component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CourseCreateComponent } from './features/instructor/course-create-component/course-create-component';

export const routes: Routes = [
    // La page d'accueil est maintenant la route par défaut
    { path: '', component: HomeComponent },

    { path: 'login', component: LoginComponent },

    // Inscription redirigeant vers le mode signup de la page login
    { path: 'register', redirectTo: '/login?mode=signup', pathMatch: 'full' },

    { path: 'dashboard', component: DashboardComponent },

    {
        path: 'instructor/courses/new',
        component: CourseCreateComponent
    },

    //routes des elements du navbar
    //{ path: 'courses', component: HomeComponent }, // À remplacer par CourseListComponent plus tard
    //{ path: 'become-instructor', component: HomeComponent }, // À remplacer par InstructorComponent plus tard
    //{ path: 'faq', component: HomeComponent }, // À remplacer par FaqComponent plus tard
    // Gestion des pages non trouvées (optionnel mais conseillé)
    { path: '**', redirectTo: '' }
];