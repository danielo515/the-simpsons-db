import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { Schema } from "effect"
import { episodes } from "./episodes.js"

export const episodeMetadata = pgTable("episode_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  source: varchar("source", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  season: integer("season"),
  episodeNumber: integer("episode_number"),
  airDate: timestamp("air_date"),
  imdbId: varchar("imdb_id", { length: 20 }),
  tmdbId: integer("tmdb_id"),
  tvmazeId: integer("tvmaze_id"),
  rating: varchar("rating", { length: 10 }),
  genres: jsonb("genres"),
  cast: jsonb("cast"),
  crew: jsonb("crew"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("episode_metadata_episode_id_idx").on(table.episodeId),
  index("episode_metadata_source_idx").on(table.source),
  index("episode_metadata_external_id_idx").on(table.source, table.externalId),
  index("episode_metadata_season_episode_idx").on(table.season, table.episodeNumber)
])

// Episode metadata schema - package-specific
export const EpisodeMetadataSchema = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  source: Schema.String.pipe(Schema.maxLength(50)),
  externalId: Schema.String.pipe(Schema.maxLength(100)),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  airDate: Schema.optional(Schema.DateFromSelf),
  imdbId: Schema.optional(Schema.String.pipe(Schema.maxLength(20))),
  tmdbId: Schema.optional(Schema.Number.pipe(Schema.int())),
  tvmazeId: Schema.optional(Schema.Number.pipe(Schema.int())),
  rawData: Schema.optional(Schema.Unknown),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

export const NewEpisodeMetadataSchema = EpisodeMetadataSchema.pipe(
  Schema.omit("id", "createdAt", "updatedAt")
).pipe(Schema.extend(Schema.Struct({
  source: Schema.optional(Schema.String.pipe(Schema.maxLength(50))),
  externalId: Schema.optional(Schema.String.pipe(Schema.maxLength(100)))
})))

export type EpisodeMetadata = typeof EpisodeMetadataSchema.Type
export type NewEpisodeMetadata = typeof NewEpisodeMetadataSchema.Type
