import { Schema } from "effect"

// Processing status types
export const ProcessingStatus = Schema.Literal("pending", "processing", "completed", "failed")
export type ProcessingStatus = typeof ProcessingStatus.Type

// Video metadata types
export const VideoMetadata = Schema.Struct({
  duration: Schema.Number.pipe(Schema.positive()),
  width: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  height: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  frameRate: Schema.optional(Schema.Number.pipe(Schema.positive())),
  bitrate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  codec: Schema.optional(Schema.String),
  audioCodec: Schema.optional(Schema.String),
  audioChannels: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  audioSampleRate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive()))
})
export type VideoMetadata = typeof VideoMetadata.Type

// File information types
export const FileInfo = Schema.Struct({
  path: Schema.String.pipe(Schema.minLength(1)),
  name: Schema.String.pipe(Schema.minLength(1)),
  size: Schema.Number.pipe(Schema.int(), Schema.positive()),
  checksum: Schema.String.pipe(Schema.length(64)),
  mimeType: Schema.optional(Schema.String),
  extension: Schema.optional(Schema.String)
})
export type FileInfo = typeof FileInfo.Type

// Transcription segment types
export const TranscriptionSegment = Schema.Struct({
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  endTime: Schema.Number.pipe(Schema.positive()),
  text: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))),
  speaker: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String.pipe(Schema.maxLength(10)))
})
export type TranscriptionSegment = typeof TranscriptionSegment.Type

// Search result types
export const SearchResult = Schema.Struct({
  episodeId: Schema.UUID,
  transcriptionId: Schema.UUID,
  similarity: Schema.Number.pipe(Schema.between(0, 1)),
  text: Schema.String,
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  endTime: Schema.Number.pipe(Schema.positive()),
  episodeTitle: Schema.optional(Schema.String),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive()))
})
export type SearchResult = typeof SearchResult.Type

// Pagination types
export const PaginationParams = Schema.Struct({
  page: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())).pipe(
    Schema.withDefaults({ constructor: () => 1, decoding: () => 1 })
  ),
  limit: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.between(1, 100))).pipe(
    Schema.withDefaults({ constructor: () => 10, decoding: () => 10 })
  )
})
export type PaginationParams = typeof PaginationParams.Type

export const PaginatedResult = <T>(itemSchema: Schema.Schema<T>) =>
  Schema.Struct({
    items: Schema.Array(itemSchema),
    total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
    page: Schema.Number.pipe(Schema.int(), Schema.positive()),
    limit: Schema.Number.pipe(Schema.int(), Schema.positive()),
    totalPages: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  })

// Filter types
export const EpisodeFilters = Schema.Struct({
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  processed: Schema.optional(Schema.Boolean),
  hasTranscription: Schema.optional(Schema.Boolean),
  hasMetadata: Schema.optional(Schema.Boolean)
})
export type EpisodeFilters = typeof EpisodeFilters.Type

// External API types
export const ExternalApiSource = Schema.Literal("tmdb", "tvmaze", "imdb")
export type ExternalApiSource = typeof ExternalApiSource.Type

export const ExternalEpisodeData = Schema.Struct({
  source: ExternalApiSource,
  externalId: Schema.String,
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  season: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  episodeNumber: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  airDate: Schema.optional(Schema.DateFromSelf),
  rating: Schema.optional(Schema.Number.pipe(Schema.between(0, 10))),
  genres: Schema.optional(Schema.Array(Schema.String)),
  cast: Schema.optional(Schema.Array(Schema.String)),
  crew: Schema.optional(Schema.Array(Schema.String))
})
export type ExternalEpisodeData = typeof ExternalEpisodeData.Type
