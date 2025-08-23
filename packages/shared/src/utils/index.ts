import { Effect, Option, pipe } from "effect"
import { FileSystemError } from "../errors/index.js"

// File system utilities
export const calculateChecksum = (filePath: string): Effect.Effect<string, FileSystemError> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const crypto = await import("crypto")
        const fs = await import("fs/promises")
        const data = await fs.readFile(filePath)
        return crypto.createHash("sha256").update(data).digest("hex")
      },
      catch: (error) =>
        new FileSystemError({
          message: `Failed to calculate checksum for ${filePath}`,
          path: filePath,
          operation: "checksum",
          cause: error
        })
    })
  )

export const getFileSize = (filePath: string): Effect.Effect<number, FileSystemError> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const fs = await import("fs/promises")
        const stats = await fs.stat(filePath)
        return stats.size
      },
      catch: (error) =>
        new FileSystemError({
          message: `Failed to get file size for ${filePath}`,
          path: filePath,
          operation: "stat",
          cause: error
        })
    })
  )

export const ensureDirectory = (dirPath: string): Effect.Effect<void, FileSystemError> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const fs = await import("fs/promises")
        await fs.mkdir(dirPath, { recursive: true })
      },
      catch: (error) =>
        new FileSystemError({
          message: `Failed to create directory ${dirPath}`,
          path: dirPath,
          operation: "mkdir",
          cause: error
        })
    })
  )

// Time utilities
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

export const parseTimeToSeconds = (timeString: string): Option.Option<number> => {
  const parts = timeString.split(":").map(Number)

  if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
    const [minutes, seconds] = parts
    return Option.some(minutes * 60 + seconds)
  }

  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    const [hours, minutes, seconds] = parts
    return Option.some(hours * 3600 + minutes * 60 + seconds)
  }

  return Option.none()
}

// String utilities
export const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

export const extractSeasonEpisode = (filename: string): Option.Option<{ season: number; episode: number }> => {
  // Match patterns like S01E01, s1e1, Season 1 Episode 1, etc.
  const patterns = [
    /[Ss](\d{1,2})[Ee](\d{1,2})/,
    /[Ss]eason\s*(\d{1,2})\s*[Ee]pisode\s*(\d{1,2})/i,
    /(\d{1,2})x(\d{1,2})/
  ]

  for (const pattern of patterns) {
    const match = filename.match(pattern)
    if (match) {
      const season = parseInt(match[1], 10)
      const episode = parseInt(match[2], 10)
      if (season > 0 && episode > 0) {
        return Option.some({ season, episode })
      }
    }
  }

  return Option.none()
}

// Validation utilities
export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v"]
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."))
  return videoExtensions.includes(ext)
}

export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Array utilities
export const chunk = <T>(array: ReadonlyArray<T>, size: number): Array<Array<T>> => {
  const chunks: Array<Array<T>> = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const unique = <T>(array: ReadonlyArray<T>): Array<T> => [...new Set(array)]

// Pagination utilities
export const calculatePagination = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
  offset: (page - 1) * limit
})
