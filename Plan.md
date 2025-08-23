# The Simpsons Episode Database - Technical Plan

## Overview

A local application that scans TV episodes of The Simpsons, transcribes them, creates searchable embeddings, and provides a web interface for semantic search and video clip creation.

## Core Technologies

### Backend

- **TypeScript** - Primary language
- **Effect-ts** - Functional programming framework for robust error handling and async operations
- **Node.js** - Runtime environment
- **FFmpeg** - Video processing and thumbnail extraction
- **Whisper AI** (OpenAI) - Audio transcription
- **OpenAI Embeddings API** - Text embeddings for semantic search

### Frontend

- **React** with TypeScript - Modern UI framework
- **TanStack Start** - Full-stack React framework with type-safe routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library

### Database

- **PostgreSQL** - Primary database with vector extension
- **pgvector** - Vector similarity search for embeddings
- **@effect/sql-drizzle-pg** - Effect's official Drizzle PostgreSQL integration
- **Drizzle ORM** - Type-safe schema and query builder

### Package Management

- **pnpm** - Fast, efficient package manager

## Tech Stack Architecture

This application follows a **TypeScript monorepo** structure with clear separation of concerns:

1. **Data Layer**: PostgreSQL with pgvector extension
2. **Repository Layer**: Drizzle ORM with Effect integration
3. **Service Layer**: Effect services for business logic
4. **API Layer**: HTTP endpoints using Effect's HTTP module
5. **Frontend Layer**: React with TanStack Start

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│ (TanStack Start)│◄──►│   (Effect-ts)   │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Video Pipeline │
                       │    (FFmpeg)     │
                       └─────────────────┘
```

## Monorepo Structure

```text
the-simpsons-db/
├── apps/
│   ├── web/                    # Frontend React application
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                    # Backend API server
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── admin/                  # Admin panel application
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── database/               # Database schemas and migrations
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core/                   # Shared business logic and services
│   │   ├── src/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── video-processor/        # Video processing utilities
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ai-services/            # OpenAI integration services
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                 # Shared utilities and types
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── data/
│   ├── input/                  # Raw video files
│   ├── processed/              # Processed audio, thumbnails
│   └── temp/                   # Temporary processing files
├── package.json                # Root package.json with workspaces
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── tsconfig.json               # Root TypeScript configuration
└── turbo.json                  # Turborepo configuration (optional)
```

### Package Dependencies

- **`@simpsons-db/database`**: Database schemas, migrations, and connection utilities
- **`@simpsons-db/core`**: Business logic services and repositories
- **`@simpsons-db/video-processor`**: FFmpeg integration and video processing
- **`@simpsons-db/ai-services`**: OpenAI API integration for transcription and embeddings
- **`@simpsons-db/shared`**: Common types, utilities, and constants

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// Root package.json
{
  "name": "the-simpsons-db",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  }
}
```

## Database Schema

### Episodes Table

```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255),
  air_date DATE,
  description TEXT,
  imdb_id VARCHAR(20),
  tvdb_id INTEGER,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  video_codec VARCHAR(50),
  audio_codec VARCHAR(50),
  resolution VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(season_number, episode_number)
);
```

### Transcriptions Table

```sql
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  start_time_seconds DECIMAL(10,3) NOT NULL,
  end_time_seconds DECIMAL(10,3) NOT NULL,
  text TEXT NOT NULL,
  confidence DECIMAL(4,3),
  speaker VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(episode_id, start_time_seconds)
);
```

### Transcription Embeddings Table

