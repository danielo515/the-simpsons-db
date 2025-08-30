# Simpsons DB CLI

This package README has been consolidated. Please refer to `dev-docs/cli.md` for the up-to-date documentation, patterns, and examples.

- Usage: `pnpm -w --filter @simpsons-db/cli dev`
- Type check: `pnpm -w --filter @simpsons-db/cli type-check`
- Tests: `pnpm -w --filter @simpsons-db/cli test`

---

# CLI with Effect — Reference & Best Practices

This document explains how to build CLI apps and commands using `@effect/cli` and run them with `@effect/platform-node`. It’s tailored to this repository’s `packages/cli/` layout and verified against the Effect docs via MCP for:

- Command.make / Command.withSubcommands / Command.withHandler / Command.run
- Args.text / Args.file and Options.boolean / Options.integer (+ withAlias / withDescription / withDefault)
- Options.all for composing multiple options
- Running: `cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)`

## Overview

- **Entry point**: `packages/cli/src/index.ts`
- **Commands**: `packages/cli/src/commands/`
- **Runtime**: `cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)`

The CLI should be structured around small, composable commands. Each command declares its arguments and options, then registers a handler that returns an `Effect`.

## Minimal CLI App

```ts
import { Command } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"

const hello = Command.make("hello", {
  summary: "Say hello"
}).pipe(Command.withHandler(() => Effect.log("Hello from Effect CLI!")))

const cli = Command.run(hello, {
  name: "my-cli",
  version: "0.1.0"
})

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
```

- `Command.run` returns a function `(args: string[]) => Effect<void, E | ValidationError, R | CliApp.Environment>`.
- Invoke it as `cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)`.

## Subcommands

Aggregate multiple commands under a root command using `Command.withSubcommands`.

```ts
import { Command } from "@effect/cli"
import { Effect } from "effect"

const cmdA = Command.make("a").pipe(Command.withHandler(() => Effect.log("A")))

const cmdB = Command.make("b").pipe(Command.withHandler(() => Effect.log("B")))

const cli = Command.make("my-cli", { summary: "Root CLI" }).pipe(
  Command.withSubcommands([cmdA, cmdB])
)
```

In this repo, see `packages/cli/src/index.ts` where `import`, `process`, and `list` are wired as subcommands.

## Arguments (Args)

Use `Args.text()` for strings and `Args.file()` for file paths.

```ts
import { Args, Command } from "@effect/cli"
import { Effect } from "effect"

const fileArg = Args.file({ exists: "yes" }).pipe(
  Args.withDescription("Path to a file that must exist")
)

export const show = Command.make("show", { args: fileArg }).pipe(
  Command.withHandler(({ args: path }) => Effect.log(`Show: ${path}`))
)
```

Other useful constructors: `Args.text()`, `Args.integer()`, `Args.directory()`.

## Options (Options)

Use `Options.boolean` and `Options.integer`, then add metadata with `withAlias`, `withDescription`, and `withDefault`.

```ts
import { Command, Options } from "@effect/cli"
import { Effect } from "effect"

const verbose = Options.boolean("verbose").pipe(
  Options.withAlias("v"),
  Options.withDescription("Enable verbose logging")
)

const limit = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDefault(10),
  Options.withDescription("Max items to process (default: 10)")
)

// Compose multiple options with Options.all
const options = Options.all({ verbose, limit })

export const run = Command.make("run", { options }).pipe(
  Command.withHandler(({ options }) =>
    Effect.log(`verbose=${options.verbose}, limit=${options.limit}`)
  )
)
```

Notes:

- Compose multiple options with `Options.all(...)`. Avoid using `Effect.all` for this; `Options.all` is the dedicated API for CLI option composition.
- `withDefault` provides typed defaults so handlers can rely on presence.

## Handlers

`Command.withHandler` attaches the effectful action. The handler receives the parsed configuration matching your `args` and `options` shape.

```ts
Command.make("sample", {
  args: Args.text(),
  options: Options.boolean("dry-run")
}).pipe(
  Command.withHandler(({ args, options }) =>
    Effect.gen(function* () {
      if (options) {
        yield* Effect.log("Dry run enabled")
      }
      yield* Effect.log(`Arg was: ${args}`)
    })
  )
)
```

This repository follows the same pattern in `packages/cli/src/commands/*.ts`.

## Wiring Services and Running

Provide your services before running the program and keep the main at the edge:

```ts
import { Command } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { DatabaseLive } from "@simpsons-db/database"

const command = Command.make("simpsons-db").pipe(/* add subcommands */)

const cli = Command.run(command, {
  name: "simpsons-db",
  version: "0.1.0"
})

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)
```

