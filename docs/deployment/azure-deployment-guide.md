# StudyMate AI Azure Deployment Guide

This guide deploys:

- Frontend: Azure Static Web Apps
- Backend: Azure Functions v4, Node.js/TypeScript
- Storage: Azure Blob Storage
- Database: Azure Cosmos DB

## Repository Layout

```txt
azure-study-mate/       # TanStack Start frontend
backend-functions/      # Azure Functions backend
.github/workflows/      # GitHub Actions deployment pipelines
```

## Required Azure Resources

- Resource group
- Azure Static Web App
- Azure Function App, Node.js 20
- Azure Storage Account with the `study-notes` blob container
- Azure Cosmos DB account, database, and container
- Application Insights, recommended for the Function App

Recommended Cosmos DB defaults used by the app:

```txt
Database:  studymate
Container: study-notes
Partition key: /id
```

## Backend App Settings

Configure these in the Azure Function App under Configuration > Application settings.

```txt
FUNCTIONS_WORKER_RUNTIME=node
AzureWebJobsStorage=<storage-account-connection-string>
COSMOS_CONNECTION_STRING=<cosmos-db-connection-string>
COSMOS_DATABASE_NAME=studymate
COSMOS_CONTAINER_NAME=study-notes
WEBSITE_NODE_DEFAULT_VERSION=~20
APPLICATIONINSIGHTS_CONNECTION_STRING=<application-insights-connection-string>
```

Do not commit production connection strings to Git.

## Frontend Environment Variables

Configure this as a GitHub repository variable and as an Azure Static Web Apps application setting if needed:

```txt
VITE_API_BASE_URL=https://<function-app-name>.azurewebsites.net/api
```

For local frontend development, use:

```txt
VITE_API_BASE_URL=http://localhost:7071/api
```

## GitHub Secrets and Variables

Repository secrets:

```txt
AZURE_STATIC_WEB_APPS_API_TOKEN
AZURE_FUNCTIONAPP_PUBLISH_PROFILE
```

Repository variables:

```txt
AZURE_FUNCTIONAPP_NAME=<function-app-name>
VITE_API_BASE_URL=https://<function-app-name>.azurewebsites.net/api
```

How to get the values:

- Static Web Apps token: Azure Portal > Static Web App > Manage deployment token.
- Function publish profile: Azure Portal > Function App > Get publish profile.

## GitHub Actions

Frontend workflow:

```txt
.github/workflows/deploy-frontend-swa.yml
```

Backend workflow:

```txt
.github/workflows/deploy-backend-functions.yml
```

Both workflows run on pushes to `main` and can also be started manually with `workflow_dispatch`.

## Local Verification

Backend:

```powershell
cd backend-functions
npm.cmd install
npm.cmd run build
npm.cmd start
```

Frontend:

```powershell
cd azure-study-mate
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

## Manual Deployment Commands

Backend:

```powershell
cd backend-functions
npm.cmd install
npm.cmd run build
func azure functionapp publish <function-app-name>
```

Frontend:

```powershell
cd azure-study-mate
npm.cmd install
npm.cmd run build
```

Deploy `azure-study-mate/.output/public` to Azure Static Web Apps.

## Post-Deployment Checks

Backend health checks:

```txt
POST https://<function-app-name>.azurewebsites.net/api/UploadFile
POST https://<function-app-name>.azurewebsites.net/api/GenerateSummary
GET  https://<function-app-name>.azurewebsites.net/api/StudyState
```

Frontend check:

```txt
https://<static-web-app-name>.azurestaticapps.net
```

Upload a PDF under 10 MB and confirm:

- Blob is created in `study-notes`
- Cosmos document is created or updated
- Summary response returns successfully
- Frontend dashboard persists after refresh

## CORS

If the frontend calls the Function App directly, add the Static Web Apps URL to Function App CORS:

```txt
https://<static-web-app-name>.azurestaticapps.net
```

For local development, add:

```txt
http://localhost:5173
```

## Notes

- `local.settings.json` is for local development only and is not deployed by Azure Functions.
- `host.json` is deployed with the backend and controls Functions runtime behavior.
- The frontend build output used by Static Web Apps is `.output/public`.
