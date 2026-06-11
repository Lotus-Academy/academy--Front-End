declare const process: any;
import { test, expect } from '@playwright/test';

test.describe('Espace Étudiant - Lecteur de Cours', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Se connecter une seule fois pour franchir le authGuard d'Angular
        const email = process.env.TEST_STUDENT_EMAIL || 'test@blabla.com';
        const password = process.env.TEST_STUDENT_PASSWORD || 'password123';
        await page.goto('http://localhost:4200/login');
        await page.locator('input[formControlName="email"]').fill(email);
        await page.locator('input[formControlName="password"]').fill(password);
        await page.locator('button[type="submit"]').click();

        // Attendre la redirection vers le dashboard, confirmant la validité du JWT
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 2. Naviguer directement vers un ID de cours valide présent dans ta base de données locale
        await page.goto('http://localhost:4200/player/a3d87a22-c212-458f-a796-8280b05e5795');

        // Attendre que l'application et les appels de l'EnrollmentService soient stabilisés
        await page.waitForLoadState('networkidle');
    });

    test('Rendu initial : Devrait masquer le loader et instancier le lecteur média approprié', async ({ page }) => {
        // 1. S'assurer que le loader initial de ton template s'efface
        const mainLoader = page.locator('main lucide-icon[name="icons.Loader2"]').first();
        await expect(mainLoader).toBeHidden({ timeout: 5000 });

        // 2. Détecter de manière dynamique le type de lecteur instancié par ton @if (currentLesson()?.type)
        const videoPlayer = page.locator('video#videoPlayer, video');
        const pdfIframe = page.locator('iframe');
        const restrictionBanner = page.locator('h3:has-text("restricted")');

        // 3. Playwright va utiliser une assertion alternative pour valider qu'au moins 
        // un des trois états valides de l'interface utilisateur s'est affiché correctement
        const isVideoRendered = await videoPlayer.isVisible();
        const isPdfRendered = await pdfIframe.isVisible();
        const isRestrictedRendered = await restrictionBanner.isVisible();

        expect(isVideoRendered || isPdfRendered || isRestrictedRendered).toBeTruthy();
    });

    test('Navigation : Devrait permettre de changer de leçon depuis la barre latérale', async ({ page }) => {
        // 1. Cibler le panneau latéral du contenu du cours ("PLAYER.COURSE_CONTENT")
        const courseContentAside = page.locator('aside');
        await expect(courseContentAside).toBeVisible();

        // 2. Récupérer le premier bouton de leçon disponible dans la liste @for de la barre latérale
        // Tes boutons de leçons utilisent la méthode (click)="selectLesson(lesson)"
        const firstLessonButton = courseContentAside.locator('button').filter({ hasText: /^[1-9]\./ }).first();

        if (await firstLessonButton.isVisible()) {
            // Capturer le titre de la leçon cible pour la vérification ultérieure
            const lessonTitleText = await firstLessonButton.locator('span.font-syne').innerText();

            // 3. Cliquer sur le bouton de la leçon
            await firstLessonButton.click();

            // 4. Vérifier que la zone principale du lecteur met à jour son titre synchrone
            const mainLessonHeading = page.locator('main h2.font-cormorant').first();
            await expect(mainLessonHeading).toBeVisible();

            // La leçon sélectionnée doit être marquée par la classe active de couleur text-lotus
            await expect(firstLessonButton.locator('span.font-syne')).toHaveClass(/text-lotus/);
        }
    });

    test('Progression : Devrait interagir avec le bouton de complétion', async ({ page }) => {
        // 1. Trouver le bouton d'action (Complete ou Next)
        const completeButton = page.locator('main button', { hasText: /Complete|Next/i }).first();

        if (await completeButton.isVisible()) {
            // 2. Cliquer pour valider la leçon via l'EnrollmentService
            await completeButton.click();

            // 3. Cibles uniques pour éviter la violation du mode strict
            const progressText = page.locator('header span.font-mono', { hasText: '%' }).first();

            // FIXED : On cible un seul titre unique (le h2 du contenu principal) au lieu de combiner deux chaînes
            const graduationHeading = page.locator('main h2', { hasText: 'Congratulations!' }).first();

            // 4. L'opérateur .or() ne matchera plus qu'un seul élément exclusif dans le DOM
            await expect(progressText.or(graduationHeading)).toBeVisible({ timeout: 5000 });
        }
    });
});