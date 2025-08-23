import { HttpApiGroup } from "@effect/platform"
import {
  createEpisode,
  deleteEpisode,
  getEpisodeById,
  getEpisodes,
  getPendingEpisodes,
  healthCheck,
  processEpisode
} from "./endpoints.js"

export const HealthGroup = HttpApiGroup
  .make("Health")
  .add(healthCheck)

export const EpisodesGroup = HttpApiGroup
  .make("Episodes")
  .add(getEpisodes)
  .add(getEpisodeById)
  .add(createEpisode)
  .add(deleteEpisode)
  .add(getPendingEpisodes)
  .add(processEpisode)
