# Effect Drizzle Integration Guide

This comprehensive guide explains how to properly use Effect with Drizzle ORM integration, based on the latest Effect documentation and best practices.

## Overview

Effect provides powerful SQL integration through the `@effect/sql` ecosystem, with specific support for Drizzle ORM via `@effect/sql-drizzle-pg`. This integration combines Effect's type-safe, composable approach with Drizzle's excellent TypeScript-first ORM capabilities.

## Core Packages

- **`@effect/sql`** - Core SQL client and utilities
- **`@effect/sql-pg`** - PostgreSQL client implementation
- **`@effect/sql-drizzle`** - Drizzle ORM integration package
- **`drizzle-orm`** - Drizzle ORM core package

## Basic Setup

### 1. Database Layer Configuration

```typescript
import { PgClient } from "@effect/sql-pg"
import { Config, Layer } from "effect"

// Basic configuration
export const SqlLive = PgClient.layer({
  database: "your_database_name",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password"
})

// Configuration with Effect Config
export const SqlConfigLive = PgClient.layerConfig({
  database: Config.string("DATABASE_NAME"),
  host: Config.string("DATABASE_HOST").pipe(Config.withDefault("localhost")),
  port: Config.integer("DATABASE_PORT").pipe(Config.withDefault(5432)),
  username: Config.string("DATABASE_USER"),
  password: Config.redacted("DATABASE_PASSWORD")
})
```

### 2. Drizzle Schema Definition

```typescript
// schemas/users.ts
import * as D from "drizzle-orm/pg-core"

export const users = D.pgTable("users", {
  id: D.serial("id").primaryKey(),
  name: D.text("name").notNull(),
  email: D.text("email").notNull(),
  createdAt: D.timestamp("created_at").defaultNow().notNull(),
  updatedAt: D.timestamp("updated_at").defaultNow().notNull()
})

export const episodes = D.pgTable("episodes", {
  id: D.serial("id").primaryKey(),
  title: D.text("title").notNull(),
  season: D.integer("season").notNull(),
  episode: D.integer("episode").notNull(),
  filePath: D.text("file_path").notNull()
})

// Export schema for Drizzle integration
export const schema = { users, episodes }

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Episode = typeof episodes.$inferSelect
export type NewEpisode = typeof episodes.$inferInsert
```

### 3. Effect Schema Integration

```typescript
import { Schema } from "effect"
import type { User, NewUser } from "./schemas/users"

// Effect Schema for validation and transformation
export class UserSchema extends Schema.Class<UserSchema>("User")({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
}) {}

export const CreateUserSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
})

export type CreateUserRequest = typeof CreateUserSchema.Type
```

## Drizzle Integration Setup

### Creating the Drizzle Service

```typescript
import { Effect, Layer } from "effect"
import * as Pg from "@effect/sql-drizzle/Pg"
import { schema } from "./schemas"

// Create ORM service with schema
export class ORM extends Effect.Service<ORM>()("ORM", {
  effect: Pg.make({ schema })
}) {
  static Client = this.Default.pipe(Layer.provideMerge(SqlLive))
}
```

## Service Layer Pattern

### Repository Service with Drizzle Integration

```typescript
import { Effect, Schema } from "effect"
import { SqlClient } from "@effect/sql"
import * as Pg from "@effect/sql-drizzle/Pg"
import { eq } from "drizzle-orm"
import { users, episodes } from "./schemas"

export class UserRepository extends Effect.Service<UserRepository>()(
  "UserRepository",
  {
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const db = yield* Pg.PgDrizzle

      // Using raw SQL with Effect SQL client
      const findAllRaw = () =>
        sql<User[]>`SELECT * FROM users ORDER BY created_at DESC`

      // Using Drizzle query builder (returns Effect)
      const findAll = () => db.select().from(users).orderBy(users.createdAt)

      const findById = (id: number) =>
        db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .then(
            (results) =>
              results[0] ?? Effect.fail(new UserNotFoundError({ id }))
          )

      // Using Drizzle with query API (when schema is provided)
      const findByIdWithQuery = (id: number) =>
        db.query.users.findFirst({
          where: eq(users.id, id)
        })

      const findByEmail = (email: string) =>
        db.select().from(users).where(eq(users.email, email))

      const create = (userData: NewUser) =>
        db.insert(users).values(userData).returning()

      const update = (id: number, updates: Partial<NewUser>) =>
        db
          .update(users)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning()

      const deleteUser = (id: number) =>
        db.delete(users).where(eq(users.id, id))

      return {
        findAll,
        findAllRaw,
        findById,
        findByIdWithQuery,
        findByEmail,
        create,
        update,
        deleteUser
      } as const
    }),
    dependencies: [SqlLive, Pg.PgDrizzle.Default]
  }
) {}

// Alternative: Using ORM service directly
export class UserService extends Effect.Service<UserService>()("UserService", {
  effect: Effect.gen(function* () {
    const db = yield* ORM

    const findAll = () =>
      db.query.users.findMany({
        orderBy: users.createdAt
      })

    const findById = (id: number) =>
      db.query.users.findFirst({
        where: eq(users.id, id)
      })

    const create = (userData: NewUser) =>
      db.insert(users).values(userData).returning()

    return { findAll, findById, create } as const
  }),
  dependencies: [ORM.Default]
}) {}

// Custom error types
export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  {
    id: Schema.Number
  }
) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
  "DatabaseError",
  {
    cause: Schema.Unknown
  }
) {}
```

