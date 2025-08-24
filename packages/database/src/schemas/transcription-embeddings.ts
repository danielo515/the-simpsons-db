import { TranscriptionEmbedding as DomainTranscriptionEmbedding } from "@simpsons-db/domain"
import { index, pgTable, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core"
import { Schema } from "effect"
import { transcriptions } from "./transcriptions.js"

export const transcriptionEmbeddings = pgTable("transcription_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  transcriptionId: uuid("transcription_id").notNull().references(() => transcriptions.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  model: varchar("model", { length: 50 }).notNull().default("text-embedding-ada-002"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("transcription_embeddings_transcription_id_idx").on(table.transcriptionId),
  index("transcription_embeddings_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops"))
])

// Database schema extends domain entity with database-specific fields
export const TranscriptionEmbeddingSchema = DomainTranscriptionEmbedding.pipe(Schema.extend(Schema.Struct({
  updatedAt: Schema.DateFromSelf
})))

export const NewTranscriptionEmbeddingSchema = DomainTranscriptionEmbedding.pipe(
  Schema.omit("id")
)

export type TranscriptionEmbedding = typeof TranscriptionEmbeddingSchema.Type
export type NewTranscriptionEmbedding = typeof NewTranscriptionEmbeddingSchema.Type
