# The Simpsons Database

A local database application for managing and searching Simpsons episodes with transcription and semantic search capabilities.

## Architecture

This project uses a monorepo structure with TypeScript and Effect-ts for type-safe, functional programming patterns.

### Packages

- **`@simpsons-db/database`** - Database layer with repositories and schemas
- **`@simpsons-db/domain`** - Domain entities and business logic
- **`@simpsons-db/ai-services`** - AI-powered services for transcription and embeddings
- **`@simpsons-db/api`** - HTTP API server
- **`@simpsons-db/cli`** - Command-line interface

## Development

### Building

To build all packages in the monorepo:

```sh
pnpm build
```

### Testing

To test all packages in the monorepo:

```sh
pnpm test
```

### Type Checking

To run type checking across all packages:

```sh
pnpm type-check
```

## Coding Guidelines

### General Principles

- Prefer functional style whenever possible
- Prefer immutability over mutability
- Do not add superfluous comments - if the code explains itself, avoid comments
- Never use the `any` type in TypeScript
- Never use casts (`x as MyType`)
- Never use null assertions (`x!`)

### Effect-ts Patterns

#### Effect.gen Usage

Use the modern Effect.gen pattern without the deprecated `_` adaptor:

```typescript
// ✅ Correct: Modern Effect.gen pattern
const myEffect = Effect.gen(function* () {
  const value = yield* someEffect
  const result = yield* anotherEffect(value)
  return result
})

// ❌ Incorrect: Deprecated pattern with _ adaptor
const myEffect = Effect.gen(function* (_) {
  const value = yield* _(someEffect)
  const result = yield* _(anotherEffect(value))
  return result
})
```

#### Tagged Errors

Create tagged errors using `Data.TaggedError` for yieldable error types:

```typescript
// ✅ Correct: Tagged error with default message
class EpisodeNotFoundError extends Data.TaggedError("EpisodeNotFoundError")<{
  message: string
}> {}

// Usage in effects
const findEpisode = (id: string) =>
  Effect.gen(function* () {
    const episode = yield* getEpisodeFromDb(id)
    if (!episode) {
      return yield* new EpisodeNotFoundError({
        message: `Episode with ID '${id}' not found`
      })
    }
    return episode
  })

// ❌ Incorrect: Using Effect.fail with plain errors
if (!episode) {
  return yield * Effect.fail(new Error("Episode not found"))
}
```

#### Effect Services

Create services using the class-based service pattern:

```typescript
// ✅ Correct: Class-based service with Effect.Service
export class EpisodeService extends Effect.Service<EpisodeService>()(
  "EpisodeService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const repository = yield* EpisodeRepository

      const findById = (id: string) => repository.findById(id)
      const create = (data: CreateEpisodeData) => repository.create(data)

      return { findById, create } as const
    })
  }
) {}
```

#### Schema Defaults

Define both constructor and decoding defaults for Schema:

```typescript
// ✅ Correct: Schema with both constructor and decoding defaults
const EpisodeSchema = Schema.Struct({
  id: Schema.String,
  season: Schema.Number.pipe(
    Schema.withDefaults({
      constructor: () => 1,
      decoding: () => 1
    })
  ),
  processed: Schema.Boolean.pipe(
    Schema.withDefaults({
      constructor: () => false,
      decoding: () => false
    })
  )
})
```

#### Working with Redacted Values

Access redacted values using the Redacted namespace:

```typescript
// ✅ Correct: Reading redacted config values
const getApiKey = Effect.gen(function* () {
  const redactedKey = yield* Config.redacted("OPENAI_API_KEY")
  const apiKey = yield* Redacted.value(redactedKey)
  return apiKey
})
```

#### Testing HTTP Requests

Inject mock fetch for testing HTTP requests with effect-platform:

```typescript
// ✅ Correct: Mock fetch for testing
import { FetchHttpClient, HttpClient } from "@effect/platform"
import { Effect, Layer } from "effect"

const FetchTest = Layer.succeed(FetchHttpClient.Fetch, () =>
  Promise.resolve(new Response('{"success": true}', { status: 200 }))
)

const TestLayer = FetchHttpClient.layer.pipe(Layer.provide(FetchTest))

const testProgram = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient
  const response = yield* client.get("https://api.example.com/episodes")
  return yield* response.json
}).pipe(Effect.provide(TestLayer))
```

#### Effect Annotations

Add annotations to key effects for better observability:

```typescript
// ✅ Correct: Annotated effects
const processEpisode = (episodeId: string) =>
  Effect.gen(function* () {
    const episode = yield* findEpisode(episodeId)
    const transcription = yield* transcribeEpisode(episode)
    const embeddings = yield* generateEmbeddings(transcription)

    return yield* saveProcessedEpisode({ episode, transcription, embeddings })
  }).pipe(
    Effect.annotateSpan("processEpisode", { episodeId }),
    Effect.annotateLogs({ operation: "episode-processing", episodeId })
  )
```

### Domain Entity Construction

In repository layers, use domain entity smart constructors when transforming from known database shapes to domain entities:

```typescript
// ✅ Correct: Use smart constructors for known-to-known transformations
const toDomainEntity = (record: DatabaseRecord) =>
  DomainEntity.make({
    id: record.id,
    title: record.title,
    season: record.season,
    // ... other fields
  })

// ✅ Also correct: For complex transformations that might fail
const toDomainEntity = (record: DatabaseRecord) =>
  Effect.gen(function* () {
    const processedData = yield* processComplexField(record.rawData)
    return DomainEntity.make({
      id: record.id,
      processedData,
      // ... other fields
    })
  })

// ❌ Incorrect: Using Schema.decodeUnknown for known shapes
const toDomainEntity = (record: DatabaseRecord) =>
  Effect.gen(function* () {
    return yield* Schema.decodeUnknown(DomainEntity)({
      id: record.id,
      // ... other fields
    })
  })

// ❌ Incorrect: Direct constructor calls without validation
const toDomainEntity = (record: DatabaseRecord): DomainEntity =>
  new DomainEntity(record.id, record.field1, record.field2)
```

**Note:** Use `Schema.decodeUnknown` only when dealing with truly unknown data (e.g., external API responses, user input). Repositories work with known database schemas and should use smart constructors.
