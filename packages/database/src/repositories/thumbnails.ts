import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import type { SQL } from "drizzle-orm"
import { and, asc, eq, gte, lte, sql } from "drizzle-orm"
import { Effect } from "effect"
import { DatabaseError, NotFoundError } from "../errors.js"
import type { NewThumbnail, Thumbnail } from "../schemas/thumbnails.js"
import { thumbnails } from "../schemas/thumbnails.js"

export interface ThumbnailFilters {
  episodeId?: string
  startTimestamp?: number
  endTimestamp: number
  format?: string
}

export interface ThumbnailTimeRange {
  startTimestamp: number
  endTimestamp: number
}

export class ThumbnailsRepository extends Effect.Service<ThumbnailsRepository>()("ThumbnailsRepository", {
  accessors: true,
  effect: Effect.gen(function*() {
    const db = yield* PgDrizzle

    const create = (data: NewThumbnail) =>
      Effect.gen(function*() {
        const result = yield* db.insert(thumbnails).values(data).returning()
        return result[0] as Thumbnail
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.create"),
        Effect.withSpan("ThumbnailsRepository.create")
      )

    const createMany = (data: Array<NewThumbnail>) =>
      Effect.gen(function*() {
        const result = yield* db.insert(thumbnails).values(data).returning()
        return result as Array<Thumbnail>
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))
        ),
        Effect.annotateLogs("operation", "ThumbnailsRepository.createMany"),
        Effect.withSpan("ThumbnailsRepository.createMany")
      )

    const findById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(thumbnails).where(eq(thumbnails.id, id))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Thumbnail", id }))
        }

        return result[0] as Thumbnail
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findById"),
        Effect.withSpan("ThumbnailsRepository.findById")
      )

    const findByEpisodeId = (episodeId: string) =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(thumbnails)
          .where(eq(thumbnails.episodeId, episodeId))
          .orderBy(asc(thumbnails.timestamp))

        return result as Array<Thumbnail>
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByEpisodeId" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findByEpisodeId"),
        Effect.withSpan("ThumbnailsRepository.findByEpisodeId")
      )

    const findByFilePath = (filePath: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(thumbnails).where(eq(thumbnails.filePath, filePath))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Thumbnail", filePath }))
        }

        return result[0] as Thumbnail
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByFilePath" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findByFilePath"),
        Effect.withSpan("ThumbnailsRepository.findByFilePath")
      )

    const findByTimeRange = (episodeId: string, timeRange: ThumbnailTimeRange) =>
      Effect.gen(function*() {
        const result = yield* db
          .select()
          .from(thumbnails)
          .where(
            and(
              eq(thumbnails.episodeId, episodeId),
              gte(thumbnails.timestamp, timeRange.startTimestamp.toString()),
              lte(thumbnails.timestamp, timeRange.endTimestamp.toString())
            )
          )
          .orderBy(asc(thumbnails.timestamp))

        return result as Array<Thumbnail>
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByTimeRange" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findByTimeRange"),
        Effect.withSpan("ThumbnailsRepository.findByTimeRange")
      )

    const findNearestToTimestamp = (episodeId: string, timestamp: number) =>
      Effect.gen(function*() {
        const result = yield* db.execute(
          sql`
            SELECT *
            FROM ${thumbnails}
            WHERE episode_id = ${episodeId}
            ORDER BY ABS(CAST(timestamp AS DECIMAL) - ${timestamp})
            LIMIT 1
          `
        )

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Thumbnail", episodeId, timestamp }))
        }

        return result[0] as Thumbnail
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findNearestToTimestamp" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findNearestToTimestamp"),
        Effect.withSpan("ThumbnailsRepository.findNearestToTimestamp")
      )

    const findAll = (filters?: ThumbnailFilters) =>
      Effect.gen(function*() {
        const conditions: Array<SQL> = []

        if (filters?.episodeId) {
          conditions.push(eq(thumbnails.episodeId, filters.episodeId))
        }

        if (filters?.startTimestamp !== undefined) {
          conditions.push(gte(thumbnails.timestamp, filters.startTimestamp.toString()))
        }

        if (filters?.endTimestamp !== undefined) {
          conditions.push(lte(thumbnails.timestamp, filters.endTimestamp.toString()))
        }

        if (filters?.format) {
          conditions.push(eq(thumbnails.format, filters.format))
        }

        const result = yield* db.select().from(thumbnails).where(and(...conditions)).orderBy(asc(thumbnails.timestamp))
        return result
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.findAll"),
        Effect.withSpan("ThumbnailsRepository.findAll")
      )

    const update = (id: string, data: Partial<NewThumbnail>) =>
      Effect.gen(function*() {
        const result = yield* db
          .update(thumbnails)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(thumbnails.id, id))
          .returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Thumbnail", id }))
        }

        return result[0]
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.update"),
        Effect.withSpan("ThumbnailsRepository.update")
      )

    const deleteById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.delete(thumbnails).where(eq(thumbnails.id, id)).returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Thumbnail", id }))
        }
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "delete" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.delete"),
        Effect.withSpan("ThumbnailsRepository.delete")
      )

    const deleteByEpisodeId = (episodeId: string) =>
      Effect.gen(function*() {
        yield* db.delete(thumbnails).where(eq(thumbnails.episodeId, episodeId))
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "deleteByEpisodeId" }))),
        Effect.annotateLogs("operation", "ThumbnailsRepository.deleteByEpisodeId"),
        Effect.withSpan("ThumbnailsRepository.deleteByEpisodeId")
      )

    const getThumbnailsForTimeRange = (episodeId: string, startTime: number, endTime: number, maxCount: number = 10) =>
      Effect.gen(function*() {
        const result = yield* db.execute(
          sql`
            SELECT *
            FROM ${thumbnails}
            WHERE episode_id = ${episodeId}
              AND CAST(timestamp AS DECIMAL) BETWEEN ${startTime} AND ${endTime}
            ORDER BY timestamp
            LIMIT ${maxCount}
          `
        )

        return result
      }).pipe(
        Effect.catchTag(
          "SqlError",
          (error) => Effect.fail(new DatabaseError({ cause: error, operation: "getThumbnailsForTimeRange" }))
        ),
        Effect.annotateLogs("operation", "ThumbnailsRepository.getThumbnailsForTimeRange"),
        Effect.withSpan("ThumbnailsRepository.getThumbnailsForTimeRange")
      )

    return {
      create,
      createMany,
      findById,
      findByEpisodeId,
      findByFilePath,
      findByTimeRange,
      findNearestToTimestamp,
      findAll,
      update,
      deleteById,
      deleteByEpisodeId,
      getThumbnailsForTimeRange
    } as const
  })
}) {}
