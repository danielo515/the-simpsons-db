import { Data } from "effect"

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown
  readonly operation: string
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entity: string
  readonly [key: string]: unknown
}> {}
