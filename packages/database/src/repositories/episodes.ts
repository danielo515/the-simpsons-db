import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { Episode, type EpisodeId } from "@simpsons-db/domain/entities/episode"
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm"
import { Effect } from "effect"
import { DatabaseError, NotFoundError } from "../errors.js"
import type { EpisodeRow, NewEpisodeRow } from "../schemas/episodes.js"
import { episodes } from "../schemas/episodes.js"

export interface EpisodeFilters {
  processed?: boolean
  hasError?: boolean
}

export class EpisodesRepository extends Effect.Service<EpisodesRepository>()("EpisodesRepository", {
  accessors: true,
  effect: Effect.gen(function*() {
    const db = yield* PgDrizzle
    const mapDbRowToDomain = (dbResult: EpisodeRow) => ({
      id: dbResult.id,
      season: 1, // Default values since episodes table doesn't store episode metadata
      episodeNumber: 1,
      title: "Unknown Episode",
      airDate: undefined,
      description: undefined,
      mimeType: undefined,
      videoMetadata: {
        duration: parseFloat(dbResult.duration),
        codec: dbResult.codec || undefined,
        bitrate: dbResult.bitrate || undefined,
        frameRate: dbResult.frameRate ? parseFloat(dbResult.frameRate) : undefined,
        audioCodec: dbResult.audioCodec || undefined,
        audioChannels: dbResult.audioChannels || undefined,
        audioSampleRate: dbResult.audioSampleRate || undefined,
        width: undefined,
        height: undefined
      },
      filePath: dbResult.filePath as typeof Episode.Type.filePath,
      fileName: dbResult.fileName,
      fileSize: dbResult.fileSize,
      checksum: dbResult.checksum,
      processingStatus: dbResult.processed ? "completed" as const : "pending" as const,
      transcriptionStatus: "pending" as const,
      thumbnailStatus: "pending" as const,
      metadataStatus: "pending" as const
    })

    const create = (data: NewEpisodeRow) =>
      Effect.gen(function*() {
        const [result] = yield* db.insert(episodes).values(data).returning()
        if (!result) {
          return yield* new DatabaseError({ cause: "Database did not return the value", operation: "create" })
        }
        return Episode.make(mapDbRowToDomain(result))
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.create"),
        Effect.withSpan("EpisodesRepository.create")
      )

    const findById = (id: EpisodeId) =>
      Effect.gen(function*() {
        const [row] = yield* db.select().from(episodes).where(eq(episodes.id, id))

        if (!row) {
          return yield* new NotFoundError({ entity: "Episode", id })
        }

        return Episode.make(mapDbRowToDomain(row))
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findById"),
        Effect.withSpan("EpisodesRepository.findById")
      )

    const findByFilePath = (filePath: string) =>
      Effect.gen(function*() {
        const [row] = yield* db.select().from(episodes).where(eq(episodes.filePath, filePath))

        if (!row) {
          return yield* new NotFoundError({ entity: "Episode", filePath })
        }

        return Episode.make(mapDbRowToDomain(row))
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByFilePath" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findByFilePath"),
        Effect.withSpan("EpisodesRepository.findByFilePath")
      )

    const findByChecksum = (checksum: string) =>
      Effect.gen(function*() {
        const [row] = yield* db.select().from(episodes).where(eq(episodes.checksum, checksum))

        if (!row) {
          return yield* new NotFoundError({ entity: "Episode", checksum })
        }

        return Episode.make(mapDbRowToDomain(row))
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByChecksum" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findByChecksum"),
        Effect.withSpan("EpisodesRepository.findByChecksum")
      )

    const findAll = (filters?: EpisodeFilters) =>
      Effect.gen(function*() {
        const conditions = []

        if (filters?.processed !== undefined) {
          conditions.push(eq(episodes.processed, filters.processed))
        }

        if (filters?.hasError !== undefined) {
          if (filters.hasError) {
            conditions.push(isNotNull(episodes.processingError))
          } else {
            conditions.push(isNull(episodes.processingError))
          }
        }

        const result = yield* db.select().from(episodes).where(and(...conditions)).orderBy(asc(episodes.createdAt))
        return result.map((item) => Episode.make(mapDbRowToDomain(item)))
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findAll"),
        Effect.withSpan("EpisodesRepository.findAll")
      )

    const update = (
      id: EpisodeId,
      data: Partial<NewEpisodeRow> & {
        processed?: boolean
        processingStartedAt?: Date
        processingCompletedAt?: Date
        processingError?: string | null
      }
    ) =>
      Effect.gen(function*() {
        const [row] = yield* db
          .update(episodes)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(episodes.id, id))
          .returning()

        if (!row) {
          return yield* new NotFoundError({ entity: "Episode", id })
        }
        return Episode.make(mapDbRowToDomain(row))
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.update"),
        Effect.withSpan("EpisodesRepository.update")
      )

    const markProcessingStarted = (id: EpisodeId) => update(id, { processingStartedAt: new Date() })

    const markProcessingCompleted = (id: EpisodeId) =>
      update(id, {
        processed: true,
        processingCompletedAt: new Date(),
        processingError: null
      })

    const markProcessingFailed = (id: EpisodeId, error: string) =>
      update(id, {
        processed: false,
        processingError: error,
        processingCompletedAt: new Date()
      })

    const deleteById = (id: EpisodeId) =>
      Effect.gen(function*() {
        yield* db.delete(episodes).where(eq(episodes.id, id)).returning()
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "delete" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.delete"),
        Effect.withSpan("EpisodesRepository.delete")
      )

    return {
      create,
      findById,
      findByFilePath,
      findByChecksum,
      findAll,
      update,
      markProcessingStarted,
      markProcessingCompleted,
      markProcessingFailed,
      deleteById
    } as const
  })
}) {}
