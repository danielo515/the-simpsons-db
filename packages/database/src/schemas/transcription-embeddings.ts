import { index, pgTable, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core"
import type { TranscriptionEmbeddingId, TranscriptionId } from "./branded-types.js"
import { transcriptions } from "./transcriptions.js"

export const transcriptionEmbeddings = pgTable("transcription_embeddings", {
  id: uuid("id").primaryKey().defaultRandom().$type<TranscriptionEmbeddingId>(),
  transcriptionId: uuid("transcription_id").notNull().references(() => transcriptions.id, { onDelete: "cascade" })
    .$type<TranscriptionId>(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  model: varchar("model", { length: 50 }).notNull().default("text-embedding-ada-002"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("transcription_embeddings_transcription_id_idx").on(table.transcriptionId),
  index("transcription_embeddings_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops"))
])

// Database types inferred from Drizzle schema
export type TranscriptionEmbeddingRow = typeof transcriptionEmbeddings.$inferSelect
export type NewTranscriptionEmbeddingRow = typeof transcriptionEmbeddings.$inferInsert
