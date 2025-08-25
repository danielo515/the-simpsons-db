import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { EpisodeId, Transcription, TranscriptionId } from "@simpsons-db/domain"
import { and, asc, eq, gte, lte } from "drizzle-orm"
import type { ParseResult } from "effect"
import { Effect, Schema } from "effect"
import type { NewTranscriptionRecord, TranscriptionRecord } from "../schemas/transcriptions.js"
import { transcriptions } from "../schemas/transcriptions.js"
import { DatabaseError, NotFoundError } from "../errors.js"

// Transformation functions between database records and domain entities
const toDomainEntity = (record: TranscriptionRecord): Effect.Effect<Transcription, ParseResult.ParseError, never> =>
  Effect.gen(function*() {
    const id = yield* Schema.decodeUnknown(TranscriptionId)(record.id)
    const episodeId = yield* Schema.decodeUnknown(EpisodeId)(record.episodeId)

    return yield* Schema.decodeUnknown(Transcription)({
      id,
      episodeId,
      segmentIndex: record.segmentIndex,
      startTime: parseFloat(record.startTime),
      endTime: parseFloat(record.endTime),
      text: record.text,
      confidence: record.confidence ? parseFloat(record.confidence) : undefined,
      language: record.language || undefined,
      speaker: record.speaker || undefined
    })
  })

const toDbRecord = (transcription: Omit<Transcription, "id">): NewTranscriptionRecord => ({
  episodeId: transcription.episodeId,
  segmentIndex: transcription.segmentIndex,
  startTime: transcription.startTime.toString(),
  endTime: transcription.endTime.toString(),
  text: transcription.text,
  confidence: transcription.confidence?.toString(),
  language: transcription.language,
  speaker: transcription.speaker
})

export interface TranscriptionFilters {
  episodeId?: EpisodeId
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

    const create = (transcription: Omit<Transcription, "id">) =>
      Effect.gen(function*() {
        const dbRecord = toDbRecord(transcription)
        const result = yield* db.insert(transcriptions).values(dbRecord).returning()
        if (!result[0]) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id: "unknown" }))
        }
        return yield* toDomainEntity(result[0])
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.create"),
        Effect.withSpan("TranscriptionsRepository.create")
      )

    const createMany = (transcriptionList: Array<Omit<Transcription, "id">>) =>
      Effect.gen(function*() {
        const dbRecords = transcriptionList.map(toDbRecord)
        const result = yield* db.insert(transcriptions).values(dbRecords).returning()
        return yield* Effect.forEach(result, toDomainEntity, { concurrency: "unbounded" })
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))
        ),
        Effect.annotateLogs("operation", "TranscriptionsRepository.createMany"),
        Effect.withSpan("TranscriptionsRepository.createMany")
      )

    const findById = (
      id: typeof TranscriptionId.Type
    ): Effect.Effect<Transcription, DatabaseError | NotFoundError | ParseResult.ParseError, PgDrizzle> =>
      Effect.gen(function*() {
        const result = yield* db.select().from(transcriptions).where(eq(transcriptions.id, id))

        if (!result[0]) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id: "unknown" }))
        }
        return yield* toDomainEntity(result[0])
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findById"),
        Effect.withSpan("TranscriptionsRepository.findById")
      )

    const findByEpisodeId = (
      episodeId: typeof EpisodeId.Type
    ): Effect.Effect<ReadonlyArray<Transcription>, DatabaseError | ParseResult.ParseError, PgDrizzle> =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.episodeId, episodeId))
          .orderBy(asc(transcriptions.segmentIndex))

        return yield* Effect.forEach(result, toDomainEntity, { concurrency: "unbounded" })
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findByEpisodeId" }))
        ),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findByEpisodeId"),
        Effect.withSpan("TranscriptionsRepository.findByEpisodeId")
      )

    const findByTimeRange = (
      episodeId: typeof EpisodeId.Type,
      timeRange: TimeRange
    ): Effect.Effect<ReadonlyArray<Transcription>, DatabaseError | ParseResult.ParseError, PgDrizzle> =>
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

        return yield* Effect.forEach(result, toDomainEntity, { concurrency: "unbounded" })
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findByTimeRange" }))
        ),
        Effect.annotateLogs("operation", "TranscriptionsRepository.findByTimeRange"),
        Effect.withSpan("TranscriptionsRepository.findByTimeRange")
      )

    const update = (
      id: typeof TranscriptionId.Type,
      updates: Partial<Omit<Transcription, "id">>
    ): Effect.Effect<Transcription, DatabaseError | NotFoundError | ParseResult.ParseError, PgDrizzle> =>
      Effect.gen(function*() {
        const dbUpdates: Partial<NewTranscriptionRecord> = {
          ...(updates.episodeId && { episodeId: updates.episodeId }),
          ...(updates.segmentIndex !== undefined && { segmentIndex: updates.segmentIndex }),
          ...(updates.startTime !== undefined && { startTime: updates.startTime.toString() }),
          ...(updates.endTime !== undefined && { endTime: updates.endTime.toString() }),
          ...(updates.text && { text: updates.text }),
          ...(updates.confidence !== undefined && { confidence: updates.confidence?.toString() }),
          ...(updates.language !== undefined && { language: updates.language }),
          ...(updates.speaker !== undefined && { speaker: updates.speaker }),
          updatedAt: new Date()
        }

        const result = yield* db
          .update(transcriptions)
          .set(dbUpdates)
          .where(eq(transcriptions.id, id))
          .returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id }))
        }

        if (!result[0]) {
          return yield* Effect.fail(new NotFoundError({ entity: "Transcription", id: "unknown" }))
        }
        return yield* toDomainEntity(result[0])
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
        Effect.annotateLogs("operation", "TranscriptionsRepository.update"),
        Effect.withSpan("TranscriptionsRepository.update")
      )

    const deleteById = (id: typeof TranscriptionId.Type) =>
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

    const getTranscriptionText = (episodeId: typeof EpisodeId.Type, timeRange?: TimeRange) =>
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
      update,
      deleteById,
      getTranscriptionText
    } as const
  })
}) {}
