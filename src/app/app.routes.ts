import { Routes } from '@angular/router';

// ==========================================
// IMPORTS : PUBLIC & AUTHENTIFICATION
// ==========================================
import { HomeComponent } from './features/home/home-component/home-component';
import { LoginComponent } from './features/auth/login/login.component';
import { InstructorRegisterComponent } from './features/auth/instructor-register/instructor-register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';

// ==========================================
// IMPORTS : COURS PUBLICS
// ==========================================
import { CourseListComponent } from "./features/courses/course-list/course-list-component";
import { CourseDetailComponent } from './features/courses/course-detail/course-detail-component';
import { StudentHomeComponent } from './features/student/student-home/student-home.component';

// ==========================================
// IMPORTS : ESPACE ÉTUDIANT
// ==========================================
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProfileComponent } from './features/user/profile/profile.component';
import { CoursePlayerComponent } from './features/courses/course-player/course-player.component';
import { StudentQuizComponent } from './features/student/student-quiz/student-quiz.component';


// ==========================================
// IMPORTS : ESPACE INSTRUCTEUR
// ==========================================
import { InstructorOnboardingComponent } from './features/instructor/onboarding/onboarding.component';
import { CourseCreateComponent } from './features/instructor/course-create-component/course-create-component';
import { CourseEditorShellComponent } from './features/instructor/course-editor-shell/course-editor-shell.component';
import { CourseEditBasicComponent } from './features/instructor/course-edit-basic/course-edit-basic.component';
import { CourseCurriculumComponent } from './features/instructor/course-curriculum/course-curriculum.component';
import { CoursePricingComponent } from './features/instructor/course-pricing/course-pricing.component';
import { CourseQuizComponent } from './features/instructor/course-quiz/course-quiz.component';
import { CourseEditPreviewComponent } from './features/instructor/course-edit-preview/course-edit-preview.component';
import { InstructorCoursesComponent } from './features/instructor/instructor-courses/instructor-courses.component';
import { InstructorStudentsComponent } from './features/instructor/instructor-students/instructor-students.component';
import { InstructorEarningsComponent } from './features/instructor/instructor-earnings/instructor-earnings.component';


// ==========================================
// IMPORTS : ADMINISTRATION
// ==========================================
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { AdminCoursesComponent } from './features/admin/admin-courses/admin-courses.component';
import { AdminInstructorsComponent } from './features/admin/admin-instructors/admin-instructors.component';
import { AdminCategoriesComponent } from './features/admin/admin-categories/admin-categories.component';
import { AdminAnalyticsComponent } from './features/admin/admin-analytics/admin-analytics.component';
import { AdminPaymentsComponent } from './features/admin/admin-payments/admin-payments.component';

// ==========================================
// IMPORTS : GUARDS
// ==========================================
import { authGuard } from './core/guards/auth.guard-guard';
import { instructorApprovedGuard } from './core/guards/instructor-approved.guard-guard';
import { AdminInstructorProfileComponent } from './features/admin/admin-instructor-profil/admin-instructor-profile.component';
import { AdminStudentProfileComponent } from './features/admin/admin-student-profile/admin-student-profile.component';
import { LiveSessionCreateComponent } from './features/live-session/live-session-create/live-session-create.component';
import { LiveSessionRoomComponent } from './features/live-session/live-session-room/live-session-room.component';
import { InstructorLiveSessionsComponent } from './features/instructor/instructor-live-sessions/instructor-live-sessions.component';
import { StudentLiveSessionsComponent } from './features/student/student-live-sessions/student-live-sessions.component';
import { MyLearningComponent } from './features/student/my-learning/my-learning.component';
import { MyCertificatesComponent } from './features/student/my-certificates/my-certificates.component';
import { PaymentSuccessComponent } from './features/payments/payment-success/payment-success.component';
import { PurchaseHistoryComponent } from './features/student/purchase-history/purchase-history.component';
import { AdminFinanceComponent } from './features/admin/admin-finance/admin-finance.component';

