import { PgDrizzle } from "@effect/sql-drizzle"
import { eq, sql } from "drizzle-orm"
import { Effect } from "effect"
import { episodes } from "../schemas/episodes.js"
import type { NewTranscriptionEmbedding, TranscriptionEmbedding } from "../schemas/transcription-embeddings.js"
import { transcriptionEmbeddings } from "../schemas/transcription-embeddings.js"
import { transcriptions } from "../schemas/transcriptions.js"
import { DatabaseError, NotFoundError } from "./episodes.js"

export interface SimilarityResult {
  id: string
  transcriptionId: string
  embedding: Array<number>
  similarity: number
  text: string
  startTime: string
  endTime: string
  episodeId: string
  episodeTitle?: string
  season?: number
  episodeNumber?: number
}

export interface EmbeddingFilters {
  transcriptionId?: string
  model?: string
}

export class TranscriptionEmbeddingsRepository
  extends Effect.Service<TranscriptionEmbeddingsRepository>()("TranscriptionEmbeddingsRepository", {
    accessors: true,
    effect: Effect.gen(function*() {
      const db = yield* PgDrizzle

      const create = (data: NewTranscriptionEmbedding) =>
        Effect.gen(function*() {
          const result = yield* db.insert(transcriptionEmbeddings).values(data).returning()
          return result[0] as TranscriptionEmbedding
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.create"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.create")
        )

      const createMany = (data: Array<NewTranscriptionEmbedding>) =>
        Effect.gen(function*() {
          const result = yield* db.insert(transcriptionEmbeddings).values(data).returning()
          return result as Array<TranscriptionEmbedding>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.createMany"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.createMany")
        )

      const findById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db.select().from(transcriptionEmbeddings).where(eq(transcriptionEmbeddings.id, id))

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id }))
          }

          return result[0] as TranscriptionEmbedding
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))
          ),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findById"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findById", { id })
        )

      const findByTranscriptionId = (transcriptionId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(transcriptionEmbeddings)
            .where(eq(transcriptionEmbeddings.transcriptionId, transcriptionId))

          return result as Array<TranscriptionEmbedding>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByTranscriptionId" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findByTranscriptionId"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findByTranscriptionId", { transcriptionId })
        )

      const findSimilar = (queryEmbedding: Array<number>, limit: number = 10, threshold: number = 0.7) =>
        Effect.gen(function*() {
          const embeddingVector = `[${queryEmbedding.join(",")}]`

          const result = yield* db.execute(
            sql`
            SELECT 
              e.id,
              e.transcription_id,
              e.embedding,
              e.model,
              e.created_at,
              e.updated_at,
              t.text,
              t.start_time,
              t.end_time,
              t.episode_id,
              ep.file_name as episode_title,
              1 - (e.embedding <=> ${embeddingVector}::vector) as similarity
            FROM ${transcriptionEmbeddings} e
            JOIN ${transcriptions} t ON e.transcription_id = t.id
            JOIN ${episodes} ep ON t.episode_id = ep.id
            WHERE 1 - (e.embedding <=> ${embeddingVector}::vector) >= ${threshold}
            ORDER BY e.embedding <=> ${embeddingVector}::vector
            LIMIT ${limit}
          `
          )

          return result.rows.map((row) => ({
            id: row.id as string,
            transcriptionId: row.transcription_id as string,
            embedding: row.embedding as Array<number>,
            similarity: row.similarity as number,
            text: row.text as string,
            startTime: row.start_time as string,
            endTime: row.end_time as string,
            episodeId: row.episode_id as string,
            episodeTitle: row.episode_title as string
          })) as Array<SimilarityResult>
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findSimilar" }))
          ),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findSimilar"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findSimilar", { limit, threshold })
        )

      const findSimilarInEpisode = (
        episodeId: string,
        queryEmbedding: Array<number>,
        limit: number = 10,
        threshold: number = 0.7
      ) =>
        Effect.gen(function*() {
          const embeddingVector = `[${queryEmbedding.join(",")}]`

          const result = yield* db.execute(
            sql`
            SELECT 
              e.id,
              e.transcription_id,
              e.embedding,
              e.model,
              e.created_at,
              e.updated_at,
              t.text,
              t.start_time,
              t.end_time,
              t.episode_id,
              ep.file_name as episode_title,
              1 - (e.embedding <=> ${embeddingVector}::vector) as similarity
            FROM ${transcriptionEmbeddings} e
            JOIN ${transcriptions} t ON e.transcription_id = t.id
            JOIN ${episodes} ep ON t.episode_id = ep.id
            WHERE t.episode_id = ${episodeId}
              AND 1 - (e.embedding <=> ${embeddingVector}::vector) >= ${threshold}
            ORDER BY e.embedding <=> ${embeddingVector}::vector
            LIMIT ${limit}
          `
          )

          return result.rows.map((row) => ({
            id: row.id as string,
            transcriptionId: row.transcription_id as string,
            embedding: row.embedding as Array<number>,
            similarity: row.similarity as number,
            text: row.text as string,
            startTime: row.start_time as string,
            endTime: row.end_time as string,
            episodeId: row.episode_id as string,
            episodeTitle: row.episode_title as string
          })) as Array<SimilarityResult>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findSimilarInEpisode" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findSimilarInEpisode"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findSimilarInEpisode", { episodeId, limit, threshold })
        )

      const findAll = (filters?: EmbeddingFilters) =>
        Effect.gen(function*() {
          let query = db.select().from(transcriptionEmbeddings)

          if (filters?.transcriptionId) {
            query = query.where(eq(transcriptionEmbeddings.transcriptionId, filters.transcriptionId))
          }

          if (filters?.model) {
            query = query.where(eq(transcriptionEmbeddings.model, filters.model))
          }

          const result = yield* query
          return result as Array<TranscriptionEmbedding>
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))
          ),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findAll"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findAll")
        )

      const update = (id: string, data: Partial<NewTranscriptionEmbedding>) =>
        Effect.gen(function*() {
          const result = yield* db
            .update(transcriptionEmbeddings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(transcriptionEmbeddings.id, id))
            .returning()

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id }))
          }

          return result[0] as TranscriptionEmbedding
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.update"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.update", { id })
        )

      const deleteById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db.delete(transcriptionEmbeddings).where(eq(transcriptionEmbeddings.id, id)).returning()

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id }))
          }
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "delete" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.delete"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.delete", { id })
        )

      const deleteByTranscriptionId = (transcriptionId: string) =>
        Effect.gen(function*() {
          yield* db.delete(transcriptionEmbeddings).where(eq(transcriptionEmbeddings.transcriptionId, transcriptionId))
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "deleteByTranscriptionId" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.deleteByTranscriptionId"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.deleteByTranscriptionId", { transcriptionId })
        )

      return {
        create,
        createMany,
        findById,
        findByTranscriptionId,
        findSimilar,
        findSimilarInEpisode,
        findAll,
        update,
        deleteById,
        deleteByTranscriptionId
      } as const
    })
  })
{}
