import { Schema } from "effect"

// Health Check Schemas
export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.String,
  service: Schema.String
})

// Episode Schemas
export const Episode = Schema.Struct({
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

export const EpisodesResponse = PaginatedResponse(Episode)

// Path Parameters
export const EpisodeIdParam = Schema.Struct({
  id: Schema.UUID
})

// Error Schemas
export const NotFoundError = Schema.Struct({
  message: Schema.String,
  code: Schema.Literal("NOT_FOUND")
})

export const ValidationError = Schema.Struct({
  message: Schema.String,
  code: Schema.Literal("VALIDATION_ERROR"),
  details: Schema.optional(Schema.Array(Schema.String))
})

export const InternalServerError = Schema.Struct({
  message: Schema.String,
  code: Schema.Literal("INTERNAL_SERVER_ERROR")
})
