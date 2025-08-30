#!/usr/bin/env node

import { Command } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { EpisodeServiceLive } from "@simpsons-db/domain"
import { VideoProcessor } from "@simpsons-db/video-processor"
import { importCommand } from "./commands/import.js"
import { listCommand } from "./commands/list.js"
import { processCommand } from "./commands/process.js"
import { Effect, Layer } from "effect"

const command = Command.make("simpsons-db").pipe(
  Command.withSubcommands([
    importCommand,
    processCommand,
    listCommand
  ])
)

const cli = Command.run(command, {
  name: "simpsons-db",
  version: "0.1.0"
})

cli(process.argv).pipe(
  Effect.provide(
    Layer.mergeAll(
      NodeContext.layer,
      EpisodeServiceLive,
      VideoProcessor.Default
    )
  ),
  Effect.tapErrorCause(Effect.logError),
  NodeRuntime.runMain
)
