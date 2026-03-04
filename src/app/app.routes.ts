import { Routes } from '@angular/router';

// ==========================================
// IMPORTS : PUBLIC & AUTHENTIFICATION
// ==========================================
import { HomeComponent } from './features/home/home-component/home-component';
import { LoginComponent } from './features/auth/login/login.component';
import { InstructorRegisterComponent } from './features/auth/instructor-register/instructor-register.component';

// ==========================================
// IMPORTS : COURS PUBLICS
// ==========================================
import { CourseListComponent } from "./features/courses/course-list/course-list-component";
import { CourseDetailComponent } from './features/courses/course-detail/course-detail-component';

// ==========================================
// IMPORTS : DASHBOARD GÉNÉRAL (Étudiant)
// ==========================================
import { DashboardComponent } from './features/dashboard/dashboard.component';

// ==========================================
// IMPORTS : INSTRUCTEUR
// ==========================================
import { InstructorOnboardingComponent } from './features/instructor/onboarding/onboarding.component';
import { CourseCreateComponent } from './features/instructor/course-create-component/course-create-component';
import { CourseEditorShellComponent } from './features/instructor/course-editor-shell/course-editor-shell.component';
import { CourseEditBasicComponent } from './features/instructor/course-edit-basic/course-edit-basic.component';
import { CourseCurriculumComponent } from './features/instructor/course-curriculum/course-curriculum.component';
import { CoursePricingComponent } from './features/instructor/course-pricing/course-pricing.component';
import { CourseQuizComponent } from './features/instructor/course-quiz/course-quiz.component';
import { CourseEditPreviewComponent } from './features/instructor/course-edit-preview/course-edit-preview.component';

// ==========================================
// IMPORTS : ADMINISTRATION
// ==========================================
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminCoursesComponent } from './features/admin/admin-courses/admin-courses.component';
import { AdminInstructorsComponent } from './features/admin/admin-instructors/admin-instructors.component';
import { AdminCategoriesComponent } from './features/admin/admin-categories/admin-categories.component';
import { AdminAnalyticsComponent } from './features/admin/admin-analytics/admin-analytics.component';
import { AdminPaymentsComponent } from './features/admin/admin-payments/admin-payments.component';

export const routes: Routes = [
    // --- ROUTES PUBLIQUES ---
    { path: '', component: HomeComponent },
    { path: 'courses', component: CourseListComponent },
    { path: 'courses/:id', component: CourseDetailComponent },

    // --- ROUTES D'AUTHENTIFICATION ---
    { path: 'login', component: LoginComponent },
    { path: 'register', redirectTo: '/login', pathMatch: 'full' },
    // Nouvelle route pour l'inscription des instructeurs
    { path: 'instructor-register', component: InstructorRegisterComponent },

    // --- DASHBOARD GÉNÉRAL ---
    { path: 'dashboard', component: DashboardComponent },

    // --- ROUTES INSTRUCTEUR ---
    // Nouvelle route pour le formulaire d'intégration (Onboarding)
    { path: 'instructor/onboarding', component: InstructorOnboardingComponent },
    { path: 'instructor/courses/new', component: CourseCreateComponent },
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

    // --- ROUTES ADMINISTRATION ---
    { path: 'dashboard/users', component: AdminUsersComponent },
    { path: 'dashboard/videos', component: AdminCoursesComponent },
    { path: 'dashboard/instructors', component: AdminInstructorsComponent },
    { path: 'dashboard/categories', component: AdminCategoriesComponent },
    { path: 'dashboard/analytics', component: AdminAnalyticsComponent },
    { path: 'dashboard/payments', component: AdminPaymentsComponent },

    // --- FALLBACK (Page 404) ---
    // DOIT ABSOLUMENT RESTER EN DERNIÈRE POSITION
    { path: '**', redirectTo: '' }
];