import { chunk, formatDuration, ProcessingError } from "@simpsons-db/shared"
import { Effect } from "effect"
import type { TranscriptionRequest, TranscriptionResponse, TranscriptionSegment } from "../types/index.js"
import { OpenAIService } from "./openai-service.js"

export class TranscriptionService extends Effect.Service<TranscriptionService>()("TranscriptionService", {
  scoped: Effect.gen(function*() {
    const openai = yield* OpenAIService

    const cosineSimilarity = (a: Array<number>, b: Array<number>): number => {
      if (a.length !== b.length) {
        throw new Error("Vectors must have the same length")
      }

      let dotProduct = 0
      let normA = 0
      let normB = 0

      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
      }

      const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
      return magnitude === 0 ? 0 : dotProduct / magnitude
    }

    return {
      transcribeAudioFile: (
        audioPath: string
      ): Effect.Effect<TranscriptionResponse, ProcessingError> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "transcribe_audio_file")
          yield* Effect.annotateCurrentSpan("audioPath", audioPath)
          yield* Effect.log(`Starting transcription for: ${audioPath}`)

          const request: TranscriptionRequest = {
            audioPath,
            model: "whisper-1",
            responseFormat: "verbose_json",
            temperature: 0
          }

          const transcription = yield* openai.transcribeAudio(request).pipe(
            Effect.mapError((error) =>
              new ProcessingError({
                message: `Transcription failed: ${error.message}`,
                stage: "transcription"
              })
            )
          )

          yield* Effect.log(
            `Transcription completed: ${transcription.segments.length} segments, ${
              formatDuration(
                transcription.duration
              )
            }`
          )

          return transcription
        }),

      processTranscriptionSegments: (
        segments: Array<TranscriptionSegment>,
        minSegmentLength: number = 10,
        maxSegmentLength: number = 300
      ): Effect.Effect<Array<TranscriptionSegment>, never> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "process_segments")
          yield* Effect.log(`Processing ${segments.length} transcription segments`)

          // Filter out very short segments and segments with high no-speech probability
          const filteredSegments = segments.filter((segment) =>
            segment.text.trim().length >= minSegmentLength &&
            segment.noSpeechProb < 0.8 &&
            (segment.end - segment.start) >= 1.0 // At least 1 second
          )

          // Merge segments that are too short or split segments that are too long
          const processedSegments: Array<TranscriptionSegment> = []
          let currentSegment: TranscriptionSegment | null = null

          for (const segment of filteredSegments) {
            const segmentLength = segment.text.trim().length

            if (!currentSegment) {
              currentSegment = { ...segment }
            } else if (
              currentSegment.text.length + segmentLength < maxSegmentLength &&
              (segment.start - currentSegment.end) < 2.0 // Gap less than 2 seconds
            ) {
              // Merge with current segment
              currentSegment = {
                ...currentSegment,
                end: segment.end,
                text: `${currentSegment.text.trim()} ${segment.text.trim()}`,
                tokens: [...currentSegment.tokens, ...segment.tokens],
                avgLogprob: (currentSegment.avgLogprob + segment.avgLogprob) / 2,
                compressionRatio: (currentSegment.compressionRatio + segment.compressionRatio) / 2,
                noSpeechProb: Math.max(currentSegment.noSpeechProb, segment.noSpeechProb)
              }
            } else {
              // Finalize current segment and start new one
              if (currentSegment.text.trim().length >= minSegmentLength) {
                processedSegments.push(currentSegment)
              }
              currentSegment = { ...segment }
            }
          }

          // Don't forget the last segment
          if (currentSegment && currentSegment.text.trim().length >= minSegmentLength) {
            processedSegments.push(currentSegment)
          }

          yield* Effect.log(`Processed segments: ${segments.length} -> ${processedSegments.length}`)

          return processedSegments
        }),

      createEmbeddingsForSegments: (
        segments: Array<TranscriptionSegment>,
        batchSize: number = 100
      ): Effect.Effect<Array<{ segment: TranscriptionSegment; embedding: Array<number> }>, ProcessingError> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "create_embeddings_for_segments")
          yield* Effect.log(`Creating embeddings for ${segments.length} segments`)

          const segmentBatches = chunk(segments, batchSize)
          const results: Array<{ segment: TranscriptionSegment; embedding: Array<number> }> = []

          for (const [batchIndex, batch] of segmentBatches.entries()) {
            yield* Effect.log(`Processing batch ${batchIndex + 1}/${segmentBatches.length} (${batch.length} segments)`)

            const texts = batch.map((segment) => segment.text.trim())

            const embeddings = yield* openai.createEmbeddings(texts, "text-embedding-3-small").pipe(
              Effect.mapError((error) =>
                new ProcessingError({
                  message: `Failed to create embeddings for batch ${batchIndex + 1}: ${error.message}`,
                  stage: "embedding_creation"
                })
              )
            )

            // Combine segments with their embeddings
            for (let i = 0; i < batch.length; i++) {
              results.push({
                segment: batch[i],
                embedding: embeddings[i]
              })
            }

            // Add a small delay between batches to respect rate limits
            if (batchIndex < segmentBatches.length - 1) {
              yield* Effect.sleep(1000) // 1 second delay
            }
          }

          yield* Effect.log(`Created embeddings for ${results.length} segments`)

          return results
        }),

      searchSimilarSegments: (
        queryEmbedding: Array<number>,
        segmentEmbeddings: Array<{ segment: TranscriptionSegment; embedding: Array<number> }>,
        threshold: number = 0.7,
        limit: number = 10
      ): Effect.Effect<Array<{ segment: TranscriptionSegment; similarity: number }>, never> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "search_similar_segments")

          // Calculate cosine similarity for each segment
          const similarities = segmentEmbeddings.map(({ embedding, segment }) => {
            const similarity = cosineSimilarity(queryEmbedding, embedding)
            return { segment, similarity }
          })

          // Filter by threshold and sort by similarity
          const results = similarities
            .filter((result) => result.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)

          yield* Effect.log(`Found ${results.length} similar segments (threshold: ${threshold})`)

          return results
        })
    }
  }),
  accessors: true,
  dependencies: [OpenAIService.Live]
}) {}
