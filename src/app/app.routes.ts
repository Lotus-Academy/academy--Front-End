import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home-component/home-component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CourseCreateComponent } from './features/instructor/course-create-component/course-create-component';
import { CourseListComponent } from "./features/courses/course-list/course-list-component";

import { CourseEditorShellComponent } from './features/instructor/course-editor-shell/course-editor-shell.component';
import { CourseEditBasicComponent } from './features/instructor/course-edit-basic/course-edit-basic.component';
import { CourseCurriculumComponent } from './features/instructor/course-curriculum/course-curriculum.component';
import { CoursePricingComponent } from './features/instructor/course-pricing/course-pricing.component';

import { CourseDetailComponent } from './features/courses/course-detail/course-detail-component';
import { CourseQuizComponent } from './features/instructor/course-quiz/course-quiz.component';
import { CourseEditPreviewComponent } from './features/instructor/course-edit-preview/course-edit-preview.component';
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminCoursesComponent } from './features/admin/admin-courses/admin-courses.component';
import { AdminInstructorsComponent } from './features/admin/admin-instructors/admin-instructors.component';
import { AdminCategoriesComponent } from './features/admin/admin-categories/admin-categories.component';
import { AdminAnalyticsComponent } from './features/admin/admin-analytics/admin-analytics.component';
import { AdminPaymentsComponent } from './features/admin/admin-payments/admin-payments.component';

export const routes: Routes = [
    // La page d'accueil est maintenant la route par défaut
    { path: '', component: HomeComponent },

    { path: 'login', component: LoginComponent },


    { path: 'register', redirectTo: '/login', pathMatch: 'full' },

    { path: 'dashboard', component: DashboardComponent },

    { path: 'courses', component: CourseListComponent },

    { path: 'courses/:id', component: CourseDetailComponent },

    {
        path: 'instructor/courses/new',
        component: CourseCreateComponent
    },
    // L'Éditeur complet du cours avec ses sous-sections
    {
        path: 'instructor/courses/:id/edit',
        component: CourseEditorShellComponent,
        children: [
            { path: 'basic', component: CourseEditBasicComponent },
            { path: 'curriculum', component: CourseCurriculumComponent },
            { path: 'pricing', component: CoursePricingComponent },
            { path: 'quiz', component: CourseQuizComponent },
            { path: 'preview', component: CourseEditPreviewComponent },
            { path: '', redirectTo: 'basic', pathMatch: 'full' } // Redirection par défaut

        ]
    },

    //routes des elements du navbar
    //{ path: 'become-instructor', component: InstructorComponent }, // À remplacer par InstructorComponent plus tard
    //{ path: 'faq', component: HomeComponent }, // À remplacer par FaqComponent plus tard

    // Gestion des pages non trouvées (optionnel mais conseillé)
    // Cette route (wildcard) DOIT toujours rester à la toute fin du tableau.


    // Routes d'administration (chaque vue embarque le layout)
    { path: 'dashboard/users', component: AdminUsersComponent },
    { path: 'dashboard/videos', component: AdminCoursesComponent },

    { path: 'dashboard/instructors', component: AdminInstructorsComponent },
    { path: 'dashboard/categories', component: AdminCategoriesComponent },
    { path: 'dashboard/analytics', component: AdminAnalyticsComponent },
    { path: 'dashboard/payments', component: AdminPaymentsComponent },
    // { path: 'dashboard', component: AdminOverviewComponent },
    { path: '**', redirectTo: '' }
];