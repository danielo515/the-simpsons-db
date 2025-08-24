import { BaseFields, NonEmptyString } from "@simpsons-db/shared"
import { Schema } from "effect"
import { EpisodeId } from "./episode.js"

export const TranscriptionId = Schema.UUID.pipe(Schema.brand("TranscriptionId"))

// Core Transcription domain entity
export const Transcription = Schema.Struct({
  id: TranscriptionId,
  episodeId: EpisodeId,
  segmentIndex: BaseFields.nonNegativeInt,
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  endTime: Schema.Number.pipe(Schema.positive()),
  text: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(BaseFields.confidenceNumber),
  speaker: Schema.optional(Schema.String),
  language: BaseFields.optionalString(10)
})

export type Transcription = typeof Transcription.Type

// Core TranscriptionEmbedding domain entity
export const TranscriptionEmbeddingId = Schema.UUID.pipe(Schema.brand("TranscriptionEmbeddingId"))
export const TranscriptionEmbedding = Schema.Struct({
  id: TranscriptionEmbeddingId,
  transcriptionId: TranscriptionId,
  embedding: Schema.Array(Schema.Number).pipe(Schema.minItems(1536), Schema.maxItems(1536)),
  model: NonEmptyString
})

export type TranscriptionEmbedding = typeof TranscriptionEmbedding.Type
