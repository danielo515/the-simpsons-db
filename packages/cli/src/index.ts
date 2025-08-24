#!/usr/bin/env node

import { Command } from "@effect/cli"
import { NodeRuntime } from "@effect/platform-node"
import { DatabaseLive } from "@simpsons-db/database"
import { Effect } from "effect"
import { importCommand } from "./commands/import.js"
import { listCommand } from "./commands/list.js"
import { processCommand } from "./commands/process.js"

const cli = Command.make("simpsons-db", {
  summary: "CLI tool for The Simpsons Database"
}).pipe(
  Command.withSubcommands([
    importCommand,
    processCommand,
    listCommand
  ])
)

const program = Command.run(cli, {
  name: "simpsons-db",
  version: "0.1.0"
})(process.argv.slice(2)).pipe(
  Effect.provide(DatabaseLive),
  Effect.tapErrorCause(Effect.logError)
)

NodeRuntime.runMain(program)