```sql
CREATE TABLE transcription_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX ON transcription_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Thumbnails Table

```sql
CREATE TABLE thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  timestamp_seconds DECIMAL(10,3) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(episode_id, timestamp_seconds)
);
```

### Episode Metadata Table (from API)

```sql
CREATE TABLE episode_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  air_date DATE,
  description TEXT,
  imdb_id VARCHAR(20),
  tvdb_id INTEGER,
  rating DECIMAL(3,1),
  votes INTEGER,
  writers TEXT[],
  directors TEXT[],
  guest_stars TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(season_number, episode_number)
);
```

## Video Processing Pipeline

### 1. File Discovery

- Scan input directory for video files (.mp4, .mkv, .avi)
- Extract metadata using FFprobe
- Store file information in database

### 2. Audio Extraction & Transcription

```typescript
const processAudio = Effect.gen(function* () {
  // Extract audio using FFmpeg
  yield* extractAudio(videoPath, audioPath)
  
  // Transcribe using Whisper
  const transcription = yield* transcribeAudio(audioPath)
  
  // Store transcription segments
  yield* storeTranscriptionSegments(episodeId, transcription)
})
```

### 3. Embedding Generation

```typescript
const generateEmbeddings = Effect.gen(function* () {
  const transcriptions = yield* getTranscriptions(episodeId)
  
  for (const segment of transcriptions) {
    const embedding = yield* createEmbedding(segment.text)
    yield* storeEmbedding(segment.id, embedding)
  }
})
```

### 4. Thumbnail Extraction

```typescript
const extractThumbnails = Effect.gen(function* () {
  // Extract thumbnails every 30 seconds
  const intervals = yield* calculateThumbnailIntervals(duration)
  
  for (const timestamp of intervals) {
    yield* extractThumbnail(videoPath, timestamp, outputPath)
    yield* storeThumbnailInfo(episodeId, timestamp, outputPath)
  }
})
```

## Frontend Features

### 1. Search Interface

- **Semantic Search**: Vector similarity search using embeddings
- **Filters**: Season, episode, date range, duration
- **Results**: Episode cards with thumbnails, titles, and relevant excerpts

### 2. Episode Details

- Full transcription with timestamps
- Thumbnail gallery
- Video player with transcript sync
- Metadata display (cast, crew, air date)

### 3. Clip Creation

- Select start/end timestamps from transcription
- Preview clip before generation
- Generate MP4 clips using FFmpeg
- Download or share generated clips

### 4. Admin Panel

- **Import Episodes**: Trigger metadata import from API
- **Scan Videos**: Process video files in input directory
- **Processing Status**: View progress of transcription/embedding jobs
- **Storage Management**: View disk usage, clean up temporary files

## Third-Party API Integration

### The Movie Database (TMDB) API

```typescript
const importEpisodeMetadata = Effect.gen(function* () {
  const seasons = yield* fetchSimpsonsSeasons()
  
  for (const season of seasons) {
    const episodes = yield* fetchSeasonEpisodes(season.number)
    yield* storeEpisodeMetadata(episodes)
  }
})
```

### Alternative: TVMaze API

- Free alternative to TMDB
- Good coverage of TV show data
- No API key required


## Development Phases

### Phase 1: Core Infrastructure

- Database setup with migrations
- Basic video file scanning
- Simple transcription pipeline

### Phase 2: Search & Embeddings

- Embedding generation
- Vector search implementation
- Basic web interface

### Phase 3: Advanced Features

- Clip generation
- Thumbnail extraction
- Admin panel

### Phase 4: Polish & Optimization

- Performance optimization
- Error handling improvements
- UI/UX enhancements

## Environment Configuration

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/simpsons_db"

# OpenAI
OPENAI_API_KEY="sk-..."

# TMDB (optional)
TMDB_API_KEY="..."

# Paths
INPUT_VIDEO_PATH="/path/to/simpsons/episodes"
PROCESSED_DATA_PATH="/path/to/processed/data"
```

## Effect Services Architecture

### Service Layer (Business Logic)

