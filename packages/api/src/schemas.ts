import { Schema } from "effect"

// Health Check Schemas
export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.String,
  service: Schema.String
})

// Episode API Response Schema (for API responses only)
export const EpisodeResponse = Schema.Struct({
  id: Schema.UUID,
  filePath: Schema.String,
  fileName: Schema.String,
  fileSize: Schema.Number,
  duration: Schema.optional(Schema.Number),
  season: Schema.optional(Schema.Number),
  episodeNumber: Schema.optional(Schema.Number),
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  airDate: Schema.optional(Schema.DateTimeUtc),
  processed: Schema.Boolean,
  hasTranscription: Schema.Boolean,
  hasMetadata: Schema.Boolean,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc
})

export const CreateEpisodeRequest = Schema.Struct({
  filePath: Schema.String.pipe(Schema.minLength(1))
})

export const GetEpisodesQuery = Schema.Struct({
  page: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.positive())),
  limit: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100))),
  season: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.positive())),
  processed: Schema.optional(Schema.Literal("true", "false")),
  hasTranscription: Schema.optional(Schema.Literal("true", "false")),
  hasMetadata: Schema.optional(Schema.Literal("true", "false"))
})

export const PaginatedResponse = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    data: Schema.Array(itemSchema),
    pagination: Schema.Struct({
      page: Schema.Number,
      limit: Schema.Number,
      total: Schema.Number,
      totalPages: Schema.Number
    })
  })

export const EpisodesResponse = PaginatedResponse(EpisodeResponse)

// Path Parameters
export const EpisodeIdParam = Schema.Struct({
  id: Schema.UUID
})

// Error Schemas
export class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    message: Schema.String,
    errors: Schema.optional(Schema.Array(Schema.String))
  }
) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    message: Schema.String,
    resource: Schema.String
  }
) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  "InternalServerError",
  {
    message: Schema.String
  }
) {}

// Search Schemas
export const SearchQuery = Schema.Struct({
  q: Schema.String.pipe(Schema.minLength(1)),
  page: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.positive())),
  limit: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100))),
  threshold: Schema.optional(Schema.NumberFromString.pipe(Schema.between(0, 1))),
  episodeId: Schema.optional(Schema.UUID)
})

export const SearchResult = Schema.Struct({
  id: Schema.UUID,
  episodeId: Schema.UUID,
  text: Schema.String,
  startTime: Schema.Number,
  endTime: Schema.Number,
  confidence: Schema.Number,
  episode: Schema.optional(EpisodeResponse)
})

export const SearchResponse = PaginatedResponse(SearchResult)

export const SimilaritySearchRequest = Schema.Struct({
  text: Schema.String.pipe(Schema.minLength(1)),
  limit: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100))),
  threshold: Schema.optional(Schema.NumberFromString.pipe(Schema.between(0, 1)))
})
