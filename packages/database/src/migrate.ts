import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { Config, Effect } from "effect"
import postgres from "postgres"

const runMigrations = Effect.gen(function*() {
  const databaseUrl = yield* Config.string("DATABASE_URL")

  const migrationClient = postgres(databaseUrl, { max: 1 })
  const db = drizzle(migrationClient)

  yield* Effect.promise(() => migrate(db, { migrationsFolder: "./src/migrations" }))
  yield* Effect.promise(() => migrationClient.end())

  console.log("Migrations completed successfully")
})

Effect.runPromise(runMigrations).catch(console.error)
