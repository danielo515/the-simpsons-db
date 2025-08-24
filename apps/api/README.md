# Simpsons DB API Server

The main API server application for The Simpsons Database project.

## Overview

This is a standalone server application built with Effect-ts and @effect/platform that provides REST API endpoints for managing episodes, transcriptions, and search functionality.

## Architecture

- **Framework**: Effect-ts with @effect/platform HTTP API
- **Type Safety**: Full TypeScript with Effect schemas
- **Dependencies**: Uses workspace packages for domain logic, database, and AI services

## API Endpoints

### Health

- `GET /health` - Health check endpoint

### Episodes

- `GET /episodes` - List episodes with pagination and filtering
- `GET /episodes/:id` - Get episode by ID
- `POST /episodes` - Create new episode
- `DELETE /episodes/:id` - Delete episode
- `GET /episodes/pending` - Get episodes pending processing
- `POST /episodes/:id/process` - Process episode

### Search

- `GET /search/transcriptions` - Search transcriptions by text
- `POST /search/similarity` - Semantic similarity search

## Development

### Start Development Server

```bash
pnpm dev:api
```

### Build

```bash
pnpm --filter @simpsons-db/app-api build
```

### Start Production Server

```bash
pnpm --filter @simpsons-db/app-api start
```

## Configuration

The server runs on port 3000 by default. This can be configured in `src/index.ts`.

## Dependencies

This application depends on the following workspace packages:

- `@simpsons-db/api` - API schemas and definitions
- `@simpsons-db/database` - Database layer and schemas
- `@simpsons-db/domain` - Domain entities and services
- `@simpsons-db/shared` - Shared utilities and types
- `@simpsons-db/ai-services` - AI and ML services
- `@simpsons-db/video-processor` - Video processing utilities

## Mock Implementation

Currently uses mock data for testing. The implementation files in `src/implementations/` provide mock responses that match the API schemas for development and testing purposes.
