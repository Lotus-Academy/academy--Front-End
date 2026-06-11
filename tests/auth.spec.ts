declare const process: any;
import { test, expect } from '@playwright/test';

test.describe('Authentification - Lotus Academy', () => {

    // Ce bloc s'exécute avant chaque test pour s'assurer qu'on part d'une page propre
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4200/login');
        // On attend que les éventuels chargements de ressources (ex: i18n) soient stabilisés
        await page.waitForLoadState('networkidle');
    });

    test('Échec : Devrait afficher un message d erreur avec de faux identifiants', async ({ page }) => {
        // 1. Remplir les champs avec des identifiants invalides
        await page.locator('input[formControlName="email"]').fill('fake-student@lotus.academy');
        await page.locator('input[formControlName="password"]').fill('WrongPassword123');

        // 2. Soumettre le formulaire en cliquant sur le bouton de connexion
        await page.locator('button[type="submit"]').click();

        // 3. Vérifier qu'un message d'erreur s'affiche dans le conteneur prévu à cet effet
        // Ton composant utilise la variable errorMessage() qui affiche une div avec la classe '.bg-red-50'
        const errorBanner = page.locator('div.bg-red-50, div.dark\\:bg-red-900\\/10');
        await expect(errorBanner).toBeVisible({ timeout: 5000 });

        // 4. S'assurer que nous n'avons pas quitté la page de login
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Succès : Devrait se connecter avec un compte valide et rediriger vers le Dashboard', async ({ page }) => {
        // 1. Saisir de vrais identifiants (Modifie ces valeurs si nécessaire selon ta DB locale)
        const email = process.env.TEST_STUDENT_EMAIL || 'yourstudent@blabla.com';
        const password = process.env.TEST_STUDENT_PASSWORD || 'yourpassword1234';
        await page.locator('input[formControlName="email"]').fill(email);
        await page.locator('input[formControlName="password"]').fill(password);

        // 2. Cliquer sur le bouton de soumission (qui passe en état de chargement avec ton loader)
        await page.locator('button[type="submit"]').click();

        // 3. Vérifier que la redirection vers le dashboard s'effectue avec succès
        // Playwright attendra automatiquement (jusqu'à 5s par défaut) que l'URL change après le retour de l'API
        await expect(page).toHaveURL(/.*\/dashboard/);
    });
});