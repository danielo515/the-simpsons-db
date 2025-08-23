import { boolean, decimal, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { Schema } from "effect"

export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
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

export const EpisodeSchema = Schema.Struct({
  id: Schema.UUID,
  filePath: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
  fileName: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  duration: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  resolution: Schema.optional(Schema.String.pipe(Schema.maxLength(20))),
  codec: Schema.optional(Schema.String.pipe(Schema.maxLength(50))),
  bitrate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  frameRate: Schema.optional(Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,2})?$/))),
  audioCodec: Schema.optional(Schema.String.pipe(Schema.maxLength(50))),
  audioChannels: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  audioSampleRate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  checksum: Schema.String.pipe(Schema.length(64)),
  processed: Schema.Boolean,
  processingStartedAt: Schema.optional(Schema.DateFromSelf),
  processingCompletedAt: Schema.optional(Schema.DateFromSelf),
  processingError: Schema.optional(Schema.String),
  metadata: Schema.optional(Schema.Unknown),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf
})

export const NewEpisodeSchema = Schema.Struct({
  filePath: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(1000)),
  fileName: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  duration: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  resolution: Schema.optional(Schema.String.pipe(Schema.maxLength(20))),
  codec: Schema.optional(Schema.String.pipe(Schema.maxLength(50))),
  bitrate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  frameRate: Schema.optional(Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,2})?$/))),
  audioCodec: Schema.optional(Schema.String.pipe(Schema.maxLength(50))),
  audioChannels: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  audioSampleRate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  checksum: Schema.String.pipe(Schema.length(64)),
  metadata: Schema.optional(Schema.Unknown),
  processingError: Schema.optional(Schema.String)
})

export type Episode = typeof EpisodeSchema.Type
export type NewEpisode = typeof NewEpisodeSchema.Type
