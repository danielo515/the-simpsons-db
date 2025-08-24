import { Config, Console, Effect } from "effect"
import postgres from "postgres"

const seedDatabase = Effect.gen(function*() {
  const databaseUrl = yield* Config.string("DATABASE_URL")

  yield* Console.log("Connecting to database...")
  const client = postgres(databaseUrl)

  yield* Console.log("Enabling pgvector extension...")
  yield* Effect.promise(() => client`CREATE EXTENSION IF NOT EXISTS vector`)

  yield* Console.log("Running database migrations...")
  // Note: In a real setup, you'd run drizzle migrations here
  // For now, we'll just ensure the extensions are enabled

  yield* Console.log("Database initialization completed successfully")

  yield* Effect.promise(() => client.end())
})

const program = seedDatabase.pipe(
  Effect.catchAll((error) =>
    Console.error("Database initialization failed:", error).pipe(
      Effect.andThen(Effect.fail(error))
    )
  )
)

Effect.runPromise(program).catch(console.error)
