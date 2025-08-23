import { HttpApiGroup } from "@effect/platform"
import {
  createEpisode,
  deleteEpisode,
  getEpisodeById,
  getEpisodes,
  getPendingEpisodes,
  healthCheck,
  processEpisode,
  searchTranscriptions,
  similaritySearch
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

export const SearchGroup = HttpApiGroup
  .make("Search")
  .add(searchTranscriptions)
  .add(similaritySearch)
