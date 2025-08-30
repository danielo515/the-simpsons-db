import { Args, Command, Options } from "@effect/cli"
import { isVideoFile } from "@simpsons-db/shared"
import { Effect } from "effect"

const pathArg = Args.file({ exists: "yes" }).pipe(
  Args.withDescription("Path to video file or directory to import")
)

const recursiveOption = Options.boolean("recursive").pipe(
  Options.withAlias("r"),
  Options.withDescription("Recursively scan directories for video files")
)

export const importCommand = Command.make("import", {
  args: pathArg,
  options: recursiveOption
}).pipe(
  Command.withHandler(({ args: path, options }) =>
    Effect.gen(function*() {
      yield* Effect.log(`Importing from: ${path}`)

      if (options) {
        // TODO: Implement recursive directory scanning
        yield* Effect.log("Recursive import not yet implemented")
        return
      }

      // Check if it's a video file
      if (!isVideoFile(path)) {
        return yield* Effect.fail(new Error(`Not a supported video file: ${path}`))
      }

      // Placeholder: EpisodeService has no importFromFile yet
      yield* Effect.log("Import service not implemented yet. Skipping.")
    })
  )
)
