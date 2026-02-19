import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home-component/home-component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CourseCreateComponent } from './features/instructor/course-create-component/course-create-component';
import { CourseListComponent } from "./features/courses/course-list/course-list-component";

// NOUVEAU : Import du composant de détails du cours
// Assurez-vous que le chemin correspond à l'emplacement réel de votre fichier
import { CourseDetailComponent } from './features/courses/course-detail/course-detail-component';

export const routes: Routes = [
    // La page d'accueil est maintenant la route par défaut
    { path: '', component: HomeComponent },

    { path: 'login', component: LoginComponent },

    // CORRECTION : Angular ne supporte pas les queryParams directement dans la chaîne du redirectTo.
    // La redirection doit pointer vers le chemin de base '/login'.
    { path: 'register', redirectTo: '/login', pathMatch: 'full' },

    { path: 'dashboard', component: DashboardComponent },

    { path: 'courses', component: CourseListComponent },


    { path: 'courses/:id', component: CourseDetailComponent },

    {
        path: 'instructor/courses/new',
        component: CourseCreateComponent
    },

    //routes des elements du navbar
    //{ path: 'become-instructor', component: InstructorComponent }, // À remplacer par InstructorComponent plus tard
    //{ path: 'faq', component: HomeComponent }, // À remplacer par FaqComponent plus tard

    // Gestion des pages non trouvées (optionnel mais conseillé)
    // Cette route (wildcard) DOIT toujours rester à la toute fin du tableau.
    { path: '**', redirectTo: '' }
];