import { HttpApi } from "@effect/platform"
import { EpisodesGroup, HealthGroup, SearchGroup } from "./groups.js"

export const SimpsonsDbApi = HttpApi.make("SimpsonsDbApi")
  .add(HealthGroup)
  .add(EpisodesGroup)
  .add(SearchGroup)
  .prefix("/api")
