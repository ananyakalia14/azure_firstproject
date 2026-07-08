# Deployment Guide

## Deployment Targets

- Frontend: Azure Static Web Apps
- Backend: Azure Functions
- Storage: Azure Blob Storage
- Database: Azure Cosmos DB
- AI: Azure OpenAI or Azure AI Foundry

## Recommended Workflow

1. Provision Azure resources for storage, Cosmos DB, and Azure OpenAI.
2. Configure GitHub Actions secrets for deployment credentials.
3. Deploy the frontend to Static Web Apps.
4. Deploy the backend functions to Azure Functions.
5. Validate environment variables and CORS settings.

## Production Considerations

- Enable managed identity where possible.
- Use key vault for secrets.
- Set up monitoring and alerts.
- Configure private networking for sensitive components.
