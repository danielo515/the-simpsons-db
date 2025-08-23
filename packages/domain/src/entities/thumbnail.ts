import { Schema } from "effect"

export const Thumbnail = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
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
  episodeId: Schema.UUID,
  timestamp: Schema.Number.pipe(Schema.nonNegative()),
  filePath: Schema.String.pipe(Schema.minLength(1)),
  fileName: Schema.String.pipe(Schema.minLength(1)),
  fileSize: Schema.Number.pipe(Schema.int(), Schema.positive()),
  width: Schema.Number.pipe(Schema.int(), Schema.positive()),
  height: Schema.Number.pipe(Schema.int(), Schema.positive()),
  format: Schema.String.pipe(Schema.minLength(1))
})

export type CreateThumbnailRequest = typeof CreateThumbnailRequest.Type