```typescript
// Episodes domain service
class EpisodesService extends Effect.Service<EpisodesService>()("EpisodesService", {
  scoped: Effect.gen(function* () {
    const repository = yield* EpisodesRepository
    const videoProcessor = yield* VideoProcessorService
    const transcription = yield* TranscriptionService

    const scanVideoFiles = (inputPath: string) =>
      Effect.gen(function* () {
        const files = yield* videoProcessor.discoverVideoFiles(inputPath)
        const episodes = yield* Effect.forEach(files, (file) =>
          Effect.gen(function* () {
            const metadata = yield* videoProcessor.extractMetadata(file)
            return yield* repository.create({
              filePath: file.path,
              fileSize: file.size,
              duration: metadata.duration,
              videoCodec: metadata.videoCodec,
              audioCodec: metadata.audioCodec,
              resolution: metadata.resolution
            })
          })
        )
        return episodes
      }).pipe(
        Effect.annotateSpan("scanVideoFiles", { inputPath }),
        Effect.withSpan("EpisodesService.scanVideoFiles")
      )

    const processEpisode = (episodeId: string) =>
      Effect.gen(function* () {
        const episode = yield* repository.findById(episodeId)
        yield* transcription.processEpisode(episode)
        return episode
      }).pipe(
        Effect.annotateSpan("processEpisode", { episodeId }),
        Effect.withSpan("EpisodesService.processEpisode")
      )

    return { scanVideoFiles, processEpisode }
  })
}) {}

// Embeddings domain service
class EmbeddingsService extends Effect.Service<EmbeddingsService>()("EmbeddingsService", {
  scoped: Effect.gen(function* () {
    const repository = yield* EmbeddingsRepository
    const transcriptionRepo = yield* TranscriptionRepository
    const openai = yield* OpenAIService

    const generateEmbeddings = (episodeId: string) =>
      Effect.gen(function* () {
        const transcriptions = yield* transcriptionRepo.findByEpisodeId(episodeId)
        
        const embeddings = yield* Effect.forEach(transcriptions, (segment) =>
          Effect.gen(function* () {
            const embedding = yield* openai.createEmbedding(segment.text)
            return yield* repository.create({
              transcriptionId: segment.id,
              embedding: embedding.data[0].embedding
            })
          })
        )
        
        return embeddings
      }).pipe(
        Effect.annotateSpan("generateEmbeddings", { episodeId }),
        Effect.withSpan("EmbeddingsService.generateEmbeddings")
      )

    const semanticSearch = (query: string, limit: number = 10) =>
      Effect.gen(function* () {
        const queryEmbedding = yield* openai.createEmbedding(query)
        const results = yield* repository.findSimilar(
          queryEmbedding.data[0].embedding,
          limit
        )
        return results
      }).pipe(
        Effect.annotateSpan("semanticSearch", { query, limit }),
        Effect.withSpan("EmbeddingsService.semanticSearch")
      )

    return { generateEmbeddings, semanticSearch }
  })
}) {}

// Video processing service
class VideoProcessorService extends Effect.Service<VideoProcessorService>()("VideoProcessorService", {
  scoped: Effect.gen(function* () {
    const ffmpeg = yield* FFmpegService

    const extractThumbnails = (videoPath: string, outputDir: string) =>
      Effect.gen(function* () {
        const duration = yield* ffmpeg.getDuration(videoPath)
        const intervals = Array.from(
          { length: Math.floor(duration / 30) },
          (_, i) => i * 30
        )
        
        const thumbnails = yield* Effect.forEach(intervals, (timestamp) =>
          ffmpeg.extractFrame(videoPath, timestamp, `${outputDir}/thumb_${timestamp}.jpg`)
        )
        
        return thumbnails
      }).pipe(
        Effect.annotateSpan("extractThumbnails", { videoPath }),
        Effect.withSpan("VideoProcessorService.extractThumbnails")
      )

    const createClip = (videoPath: string, startTime: number, endTime: number, outputPath: string) =>
      ffmpeg.createClip(videoPath, startTime, endTime, outputPath).pipe(
        Effect.annotateSpan("createClip", { videoPath, startTime, endTime }),
        Effect.withSpan("VideoProcessorService.createClip")
      )

    return { extractThumbnails, createClip }
  })
}) {}
```

### Repository Layer (Data Access)

