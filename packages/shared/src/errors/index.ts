import { Schema } from "effect"

export class DatabaseError extends Schema.TaggedError<DatabaseError>("DatabaseError")(
  "DatabaseError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
  }
) {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>("NotFoundError")(
  "NotFoundError",
  {
    message: Schema.String,
    id: Schema.optional(Schema.String),
    resource: Schema.optional(Schema.String)
  }
) {}

export class ValidationError extends Schema.TaggedError<ValidationError>("ValidationError")(
  "ValidationError",
  {
    message: Schema.String,
    field: Schema.optional(Schema.String),
    value: Schema.optional(Schema.Unknown)
  }
) {}

export class FileSystemError extends Schema.TaggedError<FileSystemError>("FileSystemError")(
  "FileSystemError",
  {
    message: Schema.String,
    path: Schema.optional(Schema.String),
    operation: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown)
  }
) {}

export class ProcessingError extends Schema.TaggedError<ProcessingError>("ProcessingError")(
  "ProcessingError",
  {
    message: Schema.String,
    stage: Schema.optional(Schema.String),
    details: Schema.optional(Schema.Unknown)
  }
) {}

export class FFmpegError extends Schema.TaggedError<FFmpegError>("FFmpegError")(
  "FFmpegError",
  {
    message: Schema.String,
    command: Schema.optional(Schema.String),
    exitCode: Schema.optional(Schema.Number)
  }
) {}

export class OpenAIError extends Schema.TaggedError<OpenAIError>("OpenAIError")(
  "OpenAIError",
  {
    message: Schema.String,
    statusCode: Schema.optional(Schema.Number),
    requestId: Schema.optional(Schema.String)
  }
) {}

export class ConfigurationError extends Schema.TaggedError<ConfigurationError>("ConfigurationError")(
  "ConfigurationError",
  {
    message: Schema.String,
    key: Schema.optional(Schema.String)
  }
) {}
