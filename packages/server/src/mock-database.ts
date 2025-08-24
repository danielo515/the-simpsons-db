import { Layer } from "effect"

// Mock database layer for testing
export const DatabaseLive = Layer.succeed("Database", {
  connection: "mock-connection"
})
