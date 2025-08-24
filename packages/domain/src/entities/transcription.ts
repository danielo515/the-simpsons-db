import { Schema } from "effect"
import { BaseFields } from "@simpsons-db/shared"

// Core Transcription domain entity
export const Transcription = Schema.Struct({
  id: BaseFields.id,
  episodeId: BaseFields.episodeId,
  segmentIndex: BaseFields.nonNegativeInt,
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  endTime: Schema.Number.pipe(Schema.positive()),
  text: BaseFields.requiredText,
  confidence: Schema.optional(BaseFields.confidenceNumber),
  speaker: Schema.optional(Schema.String),
  language: BaseFields.optionalString(10),
  createdAt: BaseFields.createdAt
})

export type Transcription = typeof Transcription.Type

// Core TranscriptionEmbedding domain entity
export const TranscriptionEmbedding = Schema.Struct({
  id: BaseFields.id,
  transcriptionId: BaseFields.transcriptionId,
  embedding: Schema.Array(Schema.Number).pipe(Schema.minItems(1536), Schema.maxItems(1536)),
  model: BaseFields.requiredText,
  createdAt: BaseFields.createdAt
})

export type TranscriptionEmbedding = typeof TranscriptionEmbedding.Type

// Domain request types for transcription operations
export const CreateTranscriptionRequest = Schema.Struct({
  episodeId: BaseFields.episodeId,
  segments: Schema.Array(Transcription.pipe(
    Schema.omit("id", "createdAt")
  )).pipe(Schema.minItems(1))
})

export const CreateEmbeddingRequest = TranscriptionEmbedding.pipe(
  Schema.omit("id", "createdAt", "embedding")
).pipe(Schema.extend(Schema.Struct({
  text: BaseFields.requiredText
})))

export type CreateTranscriptionRequest = typeof CreateTranscriptionRequest.Type
export type CreateEmbeddingRequest = typeof CreateEmbeddingRequest.Type
