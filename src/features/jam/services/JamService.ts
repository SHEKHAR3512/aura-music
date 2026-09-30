import { jamRepository } from './JamRepository';
import {
  JamRoomState,
  JamRoomMetadata,
  JamPlaybackState,
  JamQueueItem,
  JamParticipant,
  JamSettings,
  JamMode,
  JamPrivacy,
  JamSessionSummary,
} from '../types/jam.types';
import { generateJamRoomCode, generateInviteToken } from '../utils/jamUtils';
import { SYNC_CONFIG } from '../sync/SyncConfig';
import { Song } from '../../../lib/music/types';

export class JamService {
  /**
   * Creates a new Jam listening room with a unique short ID.
   */
  public static async createRoom(params: {
    roomName: string;
    mode: JamMode;
    privacy: JamPrivacy;
    host: { id: string; name: string; avatar: string; isAnonymous?: boolean };
    initialTrack: Song | null;
    initialQueue: Song[];
    settings?: Partial<JamSettings>;
  }): Promise<JamRoomState> {
    const roomId = generateJamRoomCode();
    const now = Date.now();

    const metadata: JamRoomMetadata = {
      id: roomId,
      name: params.roomName.trim() || 'Late Night Jam',
      hostId: params.host.id,
      createdAt: now,
      expiresAt: now + SYNC_CONFIG.DEFAULT_ROOM_EXPIRY_HOURS * 3600 * 1000,
      privacy: params.privacy,
      mode: params.mode,
      inviteToken: generateInviteToken(),
      active: true,
    };

    const hostParticipant: JamParticipant = {
      id: params.host.id,
      displayName: params.host.name || 'Host',
      avatar: params.host.avatar,
      role: 'host',
      isOnline: true,
      joinedAt: now,
      lastSeen: now,
      isAnonymous: params.host.isAnonymous,
    };

    const playback: JamPlaybackState = {
      trackId: params.initialTrack?.id || null,
      track: params.initialTrack,
      isPlaying: !!params.initialTrack,
      position: 0,
      playbackStartedAt: now,
      playbackVersion: 1,
      updatedAt: now,
      updatedBy: params.host.id,
    };

    const queue: JamQueueItem[] = params.initialQueue.map((track, idx) => ({
      id: `${track.id}-${idx}`,
      track,
      addedBy: {
        id: params.host.id,
        displayName: params.host.name,
        avatar: params.host.avatar,
      },
      addedAt: now + idx,
      position: idx,
    }));

    const defaultSettings: JamSettings = {
      allowGuestQueue: true,
      allowGuestReorder: true,
      allowGuestSkip: false,
      allowGuestPause: false,
      allowGuestSeek: false,
      allowGuestVolume: true,
      allowReactions: true,
      allowRecommendations: true,
      voteSkipThresholdPercent: 50,
      ...params.settings,
    };

    return jamRepository.createRoom(
      metadata,
      playback,
      queue,
      hostParticipant,
      defaultSettings
    );
  }

  /**
   * Joins an existing Jam room
   */
  public static async joinRoom(
    roomId: string,
    participant: { id: string; name: string; avatar: string; isAnonymous?: boolean }
  ): Promise<boolean> {
    const cleanId = roomId.trim().toUpperCase();

    const member: JamParticipant = {
      id: participant.id,
      displayName: participant.name,
      avatar: participant.avatar,
      role: 'guest',
      isOnline: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isAnonymous: participant.isAnonymous,
    };

    await jamRepository.sendHeartbeat(cleanId, member);
    await jamRepository.logActivity(cleanId, {
      id: `${Date.now()}-join`,
      type: 'USER_JOIN',
      actorId: participant.id,
      actorName: participant.name,
      actorAvatar: participant.avatar,
      timestamp: Date.now(),
      message: `${participant.name} joined the Jam`,
    });

    return true;
  }

  /**
   * Leaves active Jam room
   */
  public static async leaveRoom(roomId: string, userId: string, userName: string) {
    await jamRepository.leaveRoom(roomId, userId);
    await jamRepository.logActivity(roomId, {
      id: `${Date.now()}-leave`,
      type: 'USER_LEAVE',
      actorId: userId,
      actorName: userName,
      timestamp: Date.now(),
      message: `${userName} left the Jam`,
    });
  }

  /**
   * Ends room and stores session analytics in Firestore
   */
  public static async endRoom(state: JamRoomState): Promise<JamSessionSummary> {
    const now = Date.now();
    const durationSeconds = Math.max(0, Math.round((now - state.metadata.createdAt) / 1000));
    const participantsList = Object.values(state.participants);

    const summary: JamSessionSummary = {
      roomId: state.metadata.id,
      roomName: state.metadata.name,
      durationSeconds,
      totalTracksPlayed: Math.max(1, state.queue.length + 1),
      participantCount: participantsList.length,
      topArtists: state.roomDNA?.topArtists || ['Aura Artists'],
      topTrack: state.playback.track,
      totalReactions: state.reactions.length,
      roomDNA: state.roomDNA || null,
      startedAt: state.metadata.createdAt,
      endedAt: now,
    };

    await jamRepository.endRoom(state.metadata.id);
    await jamRepository.saveSessionSummary(summary);

    return summary;
  }
}
