import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { TranscriptionEmbedding as DomainTranscriptionEmbedding } from "@simpsons-db/domain"
import { and, eq, sql } from "drizzle-orm"
import { Effect, Schema } from "effect"
import { DatabaseError, NotFoundError } from "../errors.js"
import { episodes } from "../schemas/episodes.js"
import type { NewTranscriptionEmbedding } from "../schemas/transcription-embeddings.js"
import { transcriptionEmbeddings } from "../schemas/transcription-embeddings.js"
import { transcriptions } from "../schemas/transcriptions.js"

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
          const result = yield* db.insert(transcriptionEmbeddings).values({
            ...data,
            embedding: Array.from(data.embedding)
          }).returning()
          if (!result[0]) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id: "unknown" }))
          }
          return yield* Schema.decodeUnknown(DomainTranscriptionEmbedding)({
            id: result[0].id,
            transcriptionId: result[0].transcriptionId,
            embedding: result[0].embedding,
            model: result[0].model
          })
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.create"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.create")
        )

      const createMany = (data: Array<NewTranscriptionEmbedding>) =>
        Effect.gen(function*() {
          const transformedData = data.map((item) => ({
            ...item,
            embedding: Array.from(item.embedding)
          }))
          const result = yield* db.insert(transcriptionEmbeddings).values(transformedData).returning()
          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainTranscriptionEmbedding)({
              id: item.id,
              transcriptionId: item.transcriptionId,
              embedding: item.embedding,
              model: item.model
            }), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.createMany"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.createMany")
        )

      const findById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db.select().from(transcriptionEmbeddings).where(eq(transcriptionEmbeddings.id, id))

          const record = result[0]
          if (!record) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id }))
          }

          return yield* Schema.decodeUnknown(DomainTranscriptionEmbedding)({
            id: record.id,
            transcriptionId: record.transcriptionId,
            embedding: record.embedding,
            model: record.model
          })
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))
          ),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findById"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findById", { attributes: { id } })
        )

      const findByTranscriptionId = (transcriptionId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(transcriptionEmbeddings)
            .where(eq(transcriptionEmbeddings.transcriptionId, transcriptionId))

          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainTranscriptionEmbedding)({
              id: item.id,
              transcriptionId: item.transcriptionId,
              embedding: item.embedding,
              model: item.model
            }), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByTranscriptionId" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.findByTranscriptionId"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.findByTranscriptionId", {
            attributes: { transcriptionId }
          })
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

          return result.map((row) => ({
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
          Effect.withSpan("TranscriptionEmbeddingsRepository.findSimilar", { attributes: { limit, threshold } })
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

          return result.map((row) => ({
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
          Effect.withSpan("TranscriptionEmbeddingsRepository.findSimilarInEpisode", {
            attributes: { episodeId, limit, threshold }
          })
        )

      const findAll = (filters?: EmbeddingFilters) =>
        Effect.gen(function*() {
          const conditions = []

          if (filters?.transcriptionId) {
            conditions.push(eq(transcriptionEmbeddings.transcriptionId, filters.transcriptionId))
          }

          if (filters?.model) {
            conditions.push(eq(transcriptionEmbeddings.model, filters.model))
          }

          const baseQuery = db.select().from(transcriptionEmbeddings)

          const query = conditions.length > 0
            ? baseQuery.where(and(...conditions))
            : baseQuery

          const result = yield* query
          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainTranscriptionEmbedding)({
              id: item.id,
              transcriptionId: item.transcriptionId,
              embedding: item.embedding,
              model: item.model
            }), { concurrency: "unbounded" })
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
            .set({
              ...data,
              embedding: data.embedding ? Array.from(data.embedding) : undefined,
              updatedAt: new Date()
            })
            .where(eq(transcriptionEmbeddings.id, id))
            .returning()

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "TranscriptionEmbedding", id }))
          }

          const [updatedRecord] = result
          if (!updatedRecord) {
            return yield* Effect.fail(
              new DatabaseError({ cause: "Database did not return the updated value", operation: "update" })
            )
          }

          return yield* Schema.decodeUnknown(DomainTranscriptionEmbedding)(updatedRecord)
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.update"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.update", { attributes: { id } })
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
          Effect.withSpan("TranscriptionEmbeddingsRepository.delete", { attributes: { id } })
        )

      const deleteByTranscriptionId = (transcriptionId: string) =>
        Effect.gen(function*() {
          yield* db.delete(transcriptionEmbeddings).where(eq(transcriptionEmbeddings.transcriptionId, transcriptionId))
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "deleteByTranscriptionId" }))),
          Effect.annotateLogs("operation", "TranscriptionEmbeddingsRepository.deleteByTranscriptionId"),
          Effect.withSpan("TranscriptionEmbeddingsRepository.deleteByTranscriptionId", {
            attributes: { transcriptionId }
          })
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
