import type { EpisodeId } from "@simpsons-db/domain"
import { boolean, decimal, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom().$type<EpisodeId>(),
  filePath: varchar("file_path", { length: 1000 }).notNull().unique(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  duration: decimal("duration", { precision: 10, scale: 3 }).notNull(),
  resolution: varchar("resolution", { length: 20 }),
  codec: varchar("codec", { length: 50 }),
  bitrate: integer("bitrate"),
  frameRate: decimal("frame_rate", { precision: 5, scale: 2 }),
  audioCodec: varchar("audio_codec", { length: 50 }),
  audioChannels: integer("audio_channels"),
  audioSampleRate: integer("audio_sample_rate"),
  checksum: varchar("checksum", { length: 64 }).notNull().unique(),
  processed: boolean("processed").default(false).notNull(),
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  processingError: text("processing_error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// Database types inferred from Drizzle schema
export type EpisodeRow = typeof episodes.$inferSelect
export type NewEpisodeRow = typeof episodes.$inferInsert
