import { HttpApi } from "@effect/platform"
import { EpisodesGroup, HealthGroup } from "./groups.js"

export const SimpsonsDbApi = HttpApi.make("SimpsonsDbApi")
  .add(HealthGroup)
  .add(EpisodesGroup)
  .prefix("/api")
