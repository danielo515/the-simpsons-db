import { TranscriptionSegment } from "@simpsons-db/shared"
import { Schema } from "effect"

export const Transcription = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  endTime: Schema.Number.pipe(Schema.positive()),
  text: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))),
  speaker: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String.pipe(Schema.maxLength(10))),
  createdAt: Schema.DateFromSelf
})

export type Transcription = typeof Transcription.Type

export const CreateTranscriptionRequest = Schema.Struct({
  episodeId: Schema.UUID,
  segments: Schema.Array(TranscriptionSegment).pipe(Schema.minItems(1))
})

export type CreateTranscriptionRequest = typeof CreateTranscriptionRequest.Type

export const TranscriptionEmbedding = Schema.Struct({
  id: Schema.UUID,
  transcriptionId: Schema.UUID,
  embedding: Schema.Array(Schema.Number).pipe(Schema.minItems(1536), Schema.maxItems(1536)),
  model: Schema.String.pipe(Schema.minLength(1)),
  createdAt: Schema.DateFromSelf
})

export type TranscriptionEmbedding = typeof TranscriptionEmbedding.Type

export const CreateEmbeddingRequest = Schema.Struct({
  transcriptionId: Schema.UUID,
  text: Schema.String.pipe(Schema.minLength(1)),
  model: Schema.String.pipe(Schema.minLength(1))
})

export type CreateEmbeddingRequest = typeof CreateEmbeddingRequest.Type
