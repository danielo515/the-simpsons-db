import type { CommandExecutor } from "@effect/platform"
import { Command } from "@effect/platform"
import { Data, Effect, pipe } from "effect"
import type {
  AudioExtractionOptions,
  FFmpegCommand,
  ThumbnailOptions,
  VideoClipOptions,
  VideoInfo
} from "../types/index.js"

export class FFmpegError extends Data.TaggedError("FFmpegError")<{
  readonly message: string
  readonly command?: string
}> {}

export class FFmpegService extends Effect.Service<FFmpegService>()(
  "FFmpegService",
  {
    scoped: Effect.gen(function*() {
      yield* Effect.log("FFmpegService initialized")
      const executeCommand = (
        command: FFmpegCommand
      ): Effect.Effect<string, FFmpegError, CommandExecutor.CommandExecutor> =>
        pipe(
          Command.make("ffmpeg", "-i", command.input, ...command.options, command.output),
          Command.exitCode,
          Effect.timeout(command.timeout ?? 300000),
          Effect.mapError((error) =>
            new FFmpegError({
              message: `FFmpeg command failed: ${error}`,
              command: `ffmpeg -i ${command.input} ${command.options.join(" ")} ${command.output}`
            })
          ),
          Effect.map(() => command.output)
        )

      return {
        getVideoInfo: (inputPath: string): Effect.Effect<VideoInfo, FFmpegError, CommandExecutor.CommandExecutor> =>
          pipe(
            Command.make("ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inputPath),
            Command.string,
            Effect.timeout(30000),
            Effect.mapError((error) =>
              new FFmpegError({
                message: `Failed to get video info: ${error}`,
                command: `ffprobe -v quiet -print_format json -show_format -show_streams ${inputPath}`
              })
            ),
            Effect.andThen((output) => {
              try {
                const data = JSON.parse(output)
                const videoStream = data.streams?.find((stream: any) => stream.codec_type === "video")
                const audioStream = data.streams?.find((stream: any) => stream.codec_type === "audio")

                if (!videoStream) {
                  return Effect.fail(
                    new FFmpegError({
                      message: "No video stream found in file",
                      command: `ffprobe ${inputPath}`
                    })
                  )
                }

                const duration = parseFloat(data.format?.duration || videoStream.duration || "0")
                const width = parseInt(videoStream.width || "0", 10)
                const height = parseInt(videoStream.height || "0", 10)
                // const frameRate = parseFloat(videoStream.r_frame_rate?.split("/")[0] || "0")
                const bitrate = parseInt(data.format?.bit_rate || "0", 10)

                return Effect.succeed({
                  duration,
                  width,
                  height,
                  frameRate: videoStream.r_frame_rate,
                  bitrate,
                  codec: videoStream.codec_name,
                  audioCodec: audioStream?.codec_name,
                  audioChannels: audioStream?.channels,
                  audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined
                })
              } catch (parseError) {
                return Effect.fail(
                  new FFmpegError({
                    message: `Failed to parse ffprobe output: ${parseError}`,
                    command: `ffprobe ${inputPath}`
                  })
                )
              }
            })
          ),

        extractThumbnail: (
          inputPath: string,
          outputPath: string,
          options: ThumbnailOptions
        ): Effect.Effect<string, FFmpegError, CommandExecutor.CommandExecutor> => {
          const ffmpegOptions = [
            "-ss",
            options.timestamp?.toString() || "0",
            "-vframes",
            "1",
            "-f",
            "image2",
            "-q:v",
            options.quality?.toString() || "2"
          ]

          if (options.width && options.height) {
            ffmpegOptions.push("-s", `${options.width}x${options.height}`)
          } else if (options.width) {
            ffmpegOptions.push("-vf", `scale=${options.width}:-1`)
          }

          const command: FFmpegCommand = {
            input: inputPath,
            options: ffmpegOptions,
            output: outputPath,
            timeout: 30000
          }

          return executeCommand(command)
        },

        extractAudio: (
          inputPath: string,
          outputPath: string,
          options: AudioExtractionOptions
        ): Effect.Effect<string, FFmpegError, CommandExecutor.CommandExecutor> => {
          const ffmpegOptions = [
            "-vn", // No video
            "-acodec",
            options.format === "mp3" ? "libmp3lame" : "pcm_s16le",
            "-ar",
            options.sampleRate?.toString() || "44100",
            "-ac",
            options.channels?.toString() || "2"
          ]

          if (options.bitrate) {
            ffmpegOptions.push("-b:a", options.bitrate)
          }

          const command: FFmpegCommand = {
            input: inputPath,
            options: ffmpegOptions,
            output: outputPath,
            timeout: 300000 // 5 minutes for audio extraction
          }

          return executeCommand(command)
        },

        createVideoClip: (
          inputPath: string,
          outputPath: string,
          options: VideoClipOptions
        ): Effect.Effect<string, FFmpegError, CommandExecutor.CommandExecutor> => {
          const ffmpegOptions = [
            "-ss",
            options.startTime.toString(),
            "-t",
            options.duration.toString(),
            "-c",
            "copy" // Copy streams without re-encoding for speed
          ]

          // Add scaling if width/height specified
          if (options.width && options.height) {
            ffmpegOptions.splice(-2, 1) // Remove "-c", "copy"
            ffmpegOptions.push("-vf", `scale=${options.width}:${options.height}`)
            ffmpegOptions.push("-c:a", "copy") // Keep audio stream copying
          }

          const command: FFmpegCommand = {
            input: inputPath,
            options: ffmpegOptions,
            output: outputPath,
            timeout: 180000 // 3 minutes for clip creation
          }

          return executeCommand(command)
        },

        generateThumbnails: (
          inputPath: string,
          outputDir: string,
          count: number,
          options: Partial<ThumbnailOptions> = {}
        ): Effect.Effect<Array<string>, FFmpegError, CommandExecutor.CommandExecutor> => {
          // First get video info using ffprobe directly
          const getVideoInfoEffect = pipe(
            Command.make("ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", inputPath),
            Command.string,
            Effect.timeout(30000),
            Effect.mapError((error) =>
              new FFmpegError({
                message: `Failed to get video info: ${error}`,
                command: `ffprobe -v quiet -print_format json -show_format -show_streams ${inputPath}`
              })
            ),
            Effect.andThen((output) => {
              try {
                const data = JSON.parse(output)
                const videoStream = data.streams?.find((stream: any) => stream.codec_type === "video")

                if (!videoStream) {
                  return Effect.fail(
                    new FFmpegError({
                      message: "No video stream found in file",
                      command: `ffprobe ${inputPath}`
                    })
                  )
                }

                const duration = parseFloat(data.format?.duration || videoStream.duration || "0")
                return Effect.succeed({ duration })
              } catch (parseError) {
                return Effect.fail(
                  new FFmpegError({
                    message: `Failed to parse ffprobe output: ${parseError}`,
                    command: `ffprobe ${inputPath}`
                  })
                )
              }
            })
          )

          return pipe(
            getVideoInfoEffect,
            Effect.andThen((videoInfo) => {
              const interval = videoInfo.duration / (count + 1)
              const thumbnailPromises: Array<Effect.Effect<string, FFmpegError, CommandExecutor.CommandExecutor>> = []

              for (let i = 1; i <= count; i++) {
                const timestamp = interval * i
                const outputPath = `${outputDir}/thumbnail_${i.toString().padStart(3, "0")}.${options.format || "jpg"}`

                const thumbnailOptions: ThumbnailOptions = {
                  timestamp,
                  width: options.width || 320,
                  height: options.height || 180,
                  format: options.format || "jpg",
                  quality: options.quality || 85
                }

                thumbnailPromises.push(executeCommand({
                  input: inputPath,
                  options: [
                    "-ss",
                    thumbnailOptions.timestamp.toString(),
                    "-vframes",
                    "1",
                    "-f",
                    "image2",
                    "-q:v",
                    thumbnailOptions.quality.toString(),
                    ...(thumbnailOptions.width && thumbnailOptions.height
                      ? ["-s", `${thumbnailOptions.width}x${thumbnailOptions.height}`]
                      : thumbnailOptions.width
                      ? ["-vf", `scale=${thumbnailOptions.width}:-1`]
                      : [])
                  ],
                  output: outputPath,
                  timeout: 30000
                }))
              }

              return Effect.all(thumbnailPromises, { concurrency: 3 })
            })
          )
        },

        checkFFmpegAvailable: (): Effect.Effect<boolean, never, CommandExecutor.CommandExecutor> =>
          pipe(
            Command.make("ffmpeg", "-version"),
            Command.exitCode,
            Effect.map((exitCode) => exitCode === 0),
            Effect.catchAll(() => Effect.succeed(false))
          )
      }
    }),
    accessors: true
  }
) {}
