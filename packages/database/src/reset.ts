import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { Config, Effect } from "effect"
import postgres from "postgres"
import * as schema from "./schemas/index.js"

const resetDatabase = Effect.gen(function*() {
  const databaseUrl = yield* Config.string("DATABASE_URL")

  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  // Drop all tables in reverse dependency order
  yield* Effect.promise(() => db.execute(sql`DROP TABLE IF EXISTS transcription_embeddings CASCADE`))
  yield* Effect.promise(() => db.execute(sql`DROP TABLE IF EXISTS transcriptions CASCADE`))
  yield* Effect.promise(() => db.execute(sql`DROP TABLE IF EXISTS thumbnails CASCADE`))
  yield* Effect.promise(() => db.execute(sql`DROP TABLE IF EXISTS episode_metadata CASCADE`))
  yield* Effect.promise(() => db.execute(sql`DROP TABLE IF EXISTS episodes CASCADE`))

  console.log("Database reset completed successfully")

  yield* Effect.promise(() => client.end())
})

Effect.runPromise(resetDatabase).catch(console.error)
