# API Documentation

## Overview

The API layer for Azure StudyMate AI will expose endpoints for upload, processing, summary generation, flashcard generation, and quiz generation.

## Planned Endpoints

- POST /api/upload — upload a study file
- POST /api/summary — generate a summary from content
- POST /api/flashcards — create flashcards
- POST /api/quiz — generate quiz questions
- GET /api/history — retrieve prior study sessions

## Error Handling

The API should return structured responses for:

- validation failures
- storage failures
- AI service failures
- network issues
- unauthorized or forbidden requests
