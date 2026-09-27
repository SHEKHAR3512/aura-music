import { z } from 'zod';
import { Song } from '../../../lib/music/types';

export type JamRole = 'host' | 'guest';

export type JamMode = 'chill' | 'party' | 'discover' | 'focus' | 'nostalgia';

export type JamPrivacy = 'public_link' | 'invite_only';

export type JamConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'syncing'
  | 'synced';

export interface JamParticipant {
  id: string; // userId or deviceId
  displayName: string;
  avatar: string;
  role: JamRole;
  isOnline: boolean;
  joinedAt: number;
  lastSeen: number;
  currentTrackId?: string;
  isAnonymous?: boolean;
}

export interface JamSettings {
  allowGuestQueue: boolean;
  allowGuestReorder: boolean;
  allowGuestSkip: boolean;
  allowGuestPause: boolean;
  allowGuestSeek: boolean;
  allowGuestVolume: boolean;
  allowReactions: boolean;
  allowRecommendations: boolean;
  voteSkipThresholdPercent: number; // e.g. 50%
}

export interface JamPlaybackState {
  trackId: string | null;
  track: Song | null;
  isPlaying: boolean;
  position: number; // seconds at serverTimestamp
  playbackStartedAt: number; // millisecond timestamp
  playbackVersion: number;
  updatedAt: number;
  updatedBy: string;
}

export interface JamQueueItem {
  id: string;
  track: Song;
  addedBy: {
    id: string;
    displayName: string;
    avatar: string;
  };
  addedAt: number;
  position: number; // order index
  source?: string;
}

export interface JamReaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  emoji: '🔥' | '❤️' | '😂' | '🎵' | '💀' | '✨' | '🫶' | string;
  timestamp: number;
  trackId?: string;
}

export interface JamActivityEvent {
  id: string;
  type:
    | 'USER_JOIN'
    | 'USER_LEAVE'
    | 'HOST_TRANSFER'
    | 'PLAY'
    | 'PAUSE'
    | 'SEEK'
    | 'TRACK_CHANGE'
    | 'QUEUE_ADD'
    | 'QUEUE_REMOVE'
    | 'QUEUE_REORDER'
    | 'SETTINGS_CHANGE'
    | 'REACTION'
    | 'VOTE_SKIP'
    | 'ROOM_MODE_CHANGE'
    | 'ROOM_END';
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  timestamp: number;
  payload?: any;
  message: string;
}

export interface GenreShare {
  genre: string;
  percentage: number;
}

export interface LanguageShare {
  language: string;
  percentage: number;
}

export interface RoomDNA {
  genres: GenreShare[];
  languages: LanguageShare[];
  energy: 'LOW' | 'MEDIUM' | 'HIGH';
  topArtists: string[];
  vibeDescription: string;
  calculatedAt: number;
}

export interface JamSongRequest {
  id: string;
  track: Song;
  requestedBy: {
    id: string;
    displayName: string;
    avatar: string;
  };
  requestedAt: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface JamRoomMetadata {
  id: string; // 6-8 char code, e.g. "X7K92P"
  name: string;
  hostId: string;
  createdAt: number;
  expiresAt: number;
  privacy: JamPrivacy;
  mode: JamMode;
  inviteToken: string;
  active: boolean;
}

export interface JamRoomState {
  metadata: JamRoomMetadata;
  playback: JamPlaybackState;
  queue: JamQueueItem[];
  participants: Record<string, JamParticipant>;
  settings: JamSettings;
  reactions: JamReaction[];
  activity: JamActivityEvent[];
  songRequests: JamSongRequest[];
  skipVotes: string[]; // userIds who voted to skip current track
  roomDNA?: RoomDNA;
  sequenceNumber: number;
  serverTimestamp: number;
}

export interface JamSessionSummary {
  roomId: string;
  roomName: string;
  durationSeconds: number;
  totalTracksPlayed: number;
  participantCount: number;
  topArtists: string[];
  topTrack: Song | null;
  totalReactions: number;
  roomDNA: RoomDNA | null;
  startedAt: number;
  endedAt: number;
}

// Zod Schemas for runtime safety
export const JamSettingsSchema = z.object({
  allowGuestQueue: z.boolean().default(true),
  allowGuestReorder: z.boolean().default(true),
  allowGuestSkip: z.boolean().default(false),
  allowGuestPause: z.boolean().default(false),
  allowGuestSeek: z.boolean().default(false),
  allowGuestVolume: z.boolean().default(true),
  allowReactions: z.boolean().default(true),
  allowRecommendations: z.boolean().default(true),
  voteSkipThresholdPercent: z.number().min(25).max(100).default(50),
});

export const JamPlaybackStateSchema = z.object({
  trackId: z.string().nullable(),
  track: z.any().nullable(),
  isPlaying: z.boolean(),
  position: z.number(),
  playbackStartedAt: z.number(),
  playbackVersion: z.number(),
  updatedAt: z.number(),
  updatedBy: z.string(),
});
