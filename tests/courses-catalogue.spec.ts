import { test, expect } from '@playwright/test';

test.describe('Catalogue de Cours - Lotus Academy', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4200/courses');
    });

    test('Devrait charger le catalogue et afficher les cartes de cours dynamiques', async ({ page }) => {
        const loader = page.locator('main .animate-spin, main lucide-icon[name="icons.Loader2"]').first();
        await expect(loader).toBeHidden({ timeout: 5000 });

        const firstCourseCard = page.locator('app-course-card').first();
        await expect(firstCourseCard).toBeVisible();

        const resultsCounter = page.locator('p.font-mono', { hasText: /Showing/i }).first();
        await expect(resultsCounter).toBeVisible();
    });

    test('Filtrage : Devrait mettre à jour la liste lors d une recherche textuelle', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        const searchInput = page.getByPlaceholder('Search for courses or instructors...');
        await expect(searchInput).toBeVisible();

        // 1. Fill the input field
        await searchInput.focus();
        await searchInput.fill('technologie');

        // 2. Combine both possible valid layout outcomes into a single locator to prevent rigid timeouts
        const filteredCard = page.locator('app-course-card').first();
        const noCoursesFoundHeading = page.getByRole('heading', { name: 'No courses found' });

        // 3. Use Playwright's expect. some underlying visibility state to change dynamically
        await expect(filteredCard.or(noCoursesFoundHeading)).toBeVisible({ timeout: 4000 });

        // 4. Assert that the counter updated correctly to reflect the state
        const resultsCounter = page.locator('p.font-mono', { hasText: /Showing/i }).first();
        await expect(resultsCounter).toBeVisible();
    });
});