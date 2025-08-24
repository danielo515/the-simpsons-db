import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"
import { Layer } from "effect"
import { EpisodesGroupLive, HealthGroupLive, SearchGroupLive } from "./implementations/index.js"

export const ApiLive = HttpApiBuilder.api(SimpsonsDbApi).pipe(
  Layer.provide([
    HealthGroupLive,
    EpisodesGroupLive,
    SearchGroupLive
  ])
)

export const OpenApiLive = HttpApiBuilder.middlewareOpenApi()
