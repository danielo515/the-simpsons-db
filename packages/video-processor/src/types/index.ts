import { Schema } from "effect"

export const FFmpegCommand = Schema.Struct({
  input: Schema.String.pipe(Schema.minLength(1)),
  output: Schema.String.pipe(Schema.minLength(1)),
  options: Schema.Array(Schema.String),
  timeout: Schema.optional(Schema.Number.pipe(Schema.positive()))
})
export type FFmpegCommand = typeof FFmpegCommand.Type

export const VideoInfo = Schema.Struct({
  duration: Schema.Number.pipe(Schema.positive()),
  width: Schema.Number.pipe(Schema.int(), Schema.positive()),
  height: Schema.Number.pipe(Schema.int(), Schema.positive()),
  frameRate: Schema.Number.pipe(Schema.positive()),
  bitrate: Schema.Number.pipe(Schema.int(), Schema.positive()),
  codec: Schema.String,
  audioCodec: Schema.optional(Schema.String),
  audioChannels: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  audioSampleRate: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive()))
})
export type VideoInfo = typeof VideoInfo.Type

export const ThumbnailOptions = Schema.Struct({
  timestamp: Schema.Number.pipe(Schema.nonNegative()),
  width: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  height: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  format: Schema.Literal("jpg", "png", "webp").pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => "jpg" as const)
  ),
  quality: Schema.Number.pipe(
    Schema.between(1, 100),
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 85)
  )
})
export type ThumbnailOptions = typeof ThumbnailOptions.Type
export const makeThumbnailOptions = Schema.decodeUnknown(ThumbnailOptions)
export const encodeThumbnailOptions = Schema.encodeUnknown(ThumbnailOptions)

export const AudioExtractionOptions = Schema.Struct({
  format: Schema.Literal("wav", "mp3", "flac").pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => "wav" as const)
  ),
  sampleRate: Schema.Number.pipe(
    Schema.int(),
    Schema.positive(),
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 16000)
  ),
  channels: Schema.Number.pipe(
    Schema.int(),
    Schema.between(1, 2),
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 1)
  ),
  bitrate: Schema.String.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => "128k")
  )
})
export type AudioExtractionOptions = typeof AudioExtractionOptions.Type
export const makeAudioExtractionOptions = Schema.decodeUnknown(AudioExtractionOptions)
export const encodeAudioExtractionOptions = Schema.encodeUnknown(AudioExtractionOptions)

export const VideoClipOptions = Schema.Struct({
  startTime: Schema.Number.pipe(Schema.nonNegative()),
  duration: Schema.Number.pipe(Schema.positive()),
  width: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  height: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  quality: Schema.Number.pipe(
    Schema.between(1, 100),
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 85)
  )
})
export type VideoClipOptions = typeof VideoClipOptions.Type
export const makeVideoClipOptions = Schema.decodeUnknown(VideoClipOptions)
export const encodeVideoClipOptions = Schema.encodeUnknown(VideoClipOptions)
