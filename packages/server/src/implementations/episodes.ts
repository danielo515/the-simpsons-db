import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"
import { DateTime, Effect } from "effect"

// Mock episode data for testing
const mockEpisode = (id: string) => ({
  id,
  filePath: "/path/to/episode.mp4",
  fileName: "S01E01.mp4",
  fileSize: 1024000,
  duration: 1320,
  season: 1,
  episodeNumber: 1,
  title: "Simpsons Roasting on an Open Fire",
  description: "The first episode of The Simpsons",
  airDate: DateTime.unsafeNow(),
  processed: true,
  hasTranscription: true,
  hasMetadata: true,
  createdAt: DateTime.unsafeNow(),
  updatedAt: DateTime.unsafeNow()
})

export const EpisodesGroupLive = HttpApiBuilder.group(SimpsonsDbApi, "Episodes", (handlers) =>
  handlers
    .handle("getEpisodes", ({ urlParams }) => {
      const episodes = [mockEpisode("mock-id")]
      return Effect.succeed({
        data: episodes,
        pagination: {
          page: urlParams.page ?? 1,
          limit: urlParams.limit ?? 10,
          total: episodes.length,
          totalPages: 1
        }
      })
    })
    .handle("getEpisodeById", ({ path: { id } }) => Effect.succeed(mockEpisode(id)))
    .handle("createEpisode", ({ payload }) =>
      Effect.succeed({
        ...mockEpisode("mock-id"),
        filePath: payload.filePath,
        fileName: payload.filePath.split("/").pop() || "unknown.mp4"
      }))
    .handle("deleteEpisode", ({ path: { id } }) => {
      console.log(`Not deleting ${id} because it's a mock`)
      return Effect.void
    })
    .handle("getPendingEpisodes", () =>
      Effect.succeed({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }))
    .handle("processEpisode", ({ path: { id } }) =>
      Effect.succeed({
        ...mockEpisode(id),
        processed: true
      })))
