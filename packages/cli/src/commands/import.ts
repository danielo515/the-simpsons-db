import { Args, Command, Options } from "@effect/cli"
import { EpisodeService } from "@simpsons-db/domain"
import { isVideoFile } from "@simpsons-db/shared"
import { Effect } from "effect"

const pathArg = Args.file("path", { exists: "yes" }).pipe(
  Args.withDescription("Path to video file or directory to import")
)

const recursiveOption = Options.boolean("recursive").pipe(
  Options.withAlias("r"),
  Options.withDescription("Recursively scan directories for video files")
)

export const importCommand = Command.make("import", {
  summary: "Import video files into the database",
  args: pathArg,
  options: recursiveOption
}).pipe(
  Command.withHandler(({ args: path, options: { recursive } }) =>
    Effect.gen(function*() {
      const episodeService = yield* EpisodeService

      yield* Effect.log(`Importing from: ${path}`)

      if (recursive) {
        // TODO: Implement recursive directory scanning
        yield* Effect.log("Recursive import not yet implemented")
        return
      }

      // Check if it's a video file
      if (!isVideoFile(path)) {
        yield* Effect.fail(new Error(`Not a supported video file: ${path}`))
      }

      const episode = yield* episodeService.importFromFile(path)

      yield* Effect.log(`Successfully imported episode: ${episode.id}`)
      yield* Effect.log(`File: ${episode.fileName}`)
      if (episode.season && episode.episodeNumber) {
        yield* Effect.log(`Season ${episode.season}, Episode ${episode.episodeNumber}`)
      }
    })
  )
)
