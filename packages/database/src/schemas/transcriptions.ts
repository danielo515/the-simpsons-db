import type { EpisodeId, TranscriptionId } from "@simpsons-db/domain"
import { decimal, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { episodes } from "./episodes.js"

export const transcriptions = pgTable(
  "transcriptions",
  {
    id: uuid("id").primaryKey().defaultRandom().$type<TranscriptionId>(),
    episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }).$type<EpisodeId>(),
    segmentIndex: integer("segment_index").notNull(),
    startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(),
    endTime: decimal("end_time", { precision: 10, scale: 3 }).notNull(),
    text: text("text").notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2 }),
    language: varchar("language", { length: 10 }).default("en"),
    speaker: varchar("speaker", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (
    table
  ) => [
    index("transcriptions_episode_id_idx").on(table.episodeId),
    index("transcriptions_start_time_idx").on(table.startTime),
    index("transcriptions_end_time_idx").on(table.endTime),
    index("transcriptions_segment_idx").on(table.episodeId, table.segmentIndex),
    index("transcriptions_time_range_idx").on(table.episodeId, table.startTime, table.endTime)
  ]
)

// Database record type (what comes from/goes to the database)
export type TranscriptionRecord = typeof transcriptions.$inferSelect
export type NewTranscriptionRecord = typeof transcriptions.$inferInsert
