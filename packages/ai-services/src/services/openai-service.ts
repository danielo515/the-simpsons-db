import { FileSystemError, OpenAIError } from "@simpsons-db/shared"
import { Config, Context, Effect, Layer, Option, Redacted } from "effect"
import OpenAI from "openai"
import type { EmbeddingRequest, TranscriptionRequest, TranscriptionResponse } from "../types/index.js"

export class OpenAIService extends Context.Tag("OpenAIService")<
  OpenAIService,
  {
    readonly transcribeAudio: (
      request: TranscriptionRequest
    ) => Effect.Effect<TranscriptionResponse, OpenAIError | FileSystemError>
    readonly createEmbedding: (request: EmbeddingRequest) => Effect.Effect<Array<number>, OpenAIError>
    readonly createEmbeddings: (
      texts: Array<string>,
      model?: string
    ) => Effect.Effect<Array<Array<number>>, OpenAIError>
    readonly checkApiKey: () => Effect.Effect<boolean, OpenAIError>
  }
>() {
  static Live = Layer.effect(
    OpenAIService,
    Effect.gen(function*() {
      const config = yield* Config.all({
        apiKey: Config.redacted("OPENAI_API_KEY"),
        organization: Config.string("OPENAI_ORGANIZATION").pipe(
          Config.option
        ),
        baseURL: Config.string("OPENAI_BASE_URL").pipe(Config.option),
        timeout: Config.number("OPENAI_TIMEOUT").pipe(Config.withDefault(60000))
      })

      const client = new OpenAI({
        apiKey: Redacted.value(config.apiKey),
        organization: config.organization.pipe(Option.getOrElse(() => undefined)),
        baseURL: config.baseURL.pipe(Option.getOrElse(() => undefined)),
        timeout: config.timeout
      })

      const transcribeAudio = (
        request: TranscriptionRequest
      ): Effect.Effect<TranscriptionResponse, OpenAIError | FileSystemError> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "transcribe_audio")
          yield* Effect.annotateCurrentSpan("model", request.model)
          yield* Effect.log(`Starting transcription for: ${request.audioPath}`)

          const transcription = yield* Effect.tryPromise({
            try: async () => {
              const fs = await import("fs")
              const audioFile = fs.createReadStream(request.audioPath)

              return await client.audio.transcriptions.create({
                file: audioFile,
                model: request.model,
                response_format: request.responseFormat,
                temperature: request.temperature
              })
            },
            catch: (error: any) => {
              if (error.code === "ENOENT") {
                return new FileSystemError({
                  message: `Audio file not found: ${request.audioPath}`,
                  path: request.audioPath,
                  operation: "read"
                })
              }
              return new OpenAIError({
                message: `Transcription failed: ${error.message}`,
                statusCode: error.status,
                requestId: error.request_id
              })
            }
          })

          yield* Effect.log(`Transcription completed: ${transcription.segments?.length || 0} segments`)

          return transcription as TranscriptionResponse
        })

      const createEmbedding = (request: EmbeddingRequest): Effect.Effect<Array<number>, OpenAIError> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "create_embedding")
          yield* Effect.annotateCurrentSpan("model", request.model)
          yield* Effect.log(`Creating embedding for text (${request.text.length} chars)`)

          const response = yield* Effect.tryPromise({
            try: async () =>
              await client.embeddings.create({
                input: request.text,
                model: request.model
              }),
            catch: (error: any) =>
              new OpenAIError({
                message: `Embedding creation failed: ${error.message}`,
                statusCode: error.status,
                requestId: error.request_id
              })
          })

          const [first] = response.data
          if (!first) {
            return yield* Effect.fail(
              new OpenAIError({
                message: "No embedding data returned from OpenAI"
              })
            )
          }

          yield* Effect.log(`Embedding created: ${first.embedding.length} dimensions`)

          return first.embedding
        })

      const createEmbeddings = (
        texts: Array<string>,
        model?: string
      ): Effect.Effect<Array<Array<number>>, OpenAIError> =>
        Effect.gen(function*() {
          yield* Effect.annotateCurrentSpan("operation", "create_embeddings_batch")
          yield* Effect.annotateCurrentSpan("count", texts.length.toString())
          yield* Effect.log(`Creating embeddings for ${texts.length} texts`)

          const response = yield* Effect.tryPromise({
            try: async () =>
              await client.embeddings.create({
                input: texts,
                model: model || "text-embedding-3-small"
              }),
            catch: (error: any) =>
              new OpenAIError({
                message: `Batch embedding creation failed: ${error.message}`,
                statusCode: error.status,
                requestId: error.request_id
              })
          })

          if (response.data.length !== texts.length) {
            return yield* Effect.fail(
              new OpenAIError({
                message: `Expected ${texts.length} embeddings, got ${response.data.length}`
              })
            )
          }

          yield* Effect.log(`Batch embeddings created: ${response.data.length} embeddings`)

          return response.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding)
        })

      const checkApiKey = (): Effect.Effect<boolean, OpenAIError> =>
        Effect.gen(function*() {
          yield* Effect.tryPromise({
            try: async () => await client.models.list(),
            catch: (error: any) =>
              new OpenAIError({
                message: `API key validation failed: ${error.message}`,
                statusCode: error.status
              })
          })

          return true
        })

      return {
        transcribeAudio,
        createEmbedding,
        createEmbeddings,
        checkApiKey
      } as const
    })
  )
}
