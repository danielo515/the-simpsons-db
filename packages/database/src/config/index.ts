import { PgClient } from "@effect/sql-pg"
import { Config } from "effect"

const DatabaseConfig = Config.all({
  host: Config.string("DB_HOST").pipe(Config.withDefault("localhost")),
  port: Config.integer("DB_PORT").pipe(Config.withDefault(5432)),
  database: Config.string("DB_NAME").pipe(Config.withDefault("simpsons_db")),
  username: Config.string("DB_USER").pipe(Config.withDefault("postgres")),
  password: Config.redacted("DB_PASSWORD"),
  ssl: Config.boolean("DB_SSL").pipe(Config.withDefault(false)),
  maxConnections: Config.integer("DB_MAX_CONNECTIONS").pipe(Config.withDefault(10))
})

export const DatabaseLive = PgClient.layerConfig(DatabaseConfig)
