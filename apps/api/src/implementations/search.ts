import { HttpApiBuilder } from "@effect/platform"
import { SimpsonsDbApi } from "@simpsons-db/api"
import { DateTime, Effect } from "effect"

// Mock search result data - matches domain schemas
const mockSearchResult = {
  id: "550e8400-e29b-41d4-a716-446655440001" as const,
  episodeId: "550e8400-e29b-41d4-a716-446655440000" as const,
  text: "D'oh! This is a sample transcription result from The Simpsons.",
  startTime: 120.5,
  endTime: 125.2,
  confidence: 0.95,
  episode: {
    id: "550e8400-e29b-41d4-a716-446655440000" as const,
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
  }
}

export const SearchGroupLive = HttpApiBuilder.group(SimpsonsDbApi, "Search", (handlers) =>
  handlers
    .handle("searchTranscriptions", ({ urlParams }) => {
      const results = urlParams.q.toLowerCase().includes("doh") ? [mockSearchResult] : []
      return Effect.succeed({
        data: results,
        pagination: {
          page: urlParams.page ?? 1,
          limit: urlParams.limit ?? 10,
          total: results.length,
          totalPages: results.length > 0 ? 1 : 0
        }
      })
    })
    .handle("similaritySearch", ({ payload }) => {
      const results = payload.text.toLowerCase().includes("simpsons") ? [mockSearchResult] : []
      return Effect.succeed({
        data: results,
        pagination: {
          page: 1,
          limit: payload.limit ?? 10,
          total: results.length,
          totalPages: results.length > 0 ? 1 : 0
        }
      })
    }))