export const routes: Routes = [
    // --- ROUTES PUBLIQUES ---
    { path: '', component: HomeComponent },
    { path: 'courses', component: CourseListComponent },
    { path: 'courses/:id', component: CourseDetailComponent },
    { path: 'student/home', component: StudentHomeComponent },


    // --- ROUTES D'AUTHENTIFICATION ---
    { path: 'login', component: LoginComponent },
    { path: 'register', redirectTo: '/login', pathMatch: 'full' },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'verify-email', component: VerifyEmailComponent },
    { path: 'instructor-register', component: InstructorRegisterComponent },

    // --- DASHBOARD ET PROFIL ---
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'user/profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'instructor/profile', component: ProfileComponent, canActivate: [authGuard] },

    //routes for the students

    {
        path: 'student/live-sessions',
        component: StudentLiveSessionsComponent,
        canActivate: [authGuard]
    },
    {
        path: 'student/purchases',
        component: PurchaseHistoryComponent,
        canActivate: [authGuard]
    },

    {
        path: 'payment/success',
        component: PaymentSuccessComponent,
        canActivate: [authGuard]
    },
    // SALLE DE CLASSE (PLAYER & QUIZ ÉTUDIANT) ---
    {
        path: 'player/:id',
        component: CoursePlayerComponent,
        canActivate: [authGuard]
    },
    {
        path: 'player/:id/quiz',
        component: StudentQuizComponent,
        canActivate: [authGuard]
    },
    {
        path: 'student/my-learning',
        component: MyLearningComponent,
        canActivate: [authGuard]
    },
    {
        path: 'student/my-certificates',
        component: MyCertificatesComponent,
        canActivate: [authGuard]
    },

    // --- ROUTES INSTRUCTEUR ---
    {
        path: 'instructor/onboarding',
        component: InstructorOnboardingComponent,
        canActivate: [authGuard]
    },
    {
        path: 'instructor/courses',
        component: InstructorCoursesComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },
    {
        path: 'instructor/students',
        component: InstructorStudentsComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },
    {
        path: 'instructor/earnings',
        component: InstructorEarningsComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },
    {
        path: 'instructor/courses/new',
        component: CourseCreateComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },
    {
        path: 'instructor/courses/:id/edit',
        component: CourseEditorShellComponent,
        canActivate: [authGuard, instructorApprovedGuard],
        children: [
            { path: 'basic', component: CourseEditBasicComponent },
            { path: 'curriculum', component: CourseCurriculumComponent },
            { path: 'pricing', component: CoursePricingComponent },
            { path: 'quiz', component: CourseQuizComponent },
            { path: 'preview', component: CourseEditPreviewComponent },
            { path: '', redirectTo: 'basic', pathMatch: 'full' }
        ]
    },
    {
        path: 'instructor/live-sessions/create',
        component: LiveSessionCreateComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },
    {
        path: 'live-session/:id',
        component: LiveSessionRoomComponent,
        canActivate: [authGuard]
    },
    {
        path: 'instructor/live-sessions',
        component: InstructorLiveSessionsComponent,
        canActivate: [authGuard, instructorApprovedGuard]
    },


    // --- ROUTES ADMINISTRATION ---
    // Ajout du authGuard sur l'administration pour verrouiller l'accès
    { path: 'dashboard/users', component: AdminUsersComponent, canActivate: [authGuard] },
    { path: 'dashboard/videos', component: AdminCoursesComponent, canActivate: [authGuard] },
    { path: 'dashboard/instructors', component: AdminInstructorsComponent, canActivate: [authGuard] },
    { path: 'dashboard/categories', component: AdminCategoriesComponent, canActivate: [authGuard] },
    { path: 'dashboard/analytics', component: AdminAnalyticsComponent, canActivate: [authGuard] },
    { path: 'dashboard/payments', component: AdminPaymentsComponent, canActivate: [authGuard] },
    { path: 'admin/categories', component: AdminCategoriesComponent, canActivate: [authGuard] },
    { path: 'admin/courses', component: AdminCoursesComponent, canActivate: [authGuard] },
    { path: 'admin/instructors', component: AdminInstructorsComponent, canActivate: [authGuard] },
    {
        path: 'admin/instructors/:id',
        component: AdminInstructorProfileComponent
    },
    { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard] },
    { path: 'admin/users/:id', component: AdminStudentProfileComponent, canActivate: [authGuard] },
    { path: 'admin/finance', component: AdminFinanceComponent, canActivate: [authGuard] },
    // --- FALLBACK (Page 404) ---
    { path: '**', redirectTo: '' }
];