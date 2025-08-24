import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { asc, eq, isNotNull, isNull } from "drizzle-orm"
import { Data, Effect } from "effect"
import type { Episode, NewEpisode } from "../schemas/episodes.js"
import { episodes } from "../schemas/episodes.js"

export interface EpisodeFilters {
  processed?: boolean
  hasError?: boolean
}

export class EpisodesRepository extends Effect.Service<EpisodesRepository>()("EpisodesRepository", {
  accessors: true,
  effect: Effect.gen(function*() {
    const db = yield* PgDrizzle
    const create = (data: NewEpisode) =>
      Effect.gen(function*() {
        const result = yield* db.insert(episodes).values(data).returning()
        return result[0] as Episode
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.create"),
        Effect.withSpan("EpisodesRepository.create")
      )

    const findById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(episodes).where(eq(episodes.id, id))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Episode", id }))
        }

        return result[0]
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findById"),
        Effect.withSpan("EpisodesRepository.findById")
      )

    const findByFilePath = (filePath: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(episodes).where(eq(episodes.filePath, filePath))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Episode", filePath }))
        }

        return result[0] as Episode
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByFilePath" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findByFilePath"),
        Effect.withSpan("EpisodesRepository.findByFilePath")
      )

    const findByChecksum = (checksum: string) =>
      Effect.gen(function*() {
        const result = yield* db.select().from(episodes).where(eq(episodes.checksum, checksum))

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Episode", checksum }))
        }

        return result[0] as Episode
      }).pipe(
        Effect.catchTag("SqlError", (error) =>
          Effect.fail(new DatabaseError({ cause: error, operation: "findByChecksum" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findByChecksum"),
        Effect.withSpan("EpisodesRepository.findByChecksum")
      )

    const findAll = (filters?: EpisodeFilters) =>
      Effect.gen(function*() {
        let query = db.select().from(episodes)

        if (filters?.processed !== undefined) {
          query = query.where(eq(episodes.processed, filters.processed))
        }

        if (filters?.hasError !== undefined) {
          if (filters.hasError) {
            query = query.where(isNotNull(episodes.processingError))
          } else {
            query = query.where(isNull(episodes.processingError))
          }
        }

        const result = yield* query.orderBy(asc(episodes.createdAt))
        return result as Array<Episode>
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.findAll"),
        Effect.withSpan("EpisodesRepository.findAll")
      )

    const update = (
      id: string,
      data: Partial<NewEpisode> & {
        processed?: boolean
        processingStartedAt?: Date
        processingCompletedAt?: Date
        processingError?: string | null
      }
    ) =>
      Effect.gen(function*() {
        const result = yield* db
          .update(episodes)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(episodes.id, id))
          .returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Episode", id }))
        }

        return result[0] as Episode
      }).pipe(
        Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
        Effect.annotateLogs("operation", "EpisodesRepository.update"),
        Effect.withSpan("EpisodesRepository.update")
      )

    const markProcessingStarted = (id: string) => update(id, { processingStartedAt: new Date() })

    const markProcessingCompleted = (id: string) =>
      update(id, {
        processed: true,
        processingCompletedAt: new Date(),
        processingError: null
      })

    const markProcessingFailed = (id: string, error: string) =>
      update(id, {
        processed: false,
        processingError: error,
        processingCompletedAt: new Date()
      })

    const deleteById = (id: string) =>
      Effect.gen(function*() {
        const result = yield* db.delete(episodes).where(eq(episodes.id, id)).returning()

        if (result.length === 0) {
          return yield* Effect.fail(new NotFoundError({ entity: "Episode", id }))
        }
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

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause: unknown
  operation: string
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string
  [key: string]: unknown
}> {}