### Advanced Patterns with Relations

```typescript
// Enhanced schema with relations
import { relations } from "drizzle-orm"

export const userRelations = relations(users, ({ many }) => ({
  episodes: many(episodes)
}))

export const episodeRelations = relations(episodes, ({ one }) => ({
  user: one(users, {
    fields: [episodes.id],
    references: [users.id]
  })
}))

// Updated schema export
export const schema = {
  users,
  episodes,
  userRelations,
  episodeRelations
}

// Repository with relations
export class EpisodeRepository extends Effect.Service<EpisodeRepository>()(
  "EpisodeRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* ORM

      const findEpisodesWithUsers = () =>
        db.query.episodes.findMany({
          with: {
            user: true
          }
        })

      const findUserWithEpisodes = (userId: number) =>
        db.query.users.findFirst({
          where: eq(users.id, userId),
          with: {
            episodes: true
          }
        })

      return {
        findEpisodesWithUsers,
        findUserWithEpisodes
      } as const
    }),
    dependencies: [ORM.Default]
  }
) {}
```

## Migration Management

### Migration Runner

```typescript
import { Effect, Layer } from "effect"
import { PgMigrator } from "@effect/sql-pg"
import { fileURLToPath } from "node:url"

const MigratorLive = PgMigrator.layer({
  loader: PgMigrator.fromFileSystem(
    fileURLToPath(new URL("migrations", import.meta.url))
  ),
  schemaDirectory: "src/migrations"
}).pipe(Layer.provide(SqlLive))

// Run migrations
const runMigrations = Effect.gen(function* () {
  const migrator = yield* PgMigrator.PgMigrator
  yield* migrator.run
  yield* Effect.log("Migrations completed successfully")
})

export const DatabaseLive = Layer.mergeAll(SqlLive, MigratorLive)
```

## Query Building Patterns

### Safe Query Construction

```typescript
export const makeUserQueries = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  // Safe parameter interpolation
  const findUsersByName = (name: string) =>
    sql<User>`SELECT * FROM users WHERE name = ${name}`

  // Identifier interpolation
  const findUsersByColumn = (column: keyof User, value: unknown) =>
    sql<User>`SELECT * FROM users WHERE ${sql(column)} = ${value}`

  // Unsafe interpolation (use carefully)
  const findUsersWithOrder = (
    orderBy: "name" | "created_at",
    direction: "ASC" | "DESC"
  ) =>
    sql<User>`SELECT * FROM users ORDER BY ${sql(orderBy)} ${sql.unsafe(
      direction
    )}`

  // Complex where clauses
  const findUsersWithFilters = (names: string[], afterDate: Date) =>
    sql<User>`
      SELECT * FROM users 
      WHERE ${sql.and([sql.in("name", names), sql`created_at > ${afterDate}`])}
    `

  return {
    findUsersByName,
    findUsersByColumn,
    findUsersWithOrder,
    findUsersWithFilters
  }
})
```

### Transaction Management

```typescript
export const makeUserService = Effect.gen(function* () {
  const userRepo = yield* UserRepository
  const sql = yield* SqlClient.SqlClient
  const db = yield* Pg.PgDrizzle

  // Using SQL client transactions
  const createUserWithProfileSql = (
    userData: CreateUserRequest,
    profileData: any
  ) =>
    sql.withTransaction(
      Effect.gen(function* () {
        const user = yield* userRepo.create(userData)
        const profile = yield* createProfile({
          ...profileData,
          userId: user.id
        })
        return { user, profile }
      })
    )

  // Using Drizzle transactions
  const createUserWithProfileDrizzle = (
    userData: NewUser,
    episodeData: NewEpisode
  ) =>
    db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values(userData).returning()
      const [episode] = await tx
        .insert(episodes)
        .values({
          ...episodeData,
          userId: user.id
        })
        .returning()
      return { user, episode }
    })

  return {
    createUserWithProfileSql,
    createUserWithProfileDrizzle
  }
})
```

## Testing Patterns

### Test Database Setup

```typescript
import { Effect, Layer } from "effect"
import { PgClient } from "@effect/sql-pg"

export const TestSqlLive = PgClient.layer({
  database: "test_database",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password"
})

export const setupTestDatabase = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  // Clean database before tests
  yield* sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`

  // Seed test data if needed
  yield* sql`
    INSERT INTO users (name, email) VALUES
    ('Test User 1', 'test1@example.com'),
    ('Test User 2', 'test2@example.com')
  `
})
```

### Unit Tests with Effect Test

```typescript
import { Effect } from "effect"
import { assert, describe, it } from "@effect/vitest"
import * as Pg from "@effect/sql-drizzle/Pg"
import { SqlClient } from "@effect/sql"

