import { drizzle } from "drizzle-orm/postgres-js"
import { Config, Effect } from "effect"
import postgres from "postgres"
import * as schema from "./schemas/index.js"

const seedDatabase = Effect.gen(function*() {
  const databaseUrl = yield* Config.string("DATABASE_URL")

  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  // Enable pgvector extension
  yield* Effect.promise(() => db.execute("CREATE EXTENSION IF NOT EXISTS vector"))

  console.log("Database seeded successfully")

  yield* Effect.promise(() => client.end())
})

Effect.runPromise(seedDatabase).catch(console.error)
