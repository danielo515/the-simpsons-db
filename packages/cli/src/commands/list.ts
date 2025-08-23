import { Command, Options } from "@effect/cli"
import { EpisodeService } from "@simpsons-db/domain"
import type { EpisodeFilters, PaginationParams } from "@simpsons-db/shared"
import { Effect } from "effect"

const seasonOption = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription("Filter by season number")
)

const processedOption = Options.boolean("processed").pipe(
  Options.withDescription("Show only processed episodes")
)

const pendingOption = Options.boolean("pending").pipe(
  Options.withDescription("Show only pending episodes")
)

const limitOption = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDefault(10),
  Options.withDescription("Number of episodes to show (default: 10)")
)

export const listCommand = Command.make("list", {
  summary: "List episodes in the database",
  options: Effect.all([seasonOption, processedOption, pendingOption, limitOption])
}).pipe(
  Command.withHandler(({ options: { limit, pending, processed, season } }) =>
    Effect.gen(function*() {
      const episodeService = yield* EpisodeService

      if (pending) {
        const episodes = yield* episodeService.findPendingProcessing()
        yield* Effect.log(`Found ${episodes.length} pending episodes:`)

        for (const episode of episodes) {
          yield* Effect.log(`  ${episode.id} - ${episode.fileName}`)
          if (episode.season && episode.episodeNumber) {
            yield* Effect.log(`    Season ${episode.season}, Episode ${episode.episodeNumber}`)
          }
        }
        return
      }

      const pagination: PaginationParams = { page: 1, limit }
      const filters: EpisodeFilters = {
        season,
        processed: processed ? true : undefined
      }

      const result = yield* episodeService.findAll(pagination, filters)

      yield* Effect.log(`Found ${result.total} episodes (showing ${result.items.length}):`)

      for (const episode of result.items) {
        const status = episode.processingStatus
        const seasonEp = episode.season && episode.episodeNumber
          ? `S${episode.season}E${episode.episodeNumber.toString().padStart(2, "0")}`
          : "Unknown"

        yield* Effect.log(`  ${episode.id} - ${seasonEp} - ${episode.fileName} [${status}]`)

        if (episode.title) {
          yield* Effect.log(`    Title: ${episode.title}`)
        }
      }

      if (result.totalPages > 1) {
        yield* Effect.log(`Page ${result.page} of ${result.totalPages}`)
      }
    })
  )
)