```typescript
// Episodes repository interface
abstract class EpisodesRepository extends Effect.Service<EpisodesRepository>()("EpisodesRepository", {
  accessors: true
}) {
  abstract create: (data: CreateEpisodeData) => Effect.Effect<Episode, DatabaseError>
  abstract findById: (id: string) => Effect.Effect<Episode, DatabaseError | NotFoundError>
  abstract findBySeasonAndEpisode: (season: number, episode: number) => Effect.Effect<Episode, DatabaseError | NotFoundError>
  abstract findAll: (filters?: EpisodeFilters) => Effect.Effect<Episode[], DatabaseError>
  abstract update: (id: string, data: UpdateEpisodeData) => Effect.Effect<Episode, DatabaseError | NotFoundError>
  abstract delete: (id: string) => Effect.Effect<void, DatabaseError | NotFoundError>
}

// Drizzle schema definitions
import { pgTable, uuid, varchar, integer, decimal, timestamp, vector, text, bigint } from 'drizzle-orm/pg-core'

const episodes = pgTable('episodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  seasonNumber: integer('season_number').notNull(),
  episodeNumber: integer('episode_number').notNull(),
  title: varchar('title', { length: 255 }),
  airDate: timestamp('air_date', { mode: 'date' }),
  description: text('description'),
  imdbId: varchar('imdb_id', { length: 20 }),
  tvdbId: integer('tvdb_id'),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  durationSeconds: integer('duration_seconds'),
  videoCodec: varchar('video_codec', { length: 50 }),
  audioCodec: varchar('audio_codec', { length: 50 }),
  resolution: varchar('resolution', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

const transcriptions = pgTable('transcriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
  startTimeSeconds: decimal('start_time_seconds', { precision: 10, scale: 3 }).notNull(),
  endTimeSeconds: decimal('end_time_seconds', { precision: 10, scale: 3 }).notNull(),
  text: text('text').notNull(),
  confidence: decimal('confidence', { precision: 4, scale: 3 }),
  speaker: varchar('speaker', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
})

const transcriptionEmbeddings = pgTable('transcription_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  transcriptionId: uuid('transcription_id').references(() => transcriptions.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// @effect/sql-drizzle-pg implementation
import { DrizzlePgClient } from "@effect/sql-drizzle-pg"
import { eq, and } from "drizzle-orm"

class DrizzleEpisodesRepository extends EpisodesRepository {
  static readonly Live = Effect.gen(function* () {
    const db = yield* DrizzlePgClient

    const create = (data: CreateEpisodeData) =>
      db.insert(episodes).values(data).returning().pipe(
        Effect.map((rows) => rows[0] as Episode),
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )

    const findById = (id: string) =>
      db.select().from(episodes).where(eq(episodes.id, id)).pipe(
        Effect.map((rows) => rows[0] as Episode | undefined),
        Effect.flatMap((episode) =>
          episode ? Effect.succeed(episode) : Effect.fail(new NotFoundError({ id }))
        ),
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )

    const findAll = (filters?: EpisodeFilters) =>
      Effect.gen(function* () {
        let query = db.select().from(episodes)
        if (filters) {
          query = query.where(buildDrizzleWhereClause(filters))
        }
        return yield* query.orderBy(episodes.seasonNumber, episodes.episodeNumber)
      }).pipe(
        Effect.map((rows) => rows as Episode[]),
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )

    const findBySeasonAndEpisode = (season: number, episode: number) =>
      db.select().from(episodes)
        .where(and(
          eq(episodes.seasonNumber, season),
          eq(episodes.episodeNumber, episode)
        )).pipe(
          Effect.map((rows) => rows[0] as Episode | undefined),
          Effect.flatMap((ep) =>
            ep ? Effect.succeed(ep) : Effect.fail(new NotFoundError({ season, episode }))
          ),
          Effect.mapError((error) => new DatabaseError({ cause: error }))
        )

    return EpisodesRepository.of({ create, findById, findAll, findBySeasonAndEpisode })
  }).pipe(Effect.scoped)
}

// Transcription Embeddings repository
abstract class TranscriptionEmbeddingsRepository extends Effect.Service<TranscriptionEmbeddingsRepository>()("TranscriptionEmbeddingsRepository", {
  accessors: true
}) {
  abstract create: (data: CreateTranscriptionEmbeddingData) => Effect.Effect<TranscriptionEmbedding, DatabaseError>
  abstract findSimilar: (vector: number[], limit: number) => Effect.Effect<SimilarityResult[], DatabaseError>
  abstract findByTranscriptionId: (transcriptionId: string) => Effect.Effect<TranscriptionEmbedding[], DatabaseError>
}

class DrizzleTranscriptionEmbeddingsRepository extends TranscriptionEmbeddingsRepository {
  static readonly Live = Effect.gen(function* () {
    const db = yield* DrizzlePgClient

    const create = (data: CreateTranscriptionEmbeddingData) =>
      db.insert(transcriptionEmbeddings).values(data).returning().pipe(
        Effect.map((rows) => rows[0] as TranscriptionEmbedding),
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )

    const findSimilar = (vector: number[], limit: number) =>
      db.execute(sql`
        SELECT e.*, t.text, t.start_time_seconds, t.end_time_seconds, 
               ep.title, ep.season_number, ep.episode_number,
               1 - (e.embedding <=> ${vector}::vector) as similarity
        FROM ${transcriptionEmbeddings} e
        JOIN ${transcriptions} t ON e.transcription_id = t.id
        JOIN ${episodes} ep ON t.episode_id = ep.id
        ORDER BY e.embedding <=> ${vector}::vector
        LIMIT ${limit}
      `).pipe(
        Effect.map((result) => result.rows as SimilarityResult[]),
        Effect.mapError((error) => new DatabaseError({ cause: error }))
      )

    const findByTranscriptionId = (transcriptionId: string) =>
      db.select().from(transcriptionEmbeddings)
        .where(eq(transcriptionEmbeddings.transcriptionId, transcriptionId)).pipe(
          Effect.map((rows) => rows as TranscriptionEmbedding[]),
          Effect.mapError((error) => new DatabaseError({ cause: error }))
        )

    return TranscriptionEmbeddingsRepository.of({ create, findSimilar, findByTranscriptionId })
  }).pipe(Effect.scoped)
}

// Transcription repository
abstract class TranscriptionRepository extends Effect.Service<TranscriptionRepository>()("TranscriptionRepository", {
  accessors: true
}) {
  abstract create: (data: CreateTranscriptionData) => Effect.Effect<Transcription, DatabaseError>
  abstract findByEpisodeId: (episodeId: string) => Effect.Effect<Transcription[], DatabaseError>
  abstract findByTimeRange: (episodeId: string, startTime: number, endTime: number) => Effect.Effect<Transcription[], DatabaseError>
}
```

