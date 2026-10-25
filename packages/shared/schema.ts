import { z } from "zod";

export const TrackSchema = z.object({
  id: z.string().min(1).max(100),
  providerId: z.string(),
  title: z.string(),
  artist: z.string(),
  artistId: z.string(),
  album: z.string(),
  albumId: z.string(),
  durationMs: z.number().positive(),
  genre: z.string(),
  color: z.string(),
  streamUrl: z.url().refine((u) => u.startsWith("https://")),
  licenseId: z.string(),
  licenseUrl: z.url(),
  sourceUrl: z.url(),
  attribution: z.string(),
  permitsStreaming: z.boolean(),
  permitsOffline: z.boolean(),
  permitsCommercialUse: z.boolean(),
  instrumental: z.boolean(),
  playbackSource: z.enum(["verified", "public-api"]).optional(),
  artwork: z
    .object({ low: z.string(), medium: z.string(), high: z.string() })
    .optional(),
});
export type Track = z.infer<typeof TrackSchema>;

export const CatalogSchema = z.object({
  tracks: z.array(TrackSchema),
  nextCursor: z.string().nullable(),
});

export const PlaylistSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(80),
  trackIds: z.array(z.string().max(100)).max(500),
});
export type Playlist = z.infer<typeof PlaylistSchema>;

export const LibrarySchema = z.object({
  favorites: z.array(z.string()).max(5000),
  playlists: z.array(PlaylistSchema).max(100),
  recent: z.array(z.string()).max(100),
});
export type Library = z.infer<typeof LibrarySchema>;

export const JamMessageSchema = z.object({
  version: z.literal(1),
  type: z.enum([
    "HELLO",
    "AUTH",
    "JOIN",
    "LEAVE",
    "PLAY",
    "PAUSE",
    "SEEK",
    "QUEUE_ADD",
    "QUEUE_REMOVE",
    "QUEUE_REORDER",
    "PING",
    "RECONNECT",
    "HOST_CHANGE",
  ]),
  token: z.string().max(8192).optional(),
  sessionId: z
    .string()
    .regex(/^[A-Z0-9]{6}$/)
    .optional(),
  trackId: z.string().max(100).optional(),
  position: z.number().min(0).max(86400).optional(),
  from: z.number().int().min(0).optional(),
  to: z.number().int().min(0).optional(),
  clientTime: z.number().optional(),
  uid: z.string().max(128).optional(),
});
export type JamMessage = z.infer<typeof JamMessageSchema>;

export interface JamSnapshot {
  id: string;
  hostUid: string;
  members: string[];
  trackId: string | null;
  queue: string[];
  position: number;
  playing: boolean;
  updatedAt: number;
  sequence: number;
}
