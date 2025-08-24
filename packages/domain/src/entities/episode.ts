import { BaseFields, FilePath, ProcessingStatus, VideoMetadata } from "@simpsons-db/shared"
import { Schema } from "effect"

// Core Episode domain entity
export const Episode = Schema.Struct({
  id: BaseFields.id,
  filePath: FilePath,
  fileName: BaseFields.fileName,
  fileSize: BaseFields.fileSize,
  checksum: BaseFields.checksum,
  mimeType: BaseFields.optionalString(100),
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
    "createdAt",
    "updatedAt",
    "processedAt",
    "processingStatus",
    "transcriptionStatus",
    "thumbnailStatus",
    "metadataStatus",
    "errorMessage"
  )
)

export const UpdateEpisodeRequest = Schema.Struct({
  id: BaseFields.id
}).pipe(Schema.extend(
  Episode.pipe(
    Schema.omit("id", "filePath", "fileName", "fileSize", "checksum", "mimeType", "createdAt", "updatedAt")
  ).pipe(Schema.partial)
))

export type CreateEpisodeRequest = typeof CreateEpisodeRequest.Type
export type UpdateEpisodeRequest = typeof UpdateEpisodeRequest.Type
