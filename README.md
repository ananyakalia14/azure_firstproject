# StudyMate AI

**Study Smarter. Learn Faster. Powered by AI.**

Upload PDF notes and get an AI-generated summary, flashcards, and quiz — with progress
tracking, all wrapped in a production-quality UX. Designed for Azure; running today on
the Lovable/TanStack Start stack with a service layer that swaps in Azure Functions,
Cosmos DB, Blob Storage, and Azure OpenAI without touching UI code.

---

## Features

- Landing page (hero, features, how-it-works, tech stack, testimonials, CTA)
- Dashboard with recent notes, mastery ring, quick actions, activity feed
- Drag-and-drop PDF upload with client-side text extraction (pdfjs)
- AI summary with copy / download / regenerate
- Flashcards with flip animation, keyboard nav, shuffle, progress
- Quiz with MCQs, timer, per-question explanation, retry, score tracking
- Study history table with best score per note
- Settings: profile scaffold, theme toggle, Azure connection status, danger zone

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    React 19 + TanStack Start            │
│  Routes  ──►  Hooks  ──►  Services (interface)          │
│                                 │                       │
│                      ┌──────────┼──────────┐            │
│                      ▼          ▼          ▼            │
│                 aiService  blobStorage   cosmos         │
│                      │          │          │            │
│  local  ── in-memory + localStorage stubs (v1)          │
│  azure  ── Azure Functions, Blob, Cosmos, OpenAI (v2)   │
└────────────────────────────────────────────────────────┘
```

Every consumer imports the *interface*, never a concrete implementation. Flipping the
factory at the bottom of each service file switches the whole app to Azure.

## Tech stack

React 19 · TypeScript (strict) · TanStack Start / Router · Tailwind CSS v4 · shadcn/ui ·
Framer Motion · Lucide · Zod · pdfjs-dist · Sonner.

Azure targets (v2): Static Web Apps · Functions (TypeScript) · Cosmos DB · Blob Storage ·
Azure OpenAI / AI Foundry · Entra ID · GitHub Actions.

## Folder structure

```
src/
  components/
    landing/    Hero, Features, HowItWorks, TechStack, Testimonials, CTA, LandingChrome
    layout/     AppSidebar, AppTopbar
    study/      UploadDropzone, Flashcard, QuizCard, ProgressRing, EmptyState
    ui/         shadcn primitives
  contexts/     ThemeContext, StudyContext
  hooks/        useUpload
  lib/          utils, pdf
  services/     aiService, blobStorage, cosmos, authService
  types/        domain types
  constants/    app config
  routes/       TanStack file-based routes
  styles.css    design tokens + fonts
```

## Environment variables (Azure v2)

| Variable                          | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `VITE_AZURE_FUNCTIONS_BASE_URL`   | Base URL of the deployed Functions app     |
| `AZURE_OPENAI_ENDPOINT`           | Azure OpenAI resource endpoint             |
| `AZURE_OPENAI_API_KEY`            | OpenAI key (server-side only)              |
| `AZURE_COSMOS_ENDPOINT`           | Cosmos account endpoint                    |
| `AZURE_COSMOS_KEY`                | Cosmos key (server-side only)              |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage connection string             |
| `AZURE_TENANT_ID` / `CLIENT_ID`   | Entra ID for Static Web App authentication |

## Local development

```bash
bun install
bun dev
```

## Swapping to Azure

1. Implement `createAzureAIService` in `src/services/aiService.ts`.
2. Implement `createAzureBlobStorage` in `src/services/blobStorage.ts`.
3. Implement `createAzureCosmos` in `src/services/cosmos.ts`.
4. Change the exported factory in each file to the azure variant.
5. Enable Entra ID in `authService`.

No components or routes need to change.

## Deployment

Ship to Azure Static Web Apps via GitHub Actions:
`azure/static-web-apps-deploy@v1` with `app_location: "."`, `api_location: "api"`,
`output_location: "dist"`.

## Future scope

- Multi-user auth via Entra ID
- Server-side PDF processing with `pdf-parse` in an Azure Function
- Spaced-repetition scheduling for flashcards
- Collaborative study sets

## License

MIT
