# @simpsons-db/api

A type-safe API definition package for The Simpsons Database using Effect Platform's HttpApi.

## Features

- **Type-safe API definition** using Effect Platform HttpApi
- **Automatic client generation** with full type safety
- **OpenAPI documentation** generation
- **Shared schemas** between frontend and backend
- **Tagged error handling** with proper error types

## API Structure

### Health Endpoints
- `GET /api/health` - Health check

### Episode Endpoints
- `GET /api/episodes` - List episodes with pagination and filters
- `GET /api/episodes/:id` - Get episode by ID
- `POST /api/episodes` - Create new episode
- `DELETE /api/episodes/:id` - Delete episode
- `GET /api/episodes/pending` - Get pending episodes
- `POST /api/episodes/:id/process` - Process episode

### Search Endpoints
- `GET /api/search` - Search transcriptions
- `POST /api/search/similarity` - Similarity search

## Usage

### Client Generation

```typescript
import { HttpApiClient } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"

const client = HttpApiClient.make(SimpsonsDbApi, {
  baseUrl: "http://localhost:3001"
})

// Type-safe API calls
const episodes = await client.episodes.getEpisodes({
  urlParams: { page: 1, limit: 10 }
})
```

### Server Implementation

```typescript
import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"

const EpisodesGroupLive = HttpApiBuilder.group(SimpsonsDbApi, "Episodes", (handlers) =>
  handlers
    .handle("getEpisodes", ({ urlParams }) => {
      // Implementation
      return Effect.succeed(response)
    })
)
```

## Extending the API

### 1. Add New Schemas

Add schemas to `src/schemas.ts`:

```typescript
export const NewFeatureRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String)
})

export const NewFeatureResponse = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String,
  createdAt: Schema.DateTimeUtc
})
```

### 2. Define Endpoints

Add endpoints to `src/endpoints.ts`:

```typescript
export const createNewFeature = HttpApiEndpoint
  .post("createNewFeature", "/features")
  .setPayload(NewFeatureRequest)
  .addSuccess(NewFeatureResponse, { status: 201 })
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })
```

### 3. Create Groups

Add groups to `src/groups.ts`:

```typescript
export const FeaturesGroup = HttpApiGroup
  .make("Features")
  .add(createNewFeature)
  .add(getFeatures)
```

### 4. Update API Definition

Add to `src/api.ts`:

```typescript
export const SimpsonsDbApi = HttpApi.make("SimpsonsDbApi")
  .add(HealthGroup)
  .add(EpisodesGroup)
  .add(SearchGroup)
  .add(FeaturesGroup) // Add new group
  .prefix("/api")
```

### 5. Implement Server Handlers

Create implementation in server package:

```typescript
export const FeaturesGroupLive = HttpApiBuilder.group(SimpsonsDbApi, "Features", (handlers) =>
  handlers
    .handle("createNewFeature", ({ payload }) => {
      // Implementation logic
      return Effect.succeed(response)
    })
)
```

## Error Handling

All errors use `Schema.TaggedError` for proper type safety:

```typescript
export class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    message: Schema.String,
    errors: Schema.optional(Schema.Array(Schema.String))
  }
) {}
```

## Building

```bash
pnpm build
```

This generates TypeScript definitions that can be imported by both frontend and backend packages.
