import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { and, asc, eq, gte, lte } from "drizzle-orm"
import { Effect } from "effect"
import type { NewTranscription, Transcription } from "../schemas/transcriptions.js"
import { transcriptions } from "../schemas/transcriptions.js"
import { DatabaseError, NotFoundError } from "./episodes.js"

export interface TranscriptionFilters {
  episodeId?: string
  startTime?: number
  endTime?: number
  speaker?: string
  language?: string
}

export interface TimeRange {
  startTime: number
  endTime: number
}

export class TranscriptionsRepository extends Effect.Service<TranscriptionsRepository>()("TranscriptionsRepository", {
  accessors: true,
  effect: Effect.gen(function*() {
    const db = yield* PgDrizzle

    const create = (data: NewTranscription) =>
      Effect.gen(function*() {
        const result = yield* db.insert(transcriptions).values(data).returning()
        return result[0] as Transcription
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.create"),
        Effect.withSpan("TranscriptionsRepository.create")
      )

    const createMany = (data: Array<NewTranscription>) =>
      Effect.gen(function*() {
        const result = yield* db.insert(transcriptions).values(data).returning()
        return result as Array<Transcription>
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))
        ),
        Effect.annotateLogs("operation", "TranscriptionsRepository.createMany"),
        Effect.withSpan("TranscriptionsRepository.createMany")
      )

    const findById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(transcriptions).where(eq(transcriptions.id, id))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id }))
        }

        return result[0] as Transcription
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findById"),
        Effect.withSpan("TranscriptionsRepository.findById", { id })
      )

    const findByEpisodeId = (episodeId: string) =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.episodeId, episodeId))
          .orderBy(asc(transcriptions.segmentIndex))

        return result as Array<Transcription>
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByEpisodeId" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findByEpisodeId"),
        Effect.withSpan("TranscriptionsRepository.findByEpisodeId", { episodeId })
      )

    const findByTimeRange = (episodeId: string, timeRange: TimeRange) =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.episodeId, episodeId),
              gte(transcriptions.endTime, timeRange.startTime.toString()),
              lte(transcriptions.startTime, timeRange.endTime.toString())
            )
          )
          .orderBy(asc(transcriptions.startTime))

        return result as Array<Transcription>
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByTimeRange" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findByTimeRange"),
        Effect.withSpan("TranscriptionsRepository.findByTimeRange", { episodeId, timeRange })
      )

    const findBySpeaker = (episodeId: string, speaker: string) =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(transcriptions)
          .where(
            and(
              eq(transcriptions.episodeId, episodeId),
              eq(transcriptions.speaker, speaker)
            )
          )
          .orderBy(asc(transcriptions.startTime))

        return result as Array<Transcription>
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findBySpeaker" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findBySpeaker"),
        Effect.withSpan("TranscriptionsRepository.findBySpeaker", { episodeId, speaker })
      )

    const findAll = (filters?: TranscriptionFilters) =>
      Effect.gen(function*() {
        let query = db.select().from(transcriptions)

        const conditions = []

        if (filters?.episodeId) {
          conditions.push(eq(transcriptions.episodeId, filters.episodeId))
        }

        if (filters?.startTime !== undefined) {
          conditions.push(gte(transcriptions.startTime, filters.startTime.toString()))
        }

        if (filters?.endTime !== undefined) {
          conditions.push(lte(transcriptions.endTime, filters.endTime.toString()))
        }

        if (filters?.speaker) {
          conditions.push(eq(transcriptions.speaker, filters.speaker))
        }

        if (filters?.language) {
          conditions.push(eq(transcriptions.language, filters.language))
        }

        if (conditions.length > 0) {
          query = query.where(and(...conditions))
        }

        const result = yield* query.orderBy(asc(transcriptions.startTime))
        return result as Array<Transcription>
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findAll"),
        Effect.withSpan("TranscriptionsRepository.findAll")
      )

    const update = (id: string, data: Partial<NewTranscription>) =>
      Effect.gen(function*() {
        const result = yield* db
          .update(transcriptions)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(transcriptions.id, id))
          .returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id }))
        }

        return result[0] as Transcription
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.update"),
        Effect.withSpan("TranscriptionsRepository.update")
      )

    const deleteById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.delete(transcriptions).where(eq(transcriptions.id, id)).returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id }))
        }
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "delete" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.delete"),
        Effect.withSpan("TranscriptionsRepository.delete")
      )

    const deleteByEpisodeId = (episodeId: string) =>
      Effect.gen(function*() {
        yield* db.delete(transcriptions).where(eq(transcriptions.episodeId, episodeId))
      }).pipe(
        Effect.annotateLogs("operation", "TranscriptionsRepository.deleteByEpisodeId"),
        Effect.withSpan("TranscriptionsRepository.deleteByEpisodeId")
      )

    const getTranscriptionText = (episodeId: string, timeRange?: TimeRange) =>
      Effect.gen(function*() {
        const transcriptionSegments = timeRange
          ? yield* findByTimeRange(episodeId, timeRange)
          : yield* findByEpisodeId(episodeId)

        return transcriptionSegments
          .map((segment) => segment.text)
          .join(" ")
      }).pipe(
        Effect.annotateLogs("operation", "TranscriptionsRepository.getTranscriptionText"),
        Effect.withSpan("TranscriptionsRepository.getTranscriptionText")
      )

    return {
      create,
      createMany,
      findById,
      findByEpisodeId,
      findByTimeRange,
      findBySpeaker,
      findAll,
      update,
      deleteById,
      deleteByEpisodeId,
      getTranscriptionText
    } as const
  })
}) {}
