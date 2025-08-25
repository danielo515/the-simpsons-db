import { PgDrizzle } from "@effect/sql-drizzle/Pg"
import type { EpisodeId } from "@simpsons-db/domain"
import { EpisodeMetadata as DomainEpisodeMetadata } from "@simpsons-db/domain"
import { and, asc, eq } from "drizzle-orm"
import { Effect, Schema } from "effect"
import { DatabaseError, NotFoundError } from "../errors.js"
import { episodeMetadata, type NewEpisodeMetadata } from "../schemas/episode-metadata.js"

// Helper function to convert database result to domain entity input
const mapDbResultToDomain = (result: any) => ({
  id: result.id,
  episodeId: result.episodeId as EpisodeId,
  source: result.source,
  externalId: result.externalId ?? undefined,
  title: result.title ?? undefined,
  season: result.season ?? undefined,
  episodeNumber: result.episodeNumber ?? undefined,
  airDate: result.airDate ?? undefined,
  description: result.description ?? undefined,
  imdbId: result.imdbId ?? undefined,
  tmdbId: result.tmdbId ?? undefined,
  tvmazeId: result.tvmazeId ?? undefined,
  rating: result.rating ?? undefined,
  genres: result.genres ?? undefined,
  cast: result.cast ?? undefined,
  crew: result.crew ?? undefined,
  rawData: result.rawData ?? undefined,
  createdAt: result.createdAt,
  updatedAt: result.updatedAt
})

export interface EpisodeMetadataFilters {
  episodeId?: string
  source?: string
  season?: number
  episodeNumber?: number
  imdbId?: string
  tmdbId?: number
  tvmazeId?: number
}

