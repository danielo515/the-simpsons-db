import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"
import { Effect } from "effect"

export const HealthGroupLive = HttpApiBuilder.group(
  SimpsonsDbApi,
  "Health",
  (handlers) =>
    handlers.handle("healthCheck", () =>
      Effect.succeed({
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        service: "simpsons-db-api"
      }))
)
