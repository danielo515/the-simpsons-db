import { Command, Options } from "@effect/cli"
import { EpisodeService } from "@simpsons-db/domain"
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

const options = Options.all({
  season: seasonOption,
  processed: processedOption,
  pending: pendingOption,
  limit: limitOption
})

export const listCommand = Command.make("list", { options }).pipe(
  Command.withHandler(({ options: { limit, season } }) =>
    Effect.gen(function*() {
      const episodeService = yield* EpisodeService

      // Domain service currently supports simple findAll without filters
      const all = yield* episodeService.findAll()

      const filtered = all.filter((e) => {
        if (season !== undefined && e.season !== season) return false
        // processed/pending flags are not supported by service yet; ignore for now
        return true
      })

      const items = filtered.slice(0, limit)

      yield* Effect.log(`Found ${items.length} episode(s):`)

      for (const episode of items) {
        const seasonEp = episode.episodeNumber
          ? `S${episode.season}E${episode.episodeNumber.toString().padStart(2, "0")}`
          : "Unknown"
        const status = episode.processingStatus
        yield* Effect.log(`  ${episode.id} - ${seasonEp} - ${episode.fileName} [${status}]`)
        if (episode.title) {
          yield* Effect.log(`    Title: ${episode.title}`)
        }
      }
    })
  )
)
