# 10xCards.pl

A modern web application enabling fast, AI-powered generation and management of high-quality educational flashcards, integrated with a spaced-repetition system (SRS) and built with Astro, React, and Supabase.

## Table of Contents

1. [Project Description](#project-description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started](#getting-started)  
4. [Available Scripts](#available-scripts)  
5. [Project Scope](#project-scope)  
6. [Project Status & Metrics](#project-status--metrics)  
7. [License](#license)

## Project Description

10xCards empowers users to quickly create flashcards from arbitrary text (500–15,000 characters) via a large language model (LLM) API. Users can batch-generate up to 10 cards in JSON format, manually create, edit, or delete cards, and schedule reviews using an open-source SRS algorithm. The application also handles user authentication, GDPR compliance, and basic telemetry for AI-generated card acceptance.

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5  
- **Styling:** Tailwind CSS 4, Shadcn/ui  
- **Backend:** Supabase (PostgreSQL, Auth)  
- **AI Integration:** Openrouter.ai (OpenAI, Anthropic, Google models)  
- **Testing:**  
  - Unit & Integration: Vitest, React Testing Library, MSW (Mock Service Worker)  
  - E2E: Playwright, @axe-core/playwright  
  - Performance: Lighthouse CI  
- **CI/CD & Hosting:** GitHub Actions, Docker, DigitalOcean  

## Getting Started

### Prerequisites

- Node.js v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) if needed)  
- Git  
- A Supabase project and API keys  
- An Openrouter.ai API key  

### Local Setup

1. Clone the repository:  
   ```bash
   git clone https://github.com/PrzeFor/10xCards.git
   cd 10xCards
   ```
2. Install dependencies:  
   ```bash
   npm install
   ```
3. Copy and configure environment variables:  
   ```bash
   cp .env.example .env
   # Set SUPABASE_URL, SUPABASE_ANON_KEY, OPENROUTER_API_KEY, etc.
   ```
4. Start the development server:  
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`

## Available Scripts

- `npm run dev`  
  Start Astro development server.  
- `npm run build`  
  Build for production.  
- `npm run preview`  
  Preview production build locally.  
- `npm run lint`  
  Run ESLint.  
- `npm run lint:fix`  
  Run ESLint with auto-fix.  
- `npm run format`  
  Format code with Prettier.  
- `npm run test`  
  Run unit and integration tests (Vitest).  
- `npm run test:ui`  
  Run tests with Vitest UI.  
- `npm run test:coverage`  
  Run tests with coverage report.  
- `npm run test:e2e`  
  Run end-to-end tests (Playwright).  
- `npm run test:e2e:ui`  
  Run E2E tests with Playwright UI.  
- `npm run test:e2e:debug`  
  Debug E2E tests in Playwright.

## Project Scope

**Core Features (MVP):**
- Import text (500–15,000 chars) for AI flashcard generation  
- Batch generation of up to 10 cards (JSON)  
- Manual flashcard creation, editing, deletion (Front/Back, 500–1500 chars)  
- User registration, login, and JWT/session-based auth  
- SRS algorithm integration for spaced repetition  
- Flashcard review sessions with difficulty rating  
- Telemetry: track Generated, Accepted, Edited, Rejected events  
- GDPR compliance: data export, account & data deletion

**Excluded in MVP:**
- PDF/DOCX import  
- Sharing flashcard sets between users  
- Email verification  
- Advanced tagging/folders  
- Mobile app

## Project Status & Metrics

- **Status:** 🚧 In development (MVP phase)  
- **Success Metrics:**  
  - ≥75% acceptance rate for AI-generated cards  
  - ≥75% overall card acceptance (AI-generated & manual)  
- **Telemetry:** Generated, Accepted, Edited, Rejected events collected

## License

This project is licensed under the MIT License.  
<!-- Replace with your preferred license and link -->
