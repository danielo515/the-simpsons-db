import { Schema } from "effect"

// Consolidated error schemas using direct Schema.Struct definitions
export class DatabaseErrorSchema extends Schema.TaggedError<DatabaseErrorSchema>("DatabaseError")(
  "DatabaseError",
  Schema.Struct({
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
  })
) {}

export class NotFoundErrorSchema extends Schema.TaggedError<NotFoundErrorSchema>("NotFoundError")(
  "NotFoundError",
  Schema.Struct({
    message: Schema.String,
    id: Schema.optional(Schema.String),
    resource: Schema.optional(Schema.String)
  })
) {}

export class ValidationErrorSchema extends Schema.TaggedError<ValidationErrorSchema>("ValidationError")(
  "ValidationError",
  Schema.Struct({
    message: Schema.String,
    field: Schema.optional(Schema.String),
    value: Schema.optional(Schema.Unknown),
    errors: Schema.optional(Schema.Array(Schema.String))
  })
) {}

export class FileSystemErrorSchema extends Schema.TaggedError<FileSystemErrorSchema>("FileSystemError")(
  "FileSystemError",
  Schema.Struct({
    message: Schema.String,
    path: Schema.optional(Schema.String),
    operation: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown)
  })
) {}

export class ProcessingErrorSchema extends Schema.TaggedError<ProcessingErrorSchema>("ProcessingError")(
  "ProcessingError",
  Schema.Struct({
    message: Schema.String,
    stage: Schema.optional(Schema.String),
    details: Schema.optional(Schema.Unknown)
  })
) {}

export class FFmpegErrorSchema extends Schema.TaggedError<FFmpegErrorSchema>("FFmpegError")(
  "FFmpegError",
  Schema.Struct({
    message: Schema.String,
    command: Schema.optional(Schema.String),
    exitCode: Schema.optional(Schema.Number)
  })
) {}

export class OpenAIErrorSchema extends Schema.TaggedError<OpenAIErrorSchema>("OpenAIError")(
  "OpenAIError",
  Schema.Struct({
    message: Schema.String,
    statusCode: Schema.optional(Schema.Number),
    requestId: Schema.optional(Schema.String)
  })
) {}

export class ConfigurationErrorSchema extends Schema.TaggedError<ConfigurationErrorSchema>("ConfigurationError")(
  "ConfigurationError",
  Schema.Struct({
    message: Schema.String,
    key: Schema.optional(Schema.String)
  })
) {}

export class InternalServerErrorSchema extends Schema.TaggedError<InternalServerErrorSchema>("InternalServerError")(
  "InternalServerError",
  Schema.Struct({
    message: Schema.String
  })
) {}