This mirrors `packages/cli/src/index.ts`.

## Example: Import Command

See `packages/cli/src/commands/import.ts` for a concrete example using `Args.file`, a boolean option, and a service.

```ts
import { Args, Command, Options } from "@effect/cli"
import { EpisodeService } from "@simpsons-db/domain"
import { isVideoFile } from "@simpsons-db/shared"
import { Effect } from "effect"

const pathArg = Args.file({ exists: "yes" }).pipe(
  Args.withDescription("Path to video file or directory to import")
)

const recursive = Options.boolean("recursive").pipe(
  Options.withAlias("r"),
  Options.withDescription("Recursively scan directories for video files")
)

export const importCommand = Command.make("import", {
  args: pathArg,
  options: recursive
}).pipe(
  Command.withHandler(({ args: path, options }) =>
    Effect.gen(function* () {
      const episodeService = yield* EpisodeService
      yield* Effect.log(`Importing from: ${path}`)

      if (options) {
        yield* Effect.log("Recursive import not yet implemented")
        return
      }

      if (!isVideoFile(path)) {
        return yield* Effect.fail(
          new Error(`Not a supported video file: ${path}`)
        )
      }

      const episode = yield* episodeService.importFromFile(path)
      yield* Effect.log(`Successfully imported episode: ${episode.id}`)
    })
  )
)
```

## Example: List Command (multiple options)

When you need multiple options, use `Options.all` to combine them into a single typed config.

```ts
import { Command, Options } from "@effect/cli"
import { Effect } from "effect"

const season = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription("Filter by season number")
)

const processed = Options.boolean("processed").pipe(
  Options.withDescription("Show only processed episodes")
)

const pending = Options.boolean("pending").pipe(
  Options.withDescription("Show only pending episodes")
)

const limit = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDefault(10),
  Options.withDescription("Number of episodes to show (default: 10)")
)

const options = Options.all({ season, processed, pending, limit })

export const listCommand = Command.make("list", {
  summary: "List episodes",
  options
}).pipe(
  Command.withHandler(({ options }) => Effect.log(JSON.stringify(options)))
)
```

## Error Handling and Logging

- Add `Effect.tapErrorCause(Effect.logError)` in the same pipe where you run the CLI:

  ```ts
  cli(process.argv).pipe(
    Effect.tapErrorCause(Effect.logError),
    Effect.provide(NodeContext.layer),
    NodeRuntime.runMain
  )
  ```

- Inside handlers, prefer `Effect.log`, `Effect.logDebug`, etc. You can refine errors and provide friendly messages.

## Testing Handlers

- Export commands and test their handlers as pure Effects by invoking them with parsed input, or factor core logic into separate modules that handlers call.
- Use `vitest` as configured in the workspace. Keep effects pure and provide test services/mocks where necessary.

## Best Practices

- **Functional & immutable**: prefer pure transformations and avoid in-place mutation.
- **No `any`**: leverage types from `Args`, `Options`, and your domain packages.
- **Use `Effect.gen(function* () { ... })`** and `yield*` directly (avoid deprecated adaptor forms).
- **Use `Options.all`** to compose multiple options; avoid ad-hoc objects or unrelated combinators.
- **Keep I/O at the edges**: provide services in `src/index.ts`, keep handlers thin, delegate to domain services.

## Useful APIs (verified)

- `Command.make(name, config?)`
- `Command.withSubcommands([...])`
- `Command.withHandler(handler)`
- `Command.run(command, { name, version })`
- `Args.text(config?)`, `Args.file(config?)`, `Args.withDescription(...)`
- `Options.boolean(name)`, `Options.integer(name)`
- `Options.withAlias(alias)`, `Options.withDescription(desc)`, `Options.withDefault(value)`
- `Options.all({...})` to compose multiple options into one config
- `cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain)`

## Project Layout (this repo)

- `packages/cli/src/index.ts`: root command, services wiring, runMain
- `packages/cli/src/commands/`: command implementations
- `packages/cli/build/`: compiled output

## Running

From the repo root:

```bash
pnpm -w --filter @simpsons-db/cli dev            # or build then run node build/esm
```

Or directly via `node` once built:

```bash
node packages/cli/build/esm/index.js --help
```

---

If you need help designing a new command, start from the Minimal CLI App and Subcommands sections, then add Args/Options and a handler. Keep side effects inside the handler and provide all dependencies at the entry point.
