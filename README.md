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

### Domain Entity Construction

When working with domain entities in repository layers, always use Effect's schema decoding to ensure type safety:

```typescript
// ✅ Correct: Use Schema.decodeUnknown for entity construction
const toDomainEntity = (record: DatabaseRecord): Effect.Effect<DomainEntity, ParseResult.ParseError, never> =>
  Effect.gen(function*() {
    const id = yield* Schema.decodeUnknown(EntityId)(record.id)
    return yield* Schema.decodeUnknown(DomainEntity)({
      id,
      // ... other fields
    })
  })

// ❌ Incorrect: Direct constructor calls without validation
const toDomainEntity = (record: DatabaseRecord): DomainEntity => 
  new DomainEntity(record.id, record.field1, record.field2)
```

### Error Handling

Use custom error classes with Effect.fail for consistent error handling:

```typescript
// ✅ Correct: Custom error classes with Effect.fail
if (!result[0]) {
  return yield* Effect.fail(new NotFoundError({ entity: "Episode", id }))
}

// ❌ Incorrect: Throwing errors directly
if (!result[0]) {
  throw new Error("Episode not found")
}
```

### Effect Services

Create services using the class-based service pattern:

```typescript
// ✅ Correct: Class-based service with Effect.Service
export class MyService extends Effect.Service<MyService>()("MyService", {
  accessors: true,
  effect: Effect.gen(function*() {
    // service implementation
    return { method1, method2 } as const
  })
}) {}
```
