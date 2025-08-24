import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"
import { DateTime, Effect } from "effect"

// Mock episode data for testing - matches domain Episode schema
const mockEpisode = (id: string) => ({
  id,
  filePath: "/path/to/episode.mp4",
  fileName: "S01E01.mp4",
  fileSize: 1024000,
  checksum: "abc123def456",
  mimeType: "video/mp4",
  videoMetadata: {
    duration: 1320,
    width: 1920,
    height: 1080,
    frameRate: 23.976,
    bitrate: 5000000,
    audioChannels: 2,
    audioSampleRate: 48000
  },
  processingStatus: "completed" as const,
  transcriptionStatus: "completed" as const,
  thumbnailStatus: "completed" as const,
  metadataStatus: "completed" as const,
  season: 1,
  episodeNumber: 1,
  title: "Simpsons Roasting on an Open Fire",
  description: "The first episode of The Simpsons",
  airDate: DateTime.unsafeNow(),
  createdAt: DateTime.unsafeNow(),
  updatedAt: DateTime.unsafeNow(),
  processedAt: DateTime.unsafeNow(),
  errorMessage: undefined,
  // API-specific fields
  duration: 1320,
  processed: true,
  hasTranscription: true,
  hasMetadata: true
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
