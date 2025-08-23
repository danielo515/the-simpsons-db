import { Args, Command, Options } from "@effect/cli"
import { TranscriptionService } from "@simpsons-db/ai-services"
import { EpisodeService } from "@simpsons-db/domain"
import { VideoProcessor } from "@simpsons-db/video-processor"
import { Effect } from "effect"

const episodeIdArg = Args.text("episode-id").pipe(
  Args.withDescription("Episode ID to process")
)

const skipTranscriptionOption = Options.boolean("skip-transcription").pipe(
  Options.withDescription("Skip audio transcription step")
)

const skipThumbnailsOption = Options.boolean("skip-thumbnails").pipe(
  Options.withDescription("Skip thumbnail generation step")
)

export const processCommand = Command.make("process", {
  summary: "Process a video episode (extract audio, generate thumbnails, transcribe)",
  args: episodeIdArg,
  options: Effect.all([skipTranscriptionOption, skipThumbnailsOption])
}).pipe(
  Command.withHandler(({ args: episodeId, options: { skipThumbnails, skipTranscription } }) =>
    Effect.gen(function*() {
      const episodeService = yield* EpisodeService
      const videoProcessor = yield* VideoProcessor
      const transcriptionService = yield* TranscriptionService

      yield* Effect.log(`Processing episode: ${episodeId}`)

      // Get episode details
      const episode = yield* episodeService.findById(episodeId)
      yield* Effect.log(`Found episode: ${episode.fileName}`)

      // Mark as processing
      yield* episodeService.markAsProcessing(episodeId)

      try {
        // Process video (extract audio and thumbnails)
        const outputDir = `./data/processed/${episodeId}`
        const result = yield* videoProcessor.processVideo(
          episode.filePath,
          outputDir,
          episodeId
        )

        yield* Effect.log(`Video processing completed`)
        yield* Effect.log(`Audio extracted: ${result.audioPath}`)
        yield* Effect.log(`Thumbnails generated: ${result.thumbnails.length}`)

        // Transcribe audio if not skipped
        if (!skipTranscription) {
          yield* Effect.log("Starting transcription...")
          const transcription = yield* transcriptionService.transcribeAudioFile(result.audioPath)
          yield* Effect.log(`Transcription completed: ${transcription.segments.length} segments`)
        }

        // Mark as completed
        yield* episodeService.markAsCompleted(episodeId)
        yield* Effect.log(`Episode processing completed successfully`)
      } catch (error) {
        yield* episodeService.markAsFailed(episodeId, String(error))
        yield* Effect.fail(error)
      }
    })
  )
)
