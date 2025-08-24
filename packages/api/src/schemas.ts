import { Episode as DomainEpisode } from "@simpsons-db/domain"
import { PaginatedResponse } from "@simpsons-db/shared"
import { Schema } from "effect"

// Health Check Schemas
export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.String,
  service: Schema.String
})

// Episode API Response extends domain entity with API-specific fields
export const EpisodeResponse = DomainEpisode.pipe(Schema.extend(Schema.Struct({
  duration: Schema.optional(Schema.Number),
  processed: Schema.Boolean,
  hasTranscription: Schema.Boolean,
  hasMetadata: Schema.Boolean
})))

// Create episode request - package-specific
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

// Using PaginatedResponse from shared package

export const EpisodesResponse = PaginatedResponse(EpisodeResponse)

// Path Parameters
export const EpisodeIdParam = Schema.Struct({
  id: Schema.UUID
})

// API Error schemas - package-specific
export const ValidationError = Schema.Struct({
  error: Schema.Literal("VALIDATION_ERROR"),
  message: Schema.String,
  details: Schema.optional(Schema.Array(Schema.Struct({
    field: Schema.String,
    message: Schema.String
  })))
})

export const NotFoundError = Schema.Struct({
  error: Schema.Literal("NOT_FOUND"),
  message: Schema.String
})

export const InternalServerError = Schema.Struct({
  error: Schema.Literal("INTERNAL_SERVER_ERROR"),
  message: Schema.String
})

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
