import { Schema } from "effect"

// Only truly shared field patterns - basic validation helpers
export const BaseFields = {
  // Common validation patterns that are reused across multiple packages
  positiveInt: Schema.Number.pipe(Schema.int(), Schema.positive()),
  nonNegativeInt: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  decimalString: Schema.String.pipe(Schema.pattern(/^\d+(\.\d{1,3})?$/)),
  confidenceNumber: Schema.Number.pipe(Schema.between(0, 1)),
  shortString: (maxLength: number) => Schema.String.pipe(Schema.maxLength(maxLength)),
  optionalString: (maxLength: number) => Schema.optional(Schema.String.pipe(Schema.maxLength(maxLength))),
  optionalDate: Schema.optional(Schema.DateFromSelf)
}
export const NonEmptyString = Schema.String.pipe(Schema.minLength(1))
export const FilePath = Schema.String.pipe(Schema.minLength(1), Schema.brand("FilePath"))
export type FilePath = typeof FilePath.Type

// Common pagination schema - truly shared across packages
export const PaginationQuery = Schema.Struct({
  page: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.positive())),
  limit: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100)))
})

export const PaginationInfo = Schema.Struct({
  page: Schema.Number,
  limit: Schema.Number,
  total: Schema.Number,
  totalPages: Schema.Number
})

export const PaginatedResponse = <A, I, R>(itemSchema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    data: Schema.Array(itemSchema),
    pagination: PaginationInfo
  })
