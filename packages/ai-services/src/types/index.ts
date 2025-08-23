import { Schema } from "effect"

export const TranscriptionRequest = Schema.Struct({
  audioPath: Schema.String.pipe(Schema.minLength(1)),
  model: Schema.propertySignature(Schema.String).pipe(
    Schema.withConstructorDefault(() => "whisper-1")
  ),
  responseFormat: Schema.propertySignature(Schema.Literal("json", "text", "verbose_json")).pipe(
    Schema.withConstructorDefault(() => "verbose_json" as const)
  ),
  temperature: Schema.propertySignature(Schema.Number.pipe(Schema.between(0, 1))).pipe(
    Schema.withConstructorDefault(() => 0)
  )
})
export type TranscriptionRequest = typeof TranscriptionRequest.Type
export const makeTranscriptionRequest = Schema.decodeUnknown(TranscriptionRequest)
export const encodeTranscriptionRequest = Schema.encodeUnknown(TranscriptionRequest)

export const TranscriptionSegment = Schema.Struct({
  id: Schema.Number,
  seek: Schema.Number,
  start: Schema.Number.pipe(Schema.nonNegative()),
  end: Schema.Number.pipe(Schema.positive()),
  text: Schema.String.pipe(Schema.minLength(1)),
  tokens: Schema.Array(Schema.Number),
  temperature: Schema.Number.pipe(Schema.between(0, 1)),
  avgLogprob: Schema.Number,
  compressionRatio: Schema.Number,
  noSpeechProb: Schema.Number.pipe(Schema.between(0, 1))
})
export type TranscriptionSegment = typeof TranscriptionSegment.Type

export const TranscriptionResponse = Schema.Struct({
  task: Schema.String,
  language: Schema.String,
  duration: Schema.Number.pipe(Schema.positive()),
  text: Schema.String,
  segments: Schema.Array(TranscriptionSegment)
})
export type TranscriptionResponse = typeof TranscriptionResponse.Type

export const EmbeddingRequest = Schema.Struct({
  text: Schema.String.pipe(Schema.minLength(1)),
  model: Schema.propertySignature(Schema.String).pipe(
    Schema.withConstructorDefault(() => "text-embedding-3-small")
  )
})
export type EmbeddingRequest = typeof EmbeddingRequest.Type
export const makeEmbeddingRequest = Schema.decodeUnknown(EmbeddingRequest)
export const encodeEmbeddingRequest = Schema.encodeUnknown(EmbeddingRequest)

export const EmbeddingResponse = Schema.Struct({
  object: Schema.String,
  data: Schema.Array(Schema.Struct({
    object: Schema.String,
    embedding: Schema.Array(Schema.Number),
    index: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  })),
  model: Schema.String,
  usage: Schema.Struct({
    promptTokens: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
    totalTokens: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  })
})
export type EmbeddingResponse = typeof EmbeddingResponse.Type

export const OpenAIConfig = Schema.Struct({
  apiKey: Schema.Redacted(Schema.String),
  organization: Schema.optional(Schema.String),
  baseURL: Schema.optional(Schema.String),
  timeout: Schema.propertySignature(Schema.Number.pipe(Schema.positive())).pipe(
    Schema.withConstructorDefault(() => 60000)
  )
})
export type OpenAIConfig = typeof OpenAIConfig.Type
export const makeOpenAIConfig = Schema.decodeUnknown(OpenAIConfig)
export const encodeOpenAIConfig = Schema.encodeUnknown(OpenAIConfig)