### External Service Interfaces

```typescript
// OpenAI service
abstract class OpenAIService extends Effect.Service<OpenAIService>()("OpenAIService", {
  accessors: true
}) {
  abstract createEmbedding: (text: string) => Effect.Effect<EmbeddingResponse, OpenAIError>
  abstract transcribeAudio: (audioPath: string) => Effect.Effect<TranscriptionResponse, OpenAIError>
}

// FFmpeg service
abstract class FFmpegService extends Effect.Service<FFmpegService>()("FFmpegService", {
  accessors: true
}) {
  abstract extractAudio: (videoPath: string, audioPath: string) => Effect.Effect<void, FFmpegError>
  abstract extractFrame: (videoPath: string, timestamp: number, outputPath: string) => Effect.Effect<string, FFmpegError>
  abstract createClip: (videoPath: string, startTime: number, endTime: number, outputPath: string) => Effect.Effect<string, FFmpegError>
  abstract getDuration: (videoPath: string) => Effect.Effect<number, FFmpegError>
}
```

### Testing with Mock Repositories

```typescript
// Mock repository for testing
class MockEpisodesRepository extends EpisodesRepository {
  static readonly Test = Effect.gen(function* () {
    const episodes = new Map<string, Episode>()

    const create = (data: CreateEpisodeData) =>
      Effect.sync(() => {
        const episode = { id: crypto.randomUUID(), ...data, createdAt: new Date() }
        episodes.set(episode.id, episode)
        return episode
      })

    const findById = (id: string) =>
      Effect.sync(() => {
        const episode = episodes.get(id)
        if (!episode) return Effect.fail(new NotFoundError({ id }))
        return Effect.succeed(episode)
      }).pipe(Effect.flatten)

    return EpisodesRepository.of({ create, findById })
  })
}

// Test example
const testEpisodesService = Effect.gen(function* () {
  const service = yield* EpisodesService
  const episode = yield* service.scanVideoFiles("/test/path")
  expect(episode).toBeDefined()
}).pipe(
  Effect.provide(MockEpisodesRepository.Test),
  Effect.provide(EpisodesService.Default)
)
```

## Performance Considerations

- **Batch Processing**: Process multiple episodes in parallel
- **Chunked Embeddings**: Split long transcriptions into searchable chunks
- **Caching**: Cache frequently accessed embeddings and metadata
- **Indexing**: Proper database indexes for fast queries
- **Storage**: Separate hot (thumbnails) and cold (full videos) storage
