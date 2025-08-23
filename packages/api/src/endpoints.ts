import { HttpApiEndpoint, HttpApiSchema } from "@effect/platform"
import {
  CreateEpisodeRequest,
  Episode,
  EpisodeIdParam,
  EpisodesResponse,
  GetEpisodesQuery,
  HealthResponse,
  InternalServerError,
  NotFoundError,
  ValidationError
} from "./schemas.js"

// Health Check Endpoints
export const healthCheck = HttpApiEndpoint
  .get("healthCheck", "/health")
  .addSuccess(HealthResponse)
  .addError(InternalServerError, { status: 500 })

// Episode Endpoints
const episodeIdParam = HttpApiSchema.param("id", EpisodeIdParam.fields.id)

export const getEpisodes = HttpApiEndpoint
  .get("getEpisodes", "/episodes")
  .setUrlParams(GetEpisodesQuery)
  .addSuccess(EpisodesResponse)
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })

export const getEpisodeById = HttpApiEndpoint
  .get("getEpisodeById")`/episodes/${episodeIdParam}`
  .addSuccess(Episode)
  .addError(NotFoundError, { status: 404 })
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })

export const createEpisode = HttpApiEndpoint
  .post("createEpisode", "/episodes")
  .setPayload(CreateEpisodeRequest)
  .addSuccess(Episode, { status: 201 })
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })

export const deleteEpisode = HttpApiEndpoint
  .del("deleteEpisode")`/episodes/${episodeIdParam}`
  .addError(NotFoundError, { status: 404 })
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })

export const getPendingEpisodes = HttpApiEndpoint
  .get("getPendingEpisodes", "/episodes/pending")
  .addSuccess(EpisodesResponse)
  .addError(InternalServerError, { status: 500 })

export const processEpisode = HttpApiEndpoint
  .post("processEpisode")`/episodes/${episodeIdParam}/process`
  .addSuccess(Episode)
  .addError(NotFoundError, { status: 404 })
  .addError(ValidationError, { status: 400 })
  .addError(InternalServerError, { status: 500 })
