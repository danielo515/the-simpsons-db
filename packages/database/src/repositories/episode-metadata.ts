import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import { and, asc, eq } from "drizzle-orm"
import { Effect } from "effect"
import type { EpisodeMetadata, NewEpisodeMetadata } from "../schemas/episode-metadata.js"
import { episodeMetadata } from "../schemas/episode-metadata.js"
import { DatabaseError, NotFoundError } from "./episodes.js"

export interface EpisodeMetadataFilters {
  episodeId?: string
  source?: string
  season?: number
  episodeNumber?: number
  imdbId?: string
  tmdbId?: number
  tvmazeId?: number
}

export class EpisodeMetadataRepository
  extends Effect.Service<EpisodeMetadataRepository>()("EpisodeMetadataRepository", {
    accessors: true,
    effect: Effect.gen(function*() {
      const db = yield* PgDrizzle

      const create = (data: NewEpisodeMetadata) =>
        Effect.gen(function*() {
          const result = yield* db.insert(episodeMetadata).values(data).returning()
          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.create"),
          Effect.withSpan("EpisodeMetadataRepository.create")
        )

      const createMany = (data: Array<NewEpisodeMetadata>) =>
        Effect.gen(function*() {
          const result = yield* db.insert(episodeMetadata).values(data).returning()
          return result as Array<EpisodeMetadata>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "createMany" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.createMany"),
          Effect.withSpan("EpisodeMetadataRepository.createMany")
        )

      const findById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db.select().from(episodeMetadata).where(eq(episodeMetadata.id, id))

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", id }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findById" }))
          ),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findById"),
          Effect.withSpan("EpisodeMetadataRepository.findById", { id })
        )

      const findByEpisodeId = (episodeId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.episodeId, episodeId))
            .orderBy(asc(episodeMetadata.source))

          return result as Array<EpisodeMetadata>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByEpisodeId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByEpisodeId"),
          Effect.withSpan("EpisodeMetadataRepository.findByEpisodeId", { episodeId })
        )

      const findByEpisodeIdAndSource = (episodeId: string, source: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(
              and(
                eq(episodeMetadata.episodeId, episodeId),
                eq(episodeMetadata.source, source)
              )
            )

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", episodeId, source }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByEpisodeIdAndSource" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByEpisodeIdAndSource"),
          Effect.withSpan("EpisodeMetadataRepository.findByEpisodeIdAndSource", { episodeId, source })
        )

      const findBySeasonAndEpisode = (season: number, episodeNumber: number, source?: string) =>
        Effect.gen(function*() {
          let query = db
            .select()
            .from(episodeMetadata)
            .where(
              and(
                eq(episodeMetadata.season, season),
                eq(episodeMetadata.episodeNumber, episodeNumber)
              )
            )

          if (source) {
            query = query.where(eq(episodeMetadata.source, source))
          }

          const result = yield* query.orderBy(asc(episodeMetadata.source))
          return result as Array<EpisodeMetadata>
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findBySeasonAndEpisode" }))
          ),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findBySeasonAndEpisode"),
          Effect.withSpan("EpisodeMetadataRepository.findBySeasonAndEpisode", { season, episodeNumber, source })
        )

      const findByExternalId = (source: string, externalId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(
              and(
                eq(episodeMetadata.source, source),
                eq(episodeMetadata.externalId, externalId)
              )
            )

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", source, externalId }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByExternalId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByExternalId"),
          Effect.withSpan("EpisodeMetadataRepository.findByExternalId", { source, externalId })
        )

      const findByImdbId = (imdbId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.imdbId, imdbId))

          return result as Array<EpisodeMetadata>
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByImdbId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByImdbId"),
          Effect.withSpan("EpisodeMetadataRepository.findByImdbId", { imdbId })
        )

      const findByTmdbId = (tmdbId: number) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.tmdbId, tmdbId))

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", tmdbId }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByTmdbId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByTmdbId"),
          Effect.withSpan("EpisodeMetadataRepository.findByTmdbId", { tmdbId })
        )

      const findByTvmazeId = (tvmazeId: number) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.tvmazeId, tvmazeId))

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", tvmazeId }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "findByTvmazeId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByTvmazeId"),
          Effect.withSpan("EpisodeMetadataRepository.findByTvmazeId", { tvmazeId })
        )

      const findAll = (filters?: EpisodeMetadataFilters) =>
        Effect.gen(function*() {
          let query = db.select().from(episodeMetadata)

          const conditions = []

          if (filters?.episodeId) {
            conditions.push(eq(episodeMetadata.episodeId, filters.episodeId))
          }

          if (filters?.source) {
            conditions.push(eq(episodeMetadata.source, filters.source))
          }

          if (filters?.season !== undefined) {
            conditions.push(eq(episodeMetadata.season, filters.season))
          }

          if (filters?.episodeNumber !== undefined) {
            conditions.push(eq(episodeMetadata.episodeNumber, filters.episodeNumber))
          }

          if (filters?.imdbId) {
            conditions.push(eq(episodeMetadata.imdbId, filters.imdbId))
          }

          if (filters?.tmdbId !== undefined) {
            conditions.push(eq(episodeMetadata.tmdbId, filters.tmdbId))
          }

          if (filters?.tvmazeId !== undefined) {
            conditions.push(eq(episodeMetadata.tvmazeId, filters.tvmazeId))
          }

          if (conditions.length > 0) {
            query = query.where(and(...conditions))
          }

          const result = yield* query.orderBy(asc(episodeMetadata.season), asc(episodeMetadata.episodeNumber))
          return result as Array<EpisodeMetadata>
        }).pipe(
          Effect.catchTag(
            "SqlError",
            (error) => Effect.fail(new DatabaseError({ cause: error, operation: "findAll" }))
          ),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findAll"),
          Effect.withSpan("EpisodeMetadataRepository.findAll")
        )

      const update = (id: string, data: Partial<NewEpisodeMetadata>) =>
        Effect.gen(function*() {
          const result = yield* db
            .update(episodeMetadata)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(episodeMetadata.id, id))
            .returning()

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", id }))
          }

          return result[0] as EpisodeMetadata
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "update" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.update"),
          Effect.withSpan("EpisodeMetadataRepository.update", { id })
        )

      const upsertByEpisodeIdAndSource = (
        episodeId: string,
        source: string,
        data: Omit<NewEpisodeMetadata, "episodeId" | "source">
      ) =>
        Effect.gen(function*() {
          const existing = yield* findByEpisodeIdAndSource(episodeId, source).pipe(
            Effect.option
          )

          if (existing._tag === "Some") {
            return yield* update(existing.value.id, data)
          } else {
            return yield* create({ ...data, episodeId, source })
          }
        }).pipe(
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.upsertByEpisodeIdAndSource"),
          Effect.withSpan("EpisodeMetadataRepository.upsertByEpisodeIdAndSource", { episodeId, source })
        )

      const deleteById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db.delete(episodeMetadata).where(eq(episodeMetadata.id, id)).returning()

          if (result.length === 0) {
            return yield* Effect.fail(new NotFoundError({ entity: "EpisodeMetadata", id }))
          }
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "delete" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.delete"),
          Effect.withSpan("EpisodeMetadataRepository.delete", { id })
        )

      const deleteByEpisodeId = (episodeId: string) =>
        Effect.gen(function*() {
          yield* db.delete(episodeMetadata).where(eq(episodeMetadata.episodeId, episodeId))
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(new DatabaseError({ cause: error, operation: "deleteByEpisodeId" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.deleteByEpisodeId"),
          Effect.withSpan("EpisodeMetadataRepository.deleteByEpisodeId", { episodeId })
        )

      return {
        create,
        createMany,
        findById,
        findByEpisodeId,
        findByEpisodeIdAndSource,
        findBySeasonAndEpisode,
        findByExternalId,
        findByImdbId,
        findByTmdbId,
        findByTvmazeId,
        findAll,
        update,
        upsertByEpisodeIdAndSource,
        deleteById,
        deleteByEpisodeId
      } as const
    })
  })
{}
