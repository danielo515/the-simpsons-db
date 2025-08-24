import { decimal, index, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { Schema } from "effect"
import { episodes } from "./episodes.js"

export const thumbnails = pgTable("thumbnails", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
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

// Thumbnail schema - package-specific
export const ThumbnailSchema = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  timestamp: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  filePath: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
  fileName: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  width: Schema.Number.pipe(Schema.int(), Schema.positive()),
  height: Schema.Number.pipe(Schema.int(), Schema.positive()),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  format: Schema.String.pipe(Schema.maxLength(10)),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

export const NewThumbnailSchema = ThumbnailSchema.pipe(
  Schema.omit("id", "createdAt", "updatedAt")
).pipe(Schema.extend(Schema.Struct({
  format: Schema.optional(Schema.String.pipe(Schema.maxLength(10)))
})))

export type Thumbnail = typeof ThumbnailSchema.Type
export type NewThumbnail = typeof NewThumbnailSchema.Type
