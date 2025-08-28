import { Schema } from "effect"
import { EpisodeId } from "./episode.js"

export const ThumbnailId = Schema.UUID.pipe(Schema.brand("ThumbnailId"))
export type ThumbnailId = typeof ThumbnailId.Type

export const Thumbnail = Schema.Struct({
  id: ThumbnailId,
  episodeId: EpisodeId,
  timestamp: Schema.Number.pipe(Schema.nonNegative()),
  filePath: Schema.String.pipe(Schema.minLength(1)),
  fileName: Schema.String.pipe(Schema.minLength(1)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  width: Schema.Number.pipe(Schema.int(), Schema.positive()),
  height: Schema.Number.pipe(Schema.int(), Schema.positive()),
  format: Schema.String.pipe(Schema.minLength(1)),
  createdAt: Schema.DateFromSelf
})

export type Thumbnail = typeof Thumbnail.Type

export const CreateThumbnailRequest = Schema.Struct({
  episodeId: EpisodeId,
  timestamp: Schema.Number.pipe(Schema.nonNegative()),
  filePath: Schema.String.pipe(Schema.minLength(1)),
  fileName: Schema.String.pipe(Schema.minLength(1)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  width: Schema.Number.pipe(Schema.int(), Schema.positive()),
  height: Schema.Number.pipe(Schema.int(), Schema.positive()),
  format: Schema.String.pipe(Schema.minLength(1))
})

export type CreateThumbnailRequest = typeof CreateThumbnailRequest.Type
