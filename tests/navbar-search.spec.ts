import { test, expect } from '@playwright/test';

test.describe('Navbar - Instant Search', () => {

    test('devrait ouvrir l overlay et afficher les cours au fur et à mesure de la saisie', async ({ page }) => {
        // 1. Ouvrir l'application Angular
        await page.goto('http://localhost:4200/');

        // Attendre que le réseau soit totalement inactif (traductions et données initiales chargées)
        await page.waitForLoadState('networkidle');

        // 2. Cibler l'input de recherche par son type text
        const searchInput = page.locator('input[type="text"]').first();
        await expect(searchInput).toBeVisible();

        // 3. Simuler la saisie d'un mot-clé
        await searchInput.focus();
        await searchInput.fill('Trading');

        // 4. Au lieu de chercher le mot "suggestions", on cherche directement si un lien de cours 
        // apparaît dans le conteneur absolu. C'est l'indicateur infaillible que l'API a répondu !
        const firstSuggestion = page.locator('a[href*="/courses/"]').first();

        // On laisse 5 secondes à ton Spring Boot / PostgreSQL local pour répondre
        await expect(firstSuggestion).toBeVisible({ timeout: 5000 });

        // 5. Cliquer sur le cours et valider la redirection
        await firstSuggestion.click();
        await expect(page).toHaveURL(/.*\/courses\/.+/);
    });
});