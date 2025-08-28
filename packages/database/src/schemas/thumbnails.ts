import type { EpisodeId, ThumbnailId } from "@simpsons-db/domain"
import { decimal, index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { episodes } from "./episodes.js"

export const thumbnails = pgTable("thumbnails", {
  id: uuid("id").primaryKey().defaultRandom().$type<ThumbnailId>(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }).$type<EpisodeId>(),
  timestamp: decimal("timestamp", { precision: 10, scale: 3 }).notNull(),
  filePath: varchar("file_path", { length: 1000 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  fileSize: integer("file_size").notNull(),
  format: varchar("format", { length: 10 }).notNull().default("jpg"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("thumbnails_episode_id_idx").on(table.episodeId),
  index("thumbnails_timestamp_idx").on(table.episodeId, table.timestamp),
  index("thumbnails_file_path_idx").on(table.filePath)
])

// Database types inferred from Drizzle schema
export type ThumbnailRow = typeof thumbnails.$inferSelect
export type NewThumbnailRow = typeof thumbnails.$inferInsert
