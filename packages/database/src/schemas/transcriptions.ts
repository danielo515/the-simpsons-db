import { decimal, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { Schema } from "effect"
import { episodes } from "./episodes.js"

export const transcriptions = pgTable("transcriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  segmentIndex: integer("segment_index").notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(),
  endTime: decimal("end_time", { precision: 10, scale: 3 }).notNull(),
  text: text("text").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  speaker: varchar("speaker", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  episodeIdIdx: index("transcriptions_episode_id_idx").on(table.episodeId),
  startTimeIdx: index("transcriptions_start_time_idx").on(table.startTime),
  endTimeIdx: index("transcriptions_end_time_idx").on(table.endTime),
  segmentIdx: index("transcriptions_segment_idx").on(table.episodeId, table.segmentIndex),
  timeRangeIdx: index("transcriptions_time_range_idx").on(table.episodeId, table.startTime, table.endTime)
}))

export const TranscriptionSchema = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  segmentIndex: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  startTime: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  endTime: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  text: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(Schema.String.pipe(Schema.pattern(/^[01](\.\d{1,2})?$/))),
  language: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
  speaker: Schema.optional(Schema.String.pipe(Schema.maxLength(100))),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

export const NewTranscriptionSchema = Schema.Struct({
  episodeId: Schema.UUID,
  segmentIndex: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  startTime: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  endTime: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  text: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(Schema.String.pipe(Schema.pattern(/^[01](\.\d{1,2})?$/))),
  language: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
  speaker: Schema.optional(Schema.String.pipe(Schema.maxLength(100)))
})

export type Transcription = typeof TranscriptionSchema.Type
export type NewTranscription = typeof NewTranscriptionSchema.Type
