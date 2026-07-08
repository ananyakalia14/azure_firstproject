# Azure StudyMate AI

Azure StudyMate AI is a production-grade, AI-powered study platform designed for students who want to turn notes into clear summaries, flashcards, quizzes, and measurable progress insights. The platform is built with a cloud-native Azure architecture and is structured for scalability, maintainability, and future extension.

## Overview

Students can upload documents and study assets, and the system will generate:

- AI summary
- Key points
- Flashcards
- Quiz questions
- Study dashboard
- Progress tracking

## Key Features

- Secure upload and validation workflow
- Azure AI-generated summaries and study materials
- Interactive dashboard for study planning
- Flashcards with animated review experience
- Quiz engine with scoring and explanations
- Production-minded documentation and deployment structure

## Architecture

The application is designed around a modular architecture:

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- Backend: Azure Functions (TypeScript)
- Data: Azure Cosmos DB
- Storage: Azure Blob Storage
- Hosting: Azure Static Web Apps
- AI: Azure OpenAI / Azure AI Foundry

## Folder Structure

- frontend/ — Next.js application and product UI
- backend/ — Azure Functions TypeScript service layer
- architecture/ — architecture documentation and diagrams
- docs/ — API, deployment, user, and developer documentation
- design/ — UI system and product design guidance
- research/ — Azure service evaluation notes

## Azure Services Used

- Azure Static Web Apps
- Azure Functions
- Azure Blob Storage
- Azure Cosmos DB
- Azure OpenAI / Azure AI Foundry
- Azure Entra ID (optional future integration)

## Installation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
```

## Environment Variables

Create environment variables for:

- AZURE_OPENAI_ENDPOINT
- AZURE_OPENAI_API_KEY
- AZURE_STORAGE_CONNECTION_STRING
- COSMOS_DB_CONNECTION_STRING
- AZURE_FUNCTIONS_ENVIRONMENT

## Deployment

The frontend is intended for deployment through Azure Static Web Apps with GitHub Actions. The backend APIs can be deployed independently as Azure Functions.

## Future Scope

- Azure Entra ID authentication
- Personalized study recommendations
- Multi-language support
- Analytics dashboards for educators and institutions

## License

This project is intended for educational and portfolio purposes.