export class EpisodeMetadataRepository extends Effect.Service<EpisodeMetadataRepository>()(
  "EpisodeMetadataRepository",
  {
    accessors: true,
    effect: Effect.gen(function*() {
      const db = yield* PgDrizzle

      const create = (data: NewEpisodeMetadata) =>
        Effect.gen(function*() {
          const [result] = yield* db
            .insert(episodeMetadata)
            .values(data)
            .returning()
          if (!result) {
            return yield* new DatabaseError({ cause: "Database did not return the value", operation: "create" })
          }
          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)(mapDbResultToDomain(result))
        }).pipe(
          Effect.catchTag("SqlError", (error) => Effect.fail(new DatabaseError({ cause: error, operation: "create" }))),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.create"),
          Effect.withSpan("EpisodeMetadataRepository.create")
        )

      const createMany = (data: Array<NewEpisodeMetadata>) =>
        Effect.gen(function*() {
          const result = yield* db
            .insert(episodeMetadata)
            .values(data)
            .returning()
          return yield* Effect.forEach(
            result,
            (item) => Schema.decodeUnknown(DomainEpisodeMetadata)(mapDbResultToDomain(item)),
            { concurrency: "unbounded" }
          )
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "createMany" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.createMany"
          ),
          Effect.withSpan("EpisodeMetadataRepository.createMany")
        )

      const findById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.id, id))

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "EpisodeMetadata", id })
            )
          }

          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)({
            id: result[0]!.id,
            episodeId: result[0]!.episodeId,
            source: result[0]!.source,
            title: result[0]!.title,
            season: result[0]!.season,
            episodeNumber: result[0]!.episodeNumber,
            airDate: result[0]!.airDate,
            description: result[0]!.description,
            imdbId: result[0]!.imdbId,
            tmdbId: result[0]!.tmdbId,
            tvmazeId: result[0]!.tvmazeId,
            rating: result[0]!.rating,
            genres: result[0]!.genres,
            cast: result[0]!.cast,
            crew: result[0]!.crew,
            rawData: result[0]!.rawData,
            createdAt: result[0]!.createdAt,
            updatedAt: result[0]!.updatedAt
          })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findById" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findById"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findById", {
            attributes: { id }
          })
        )

      const findByEpisodeId = (episodeId: string) =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan({ episodeId })
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.episodeId, episodeId))
            .orderBy(asc(episodeMetadata.source))

          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainEpisodeMetadata)({
              id: item.id,
              episodeId: item.episodeId,
              source: item.source,
              title: item.title,
              season: item.season,
              episodeNumber: item.episodeNumber,
              airDate: item.airDate,
              description: item.description,
              imdbId: item.imdbId,
              tmdbId: item.tmdbId,
              tvmazeId: item.tvmazeId,
              rating: item.rating,
              genres: item.genres,
              cast: item.cast,
              crew: item.crew,
              rawData: item.rawData,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            }), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findByEpisodeId" })
            )),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.findByEpisodeId"),
          Effect.withSpan("EpisodeMetadataRepository.findByEpisodeId")
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
            return yield* Effect.fail(
              new NotFoundError({
                entity: "EpisodeMetadata",
                episodeId,
                source
              })
            )
          }

          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)(mapDbResultToDomain(result[0]!))
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({
                cause: error,
                operation: "findByEpisodeIdAndSource"
              })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findByEpisodeIdAndSource"
          ),
          Effect.withSpan(
            "EpisodeMetadataRepository.findByEpisodeIdAndSource",
            { attributes: { episodeId, source } }
          )
        )

      const findBySeasonAndEpisode = (
        season: number,
        episodeNumber: number,
        source?: string
      ) =>
        Effect.gen(function*() {
          const conditions = [
            eq(episodeMetadata.season, season),
            eq(episodeMetadata.episodeNumber, episodeNumber)
          ]

          if (source) {
            conditions.push(eq(episodeMetadata.source, source))
          }

          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(and(...conditions))
            .orderBy(asc(episodeMetadata.source))

          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainEpisodeMetadata)({
              id: item.id,
              episodeId: item.episodeId,
              source: item.source,
              title: item.title,
              season: item.season,
              episodeNumber: item.episodeNumber,
              airDate: item.airDate,
              description: item.description,
              imdbId: item.imdbId,
              tmdbId: item.tmdbId,
              tvmazeId: item.tvmazeId,
              rating: item.rating,
              genres: item.genres,
              cast: item.cast,
              crew: item.crew,
              rawData: item.rawData,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            }), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({
                cause: error,
                operation: "findBySeasonAndEpisode"
              })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findBySeasonAndEpisode"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findBySeasonAndEpisode", {
            attributes: { season, episodeNumber, source }
          })
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
            return yield* Effect.fail(
              new NotFoundError({
                entity: "EpisodeMetadata",
                source,
                externalId
              })
            )
          }

          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)({
            id: result[0]!.id,
            episodeId: result[0]!.episodeId,
            source: result[0]!.source,
            title: result[0]!.title,
            season: result[0]!.season,
            episodeNumber: result[0]!.episodeNumber,
            airDate: result[0]!.airDate,
            description: result[0]!.description,
            imdbId: result[0]!.imdbId,
            tmdbId: result[0]!.tmdbId,
            tvmazeId: result[0]!.tvmazeId,
            rating: result[0]!.rating,
            genres: result[0]!.genres,
            cast: result[0]!.cast,
            crew: result[0]!.crew,
            rawData: result[0]!.rawData,
            createdAt: result[0]!.createdAt,
            updatedAt: result[0]!.updatedAt
          })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findByExternalId" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findByExternalId"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findByExternalId", {
            attributes: { source, externalId }
          })
        )

      const findByImdbId = (imdbId: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.imdbId, imdbId))

          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainEpisodeMetadata)({
              id: item.id,
              episodeId: item.episodeId,
              source: item.source,
              title: item.title,
              season: item.season,
              episodeNumber: item.episodeNumber,
              airDate: item.airDate,
              description: item.description,
              imdbId: item.imdbId,
              tmdbId: item.tmdbId,
              tvmazeId: item.tvmazeId,
              rating: item.rating,
              genres: item.genres,
              cast: item.cast,
              crew: item.crew,
              rawData: item.rawData,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            }), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findByImdbId" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findByImdbId"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findByImdbId", {
            attributes: { imdbId }
          })
        )

      const findByTmdbId = (tmdbId: number) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.tmdbId, tmdbId))

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "EpisodeMetadata", tmdbId })
            )
          }

          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)({
            id: result[0]!.id,
            episodeId: result[0]!.episodeId,
            source: result[0]!.source,
            title: result[0]!.title,
            season: result[0]!.season,
            episodeNumber: result[0]!.episodeNumber,
            airDate: result[0]!.airDate,
            description: result[0]!.description,
            imdbId: result[0]!.imdbId,
            tmdbId: result[0]!.tmdbId,
            tvmazeId: result[0]!.tvmazeId,
            rating: result[0]!.rating,
            genres: result[0]!.genres,
            cast: result[0]!.cast,
            crew: result[0]!.crew,
            rawData: result[0]!.rawData,
            createdAt: result[0]!.createdAt,
            updatedAt: result[0]!.updatedAt
          })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findByTmdbId" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findByTmdbId"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findByTmdbId", {
            attributes: { tmdbId }
          })
        )

      const findByTvmazeId = (tvmazeId: number) =>
        Effect.gen(function*() {
          const result = yield* db
            .select()
            .from(episodeMetadata)
            .where(eq(episodeMetadata.tvmazeId, tvmazeId))

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "EpisodeMetadata", tvmazeId })
            )
          }

          return yield* Schema.decodeUnknown(DomainEpisodeMetadata)({
            id: result[0]!.id,
            episodeId: result[0]!.episodeId,
            source: result[0]!.source,
            title: result[0]!.title,
            season: result[0]!.season,
            episodeNumber: result[0]!.episodeNumber,
            airDate: result[0]!.airDate,
            description: result[0]!.description,
            imdbId: result[0]!.imdbId,
            tmdbId: result[0]!.tmdbId,
            tvmazeId: result[0]!.tvmazeId,
            rating: result[0]!.rating,
            genres: result[0]!.genres,
            cast: result[0]!.cast,
            crew: result[0]!.crew,
            rawData: result[0]!.rawData,
            createdAt: result[0]!.createdAt,
            updatedAt: result[0]!.updatedAt
          })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findByTvmazeId" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findByTvmazeId"
          ),
          Effect.withSpan("EpisodeMetadataRepository.findByTvmazeId", {
            attributes: { tvmazeId }
          })
        )

      const findAll = (filters?: EpisodeMetadataFilters) =>
        Effect.gen(function*() {
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
            conditions.push(
              eq(episodeMetadata.episodeNumber, filters.episodeNumber)
            )
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

          const result = yield* db.select().from(episodeMetadata).where(and(...conditions)).orderBy(
            asc(episodeMetadata.season),
            asc(episodeMetadata.episodeNumber)
          )
          return yield* Effect.forEach(result, (item) =>
            Schema.decodeUnknown(DomainEpisodeMetadata)(mapDbResultToDomain(item)), { concurrency: "unbounded" })
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "findAll" })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.findAll"
          ),
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
            return yield* Effect.fail(
              new NotFoundError({ entity: "EpisodeMetadata", id })
            )
          }

          return result[0]
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "update" })
            )),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.update"),
          Effect.withSpan("EpisodeMetadataRepository.update", {
            attributes: { id }
          })
        )

      const upsertByEpisodeIdAndSource = (
        episodeId: string,
        source: string,
        data: Omit<NewEpisodeMetadata, "episodeId" | "source">
      ) =>
        Effect.gen(function*() {
          const existing = yield* findByEpisodeIdAndSource(
            episodeId,
            source
          ).pipe(Effect.option)

          if (existing._tag === "Some") {
            return yield* update(existing.value.id, data)
          } else {
            return yield* create({ ...data, episodeId, source })
          }
        }).pipe(
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.upsertByEpisodeIdAndSource"
          ),
          Effect.withSpan(
            "EpisodeMetadataRepository.upsertByEpisodeIdAndSource",
            { attributes: { episodeId, source } }
          )
        )

      const deleteById = (id: string) =>
        Effect.gen(function*() {
          const result = yield* db
            .delete(episodeMetadata)
            .where(eq(episodeMetadata.id, id))
            .returning()

          if (result.length === 0) {
            return yield* Effect.fail(
              new NotFoundError({ entity: "EpisodeMetadata", id })
            )
          }
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({ cause: error, operation: "delete" })
            )),
          Effect.annotateLogs("operation", "EpisodeMetadataRepository.delete"),
          Effect.withSpan("EpisodeMetadataRepository.delete", {
            attributes: { id }
          })
        )

      const deleteByEpisodeId = (episodeId: string) =>
        Effect.gen(function*() {
          yield* db
            .delete(episodeMetadata)
            .where(eq(episodeMetadata.episodeId, episodeId))
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(
              new DatabaseError({
                cause: error,
                operation: "deleteByEpisodeId"
              })
            )),
          Effect.annotateLogs(
            "operation",
            "EpisodeMetadataRepository.deleteByEpisodeId"
          ),
          Effect.withSpan("EpisodeMetadataRepository.deleteByEpisodeId", {
            attributes: { episodeId }
          })
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
  }
) {}
