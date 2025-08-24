import type { CommandExecutor } from "@effect/platform"
import { formatDuration, sanitizeFilename } from "@simpsons-db/shared"
import { Data, Effect } from "effect"
import type { AudioExtractionOptions, ThumbnailOptions, VideoClipOptions, VideoInfo } from "../types/index.js"
import { FFmpegService } from "./ffmpeg-service.js"

export class FileSystemError extends Data.TaggedError("@app/FileSystemError")<{ message: string; cause: unknown }> {}
export class ProcessingError extends Data.TaggedError("@app/ProcessingError")<{ message: string; stage: string }> {}

export class VideoProcessor extends Effect.Service<VideoProcessor>()(
  "VideoProcessor",
  {
    effect: Effect.gen(function*() {
      const ffmpeg = yield* FFmpegService

      return {
        processVideo: (
          inputPath: string,
          outputDir: string,
          episodeId: string
        ): Effect.Effect<
          {
            videoInfo: VideoInfo
            audioPath: string
            thumbnails: Array<string>
          },
          ProcessingError | FileSystemError,
          CommandExecutor.CommandExecutor
        > =>
          Effect.gen(function*() {
            yield* Effect.annotateCurrentSpan("operation", "process_video")
            yield* Effect.annotateCurrentSpan("episodeId", episodeId)
            yield* Effect.log(`Starting video processing for episode ${episodeId}`)

            // Get video information
            const videoInfo = yield* ffmpeg.getVideoInfo(inputPath).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to get video info: ${error.message}`,
                  stage: "video_info"
                })
              )
            )

            yield* Effect.log(
              `Video info extracted: ${formatDuration(videoInfo.duration)}, ${videoInfo.width}x${videoInfo.height}`
            )

            // Extract audio for transcription
            const audioFileName = `${sanitizeFilename(episodeId)}_audio.wav`
            const audioPath = `${outputDir}/${audioFileName}`

            const audioOptions: AudioExtractionOptions = {
              format: "wav",
              sampleRate: 16000,
              channels: 1,
              bitrate: "128k"
            }

            yield* ffmpeg.extractAudio(inputPath, audioPath, audioOptions).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to extract audio: ${error.message}`,
                  stage: "audio_extraction"
                })
              )
            )

            yield* Effect.log(`Audio extracted to: ${audioPath}`)

            // Generate thumbnails
            const thumbnailCount = Math.min(10, Math.floor(videoInfo.duration / 60)) // One per minute, max 10
            const thumbnailDir = `${outputDir}/thumbnails`

            const thumbnailOptions: Partial<ThumbnailOptions> = {
              width: 320,
              height: 180,
              format: "jpg",
              quality: 85
            }

            const thumbnails = yield* ffmpeg.generateThumbnails(
              inputPath,
              thumbnailDir,
              thumbnailCount,
              thumbnailOptions
            ).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to generate thumbnails: ${error.message}`,
                  stage: "thumbnail_generation"
                })
              )
            )

            yield* Effect.log(`Generated ${thumbnails.length} thumbnails`)

            return {
              videoInfo,
              audioPath,
              thumbnails
            }
          }),

        createClip: (
          inputPath: string,
          outputPath: string,
          startTime: number,
          duration: number,
          maxWidth?: number
        ): Effect.Effect<string, ProcessingError | FileSystemError, CommandExecutor.CommandExecutor> =>
          Effect.gen(function*() {
            yield* Effect.annotateCurrentSpan("operation", "create_clip")
            yield* Effect.log(`Creating clip: ${formatDuration(startTime)} - ${formatDuration(startTime + duration)}`)

            const clipOptions: VideoClipOptions = {
              startTime,
              duration,
              width: maxWidth,
              height: maxWidth ? Math.floor(maxWidth * 9 / 16) : undefined, // 16:9 aspect ratio
              quality: 80
            }

            return yield* ffmpeg.createVideoClip(inputPath, outputPath, clipOptions).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to create video clip: ${error.message}`,
                  stage: "clip_creation"
                })
              )
            )
          }),

        extractThumbnailAtTime: (
          inputPath: string,
          outputPath: string,
          timestamp: number,
          width?: number,
          height?: number
        ): Effect.Effect<string, ProcessingError | FileSystemError, CommandExecutor.CommandExecutor> =>
          Effect.gen(function*() {
            yield* Effect.annotateCurrentSpan("operation", "extract_thumbnail")
            yield* Effect.log(`Extracting thumbnail at ${formatDuration(timestamp)}`)

            const options: ThumbnailOptions = {
              timestamp,
              width: width ?? 320,
              height: height ?? 180,
              format: "jpg",
              quality: 85
            }

            return yield* ffmpeg.extractThumbnail(inputPath, outputPath, options).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to extract thumbnail: ${error.message}`,
                  stage: "thumbnail_extraction"
                })
              )
            )
          }),

        validateVideoFile: (
          filePath: string
        ): Effect.Effect<VideoInfo, ProcessingError, CommandExecutor.CommandExecutor> =>
          Effect.gen(function*() {
            // Check if FFmpeg is available
            const ffmpegAvailable = yield* ffmpeg.checkFFmpegAvailable()
            if (!ffmpegAvailable) {
              return yield* Effect.fail(
                new ProcessingError({
                  message: "FFmpeg is not available on this system",
                  stage: "validation"
                })
              )
            }

            // Get and validate video info
            const videoInfo = yield* ffmpeg.getVideoInfo(filePath).pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Invalid video file: ${error.message}`,
                  stage: "validation"
                })
              )
            )

            // Basic validation
            if (videoInfo.duration <= 0) {
              return yield* Effect.fail(
                new ProcessingError({
                  message: "Video has invalid duration",
                  stage: "validation"
                })
              )
            }

            if (videoInfo.width <= 0 || videoInfo.height <= 0) {
              return yield* Effect.fail(
                new ProcessingError({
                  message: "Video has invalid dimensions",
                  stage: "validation"
                })
              )
            }

            yield* Effect.log(
              `Video validated: ${formatDuration(videoInfo.duration)}, ${videoInfo.width}x${videoInfo.height}`
            )

            return videoInfo
          })
      }
    }),
    accessors: true,
    dependencies: [FFmpegService.Default]
  }
) {}
