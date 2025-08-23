import { ProcessingStatus, VideoMetadata } from "@simpsons-db/shared"
import { Schema } from "effect"

export const Episode = Schema.Struct({
  id: Schema.UUID,
  filePath: Schema.String,
  fileName: Schema.String,
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  checksum: Schema.String.pipe(Schema.length(64)),
  mimeType: Schema.optional(Schema.String),
  videoMetadata: Schema.optional(VideoMetadata),
  processingStatus: ProcessingStatus,
  transcriptionStatus: ProcessingStatus,
  thumbnailStatus: ProcessingStatus,
  metadataStatus: ProcessingStatus,
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  airDate: Schema.optional(Schema.DateFromSelf),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
  processedAt: Schema.optional(Schema.DateFromSelf),
  errorMessage: Schema.optional(Schema.String)
})

export type Episode = typeof Episode.Type

export const CreateEpisodeRequest = Schema.Struct({
  filePath: Schema.String.pipe(Schema.minLength(1)),
  fileName: Schema.String.pipe(Schema.minLength(1)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  checksum: Schema.String.pipe(Schema.length(64)),
  mimeType: Schema.optional(Schema.String),
  videoMetadata: Schema.optional(VideoMetadata),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive()))
})

export type CreateEpisodeRequest = typeof CreateEpisodeRequest.Type

export const UpdateEpisodeRequest = Schema.Struct({
  id: Schema.UUID,
  processingStatus: Schema.optional(ProcessingStatus),
  transcriptionStatus: Schema.optional(ProcessingStatus),
  thumbnailStatus: Schema.optional(ProcessingStatus),
  metadataStatus: Schema.optional(ProcessingStatus),
  videoMetadata: Schema.optional(VideoMetadata),
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  airDate: Schema.optional(Schema.DateFromSelf),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  errorMessage: Schema.optional(Schema.String)
})

export type UpdateEpisodeRequest = typeof UpdateEpisodeRequest.Type
