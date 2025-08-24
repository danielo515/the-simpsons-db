import { Context, Effect, Layer } from "effect"
import { Episode } from "../entities/episode.js"

export interface EpisodeService {
  readonly findAll: () => Effect.Effect<readonly Episode[], never, never>
  readonly findById: (id: string) => Effect.Effect<Episode | null, never, never>
  readonly create: (episode: Episode) => Effect.Effect<Episode, never, never>
  readonly update: (id: string, episode: Partial<Episode>) => Effect.Effect<Episode | null, never, never>
  readonly delete: (id: string) => Effect.Effect<boolean, never, never>
}

export const EpisodeService = Context.GenericTag<EpisodeService>("@simpsons-db/domain/EpisodeService")

export const EpisodeServiceLive = Layer.succeed(
  EpisodeService,
  EpisodeService.of({
    findAll: () => Effect.succeed([]),
    findById: (_id: string) => Effect.succeed(null),
    create: (episode: Episode) => Effect.succeed(episode),
    update: (_id: string, _episode: Partial<Episode>) => Effect.succeed(null),
    delete: (_id: string) => Effect.succeed(false)
  })
)
