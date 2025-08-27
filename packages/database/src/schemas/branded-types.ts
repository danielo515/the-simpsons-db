import { Schema } from "effect"

// Branded ID types using Effect Schema primitives
export const EpisodeId = Schema.String.pipe(Schema.brand("EpisodeId"))
export type EpisodeId = Schema.Schema.Type<typeof EpisodeId>

export const TranscriptionId = Schema.String.pipe(Schema.brand("TranscriptionId"))
export type TranscriptionId = Schema.Schema.Type<typeof TranscriptionId>

export const TranscriptionEmbeddingId = Schema.String.pipe(Schema.brand("TranscriptionEmbeddingId"))
export type TranscriptionEmbeddingId = Schema.Schema.Type<typeof TranscriptionEmbeddingId>

export const ThumbnailId = Schema.String.pipe(Schema.brand("ThumbnailId"))
export type ThumbnailId = Schema.Schema.Type<typeof ThumbnailId>

export const EpisodeMetadataId = Schema.String.pipe(Schema.brand("EpisodeMetadataId"))
export type EpisodeMetadataId = Schema.Schema.Type<typeof EpisodeMetadataId>
