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
}, (table) => ({
  episodeIdIdx: index("episode_metadata_episode_id_idx").on(table.episodeId),
  sourceIdx: index("episode_metadata_source_idx").on(table.source),
  externalIdIdx: index("episode_metadata_external_id_idx").on(table.source, table.externalId),
  seasonEpisodeIdx: index("episode_metadata_season_episode_idx").on(table.season, table.episodeNumber),
  imdbIdIdx: index("episode_metadata_imdb_id_idx").on(table.imdbId),
  tmdbIdIdx: index("episode_metadata_tmdb_id_idx").on(table.tmdbId),
  tvmazeIdIdx: index("episode_metadata_tvmaze_id_idx").on(table.tvmazeId)
}))

export const EpisodeMetadataSchema = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  source: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50)),
  externalId: Schema.optional(Schema.String.pipe(Schema.maxLength(100))),
  title: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
  description: Schema.optional(Schema.String),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  airDate: Schema.optional(Schema.DateFromSelf),
  imdbId: Schema.optional(Schema.String.pipe(Schema.maxLength(20))),
  tmdbId: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  tvmazeId: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  rating: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
  genres: Schema.optional(Schema.Unknown),
  cast: Schema.optional(Schema.Unknown),
  crew: Schema.optional(Schema.Unknown),
  rawData: Schema.optional(Schema.Unknown),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

export const NewEpisodeMetadataSchema = Schema.Struct({
  episodeId: Schema.UUID,
  source: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(50)),
  externalId: Schema.optional(Schema.String.pipe(Schema.maxLength(100))),
  title: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
  description: Schema.optional(Schema.String),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  airDate: Schema.optional(Schema.DateFromSelf),
  imdbId: Schema.optional(Schema.String.pipe(Schema.maxLength(20))),
  tmdbId: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  tvmazeId: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  rating: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
  genres: Schema.optional(Schema.Unknown),
  cast: Schema.optional(Schema.Unknown),
  crew: Schema.optional(Schema.Unknown),
  rawData: Schema.optional(Schema.Unknown)
})

export type EpisodeMetadata = typeof EpisodeMetadataSchema.Type
export type NewEpisodeMetadata = typeof NewEpisodeMetadataSchema.Type
