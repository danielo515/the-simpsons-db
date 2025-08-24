import { BaseFields, FilePath, ProcessingStatus, VideoMetadata } from "@simpsons-db/shared"
import { Schema } from "effect"

export const EpisodeId = Schema.UUID.pipe(Schema.brand("EpisodeId"))

// Core Episode domain entity
export const Episode = Schema.Struct({
  id: EpisodeId,
  filePath: FilePath,
  fileName: Schema.String.pipe(Schema.minLength(1)),
  fileSize: Schema.Number.pipe(Schema.positive()),
  checksum: Schema.String.pipe(Schema.minLength(64)),
  mimeType: Schema.optional(Schema.String.pipe(Schema.maxLength(100))),
  videoMetadata: Schema.optional(VideoMetadata),
  processingStatus: ProcessingStatus,
  transcriptionStatus: ProcessingStatus,
  thumbnailStatus: ProcessingStatus,
  metadataStatus: ProcessingStatus,
  season: BaseFields.positiveInt,
  episodeNumber: BaseFields.positiveInt,
  title: BaseFields.shortString(255),
  description: BaseFields.optionalString(1000),
  airDate: BaseFields.optionalDate
})

export type Episode = typeof Episode.Type

// Domain request types for episode operations
export const CreateEpisodeRequest = Episode.pipe(
  Schema.omit(
    "id",
    "processingStatus",
    "transcriptionStatus",
    "thumbnailStatus",
    "metadataStatus"
  )
)

export const UpdateEpisodeRequest = Schema.Struct({
  id: EpisodeId
}).pipe(Schema.extend(
  Episode.pipe(
    Schema.omit("id", "filePath", "fileName", "fileSize", "checksum", "mimeType")
  ).pipe(Schema.partial)
))

export type CreateEpisodeRequest = typeof CreateEpisodeRequest.Type
export type UpdateEpisodeRequest = typeof UpdateEpisodeRequest.Type
