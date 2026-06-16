# FrontendLotusAcademyAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4. It serves as the client-side application for **Lotus Academy**, a scalable and modern Learning Management System (LMS) platform.

---

## Project Architecture

The application implements a strict **Feature-First** (Domain-Driven) layout to ensure decoupled modules and solid maintainability across different user spaces:

- **`src/app/core/`** — Implements the immutable infrastructure of the application. Includes strictly typed DTO models, routing guards, HTTP interceptors for seamless JWT token rotation, and global services.
- **`src/app/features/`** — Contains domain-specific, isolated business modules loaded via *Lazy Loading* (`admin/`, `instructor/`, `student/`, `auth/`).
- **`src/app/shared/`** — Contains highly reusable UI components (e.g., custom cards, layout shells) and directives shared across multiple features.

---

## Local Configuration & Environment Variables

The client-side application uses environment variables to sign in test users and target the backend Spring Boot API.

1. Create a `.env` file at the root of your project directory.
2. Add the following required variables:

```env
TEST_STUDENT_EMAIL=your_test_student@example.com
TEST_STUDENT_PASSWORD=your_secure_test_password
```

> **Note:** The `.env` file is declared in `.gitignore` and must **never** be pushed to remote source control.

---

## Development Server

Start a local development server with:

```bash
ng serve
```

Once running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload on any source file change.

---

## Code Scaffolding

Generate a new component with:

```bash
ng generate component component-name
```

List all available schematics (components, directives, pipes, etc.):

```bash
ng generate --help
```

---

## Building

Build the project for production with:

```bash
ng build --configuration=production
```

Artifacts are stored in the `dist/` directory. The production build optimizes for performance, payload minimization, and execution speed.

---

## Running Unit Tests

Execute unit tests with the Vitest test runner:

```bash
ng test
```

---

## Running End-to-End Tests

End-to-end testing relies on [Playwright](https://playwright.dev/) to validate full user journeys and core features:

```bash
npx playwright test
```

---

## 🔒 Forking & GitHub Actions CI/CD

This repository includes a pre-configured CI workflow (`.github/workflows/playwright.yml`) that triggers on every `push` and `pull_request` targeting the `main` or `master` branches.

If you fork this repository, Playwright steps will fail due to missing credentials. To fix this:

1. Go to **Settings > Secrets and variables > Actions** in your forked repository.
2. Click **New repository secret** and add the following:

| Secret name             | Value                                              |
|-------------------------|----------------------------------------------------|
| `TEST_STUDENT_EMAIL`    | Email of the student account in your test database |
| `TEST_STUDENT_PASSWORD` | Password for that test student account             |

Once set, your CI builds will pass successfully.

---

## Additional Resources

For more information on Angular CLI commands and usage, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