describe.sequential("UserRepository", () => {
  it.effect(
    "should create and retrieve a user",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        const db = yield* Pg.PgDrizzle

        // Setup table
        yield* sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, 
        name TEXT NOT NULL, 
        email TEXT NOT NULL
      )`

        const userData = {
          name: "John Doe",
          email: "john@example.com"
        }

        // Create user
        const [createdUser] = yield* db
          .insert(users)
          .values(userData)
          .returning()
        assert.strictEqual(createdUser.name, userData.name)
        assert.strictEqual(createdUser.email, userData.email)

        // Find user
        const foundUsers = yield* db
          .select()
          .from(users)
          .where(eq(users.id, createdUser.id))
        assert.deepStrictEqual(foundUsers[0], createdUser)
      }).pipe(
        Effect.provide(TestSqlLive),
        Effect.provide(Pg.PgDrizzle.Default)
      ),
    {
      timeout: 60000
    }
  )

  it.effect(
    "should work with ORM service",
    () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        const db = yield* ORM

        yield* sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, 
        name TEXT NOT NULL, 
        email TEXT NOT NULL
      )`

        yield* db
          .insert(users)
          .values({ name: "Alice", email: "alice@example.com" })
        const results = yield* db.query.users.findMany()
        assert.deepStrictEqual(results, [
          { id: 1, name: "Alice", email: "alice@example.com" }
        ])
      }).pipe(Effect.provide(ORM.Client)),
    {
      timeout: 60000
    }
  )
})
```

## Best Practices

### 1. Error Handling

```typescript
// Define domain-specific errors
export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  {
    id: Schema.Number
  }
) {}

export class DuplicateEmailError extends Schema.TaggedError<DuplicateEmailError>()(
  "DuplicateEmailError",
  {
    email: Schema.String
  }
) {}

// Handle database errors appropriately
const findUserById = (id: number) =>
  userRepo.findById(id).pipe(
    Effect.mapError((error) => {
      if (error._tag === "NoSuchElementException") {
        return new UserNotFoundError({ id })
      }
      return error
    })
  )
```

### 2. Observability

```typescript
import { Effect } from "effect"

const createUserWithLogging = (userData: CreateUserRequest) =>
  userRepo.create(userData).pipe(
    Effect.tap((user) => Effect.log(`Created user: ${user.id}`)),
    Effect.annotateSpan("operation", "create_user"),
    Effect.annotateLogs("userId", (user) => user.id.toString())
  )
```

### 3. Resource Management

```typescript
// Proper resource cleanup with scoped effects
const withDatabaseConnection = <A, E>(
  effect: Effect.Effect<A, E, SqlClient.SqlClient>
) =>
  Effect.scoped(
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* Effect.log("Database connection acquired")
      const result = yield* effect
      yield* Effect.log("Database operation completed")
      return result
    })
  )
```

### 4. Configuration Management

```typescript
import { Config } from "effect"

export const DatabaseConfig = Config.all({
  host: Config.string("DB_HOST").pipe(Config.withDefault("localhost")),
  port: Config.integer("DB_PORT").pipe(Config.withDefault(5432)),
  database: Config.string("DB_NAME"),
  username: Config.string("DB_USER"),
  password: Config.redacted("DB_PASSWORD"),
  ssl: Config.boolean("DB_SSL").pipe(Config.withDefault(false)),
  maxConnections: Config.integer("DB_MAX_CONNECTIONS").pipe(
    Config.withDefault(10)
  )
})

export const SqlConfiguredLive = PgClient.layerConfig(DatabaseConfig)
```

## Common Patterns

### Repository Factory Pattern

```typescript
export const makeRepository = <T extends Record<string, any>>(
  tableName: string,
  schema: Schema.Schema<T>
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const findAll = SqlSchema.findAll({
      Request: Schema.Void,
      Result: schema,
      execute: () => sql`SELECT * FROM ${sql(tableName)}`
    })

    const findById = SqlSchema.findOne({
      Request: Schema.Number,
      Result: schema,
      execute: (id) => sql`SELECT * FROM ${sql(tableName)} WHERE id = ${id}`
    })

    return { findAll: () => findAll(undefined), findById }
  })
```

### Connection Pool Configuration

```typescript
export const ProductionSqlLive = PgClient.layerConfig({
  ...DatabaseConfig,
  poolConfig: Config.succeed({
    max: 20,
    min: 5,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  })
})
```

## Summary

This guide covers the essential patterns for integrating Effect with Drizzle ORM:

- **Service Layer**: Use `Effect.Service` for clean dependency injection
- **Repository Pattern**: Combine `SqlSchema` and `SqlResolver` for type-safe database operations
- **Error Handling**: Define domain-specific errors with proper error mapping
- **Transactions**: Use `sql.withTransaction` for atomic operations
- **Testing**: Set up isolated test environments with proper cleanup
- **Observability**: Add logging and tracing for better debugging
- **Configuration**: Use Effect Config for environment-based settings

The key advantage of this approach is the combination of Effect's composable, type-safe effects with Drizzle's excellent TypeScript integration, resulting in maintainable, testable, and robust database layers.
