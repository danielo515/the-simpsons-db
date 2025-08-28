import type { EpisodeId, EpisodeMetadataId } from "@simpsons-db/domain"
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { episodes } from "./episodes.js"

export const episodeMetadata = pgTable("episode_metadata", {
  id: uuid("id").primaryKey().defaultRandom().$type<EpisodeMetadataId>(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }).$type<EpisodeId>(),
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

// Database types inferred from Drizzle schema
export type EpisodeMetadataRow = typeof episodeMetadata.$inferSelect
export type NewEpisodeMetadataRow = typeof episodeMetadata.$inferInsert
