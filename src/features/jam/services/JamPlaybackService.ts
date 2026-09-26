import { jamRepository } from './JamRepository';
import { JamRoomState, JamPlaybackState } from '../types/jam.types';
import { Song } from '../../../lib/music/types';

export class JamPlaybackService {
  /**
   * Broadcasts Play command with updated version and timestamp.
   */
  public static async play(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    currentAudioTime?: number
  ) {
    const isHost = state.metadata.hostId === actorId;
    if (!isHost && !state.settings.allowGuestPause) {
      throw new Error('Guests do not have permission to play/pause in this Jam.');
    }

    const position =
      currentAudioTime !== undefined
        ? currentAudioTime
        : state.playback.position;

    const newPlayback: Partial<JamPlaybackState> = {
      isPlaying: true,
      position,
      playbackVersion: state.playback.playbackVersion + 1,
      updatedAt: Date.now(),
      updatedBy: actorId,
    };

    const newSeq = state.sequenceNumber + 1;
    await jamRepository.updatePlayback(state.metadata.id, newPlayback, newSeq);
    await jamRepository.logActivity(state.metadata.id, {
      id: `${Date.now()}-play`,
      type: 'PLAY',
      actorId,
      actorName,
      timestamp: Date.now(),
      message: `${actorName} resumed playback`,
    });
  }

  /**
   * Broadcasts Pause command.
   */
  public static async pause(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    currentAudioTime: number
  ) {
    const isHost = state.metadata.hostId === actorId;
    if (!isHost && !state.settings.allowGuestPause) {
      throw new Error('Guests do not have permission to pause in this Jam.');
    }

    const newPlayback: Partial<JamPlaybackState> = {
      isPlaying: false,
      position: currentAudioTime,
      playbackVersion: state.playback.playbackVersion + 1,
      updatedAt: Date.now(),
      updatedBy: actorId,
    };

    const newSeq = state.sequenceNumber + 1;
    await jamRepository.updatePlayback(state.metadata.id, newPlayback, newSeq);
    await jamRepository.logActivity(state.metadata.id, {
      id: `${Date.now()}-pause`,
      type: 'PAUSE',
      actorId,
      actorName,
      timestamp: Date.now(),
      message: `${actorName} paused playback`,
    });
  }

  /**
   * Broadcasts Seek command.
   */
  public static async seek(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    targetSeconds: number
  ) {
    const isHost = state.metadata.hostId === actorId;
    if (!isHost && !state.settings.allowGuestSeek) {
      throw new Error('Guests do not have permission to seek in this Jam.');
    }

    const newPlayback: Partial<JamPlaybackState> = {
      position: Math.max(0, targetSeconds),
      playbackVersion: state.playback.playbackVersion + 1,
      updatedAt: Date.now(),
      updatedBy: actorId,
    };

    const newSeq = state.sequenceNumber + 1;
    await jamRepository.updatePlayback(state.metadata.id, newPlayback, newSeq);
  }

  /**
   * Broadcasts Track Transition (e.g. Next Track or Selecting a Song)
   */
  public static async changeTrack(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    newTrack: Song,
    newQueue?: Song[]
  ) {
    const isHost = state.metadata.hostId === actorId;
    if (!isHost && !state.settings.allowGuestSkip) {
      throw new Error('Guests do not have permission to change tracks directly.');
    }

    const newPlayback: Partial<JamPlaybackState> = {
      trackId: newTrack.id,
      track: newTrack,
      isPlaying: true,
      position: 0,
      playbackStartedAt: Date.now(),
      playbackVersion: state.playback.playbackVersion + 1,
      updatedAt: Date.now(),
      updatedBy: actorId,
    };

    const newSeq = state.sequenceNumber + 1;
    await jamRepository.updatePlayback(state.metadata.id, newPlayback, newSeq);

    // Reset skip votes on track change
    await jamRepository.voteSkip(state.metadata.id, '', []);

    await jamRepository.logActivity(state.metadata.id, {
      id: `${Date.now()}-track`,
      type: 'TRACK_CHANGE',
      actorId,
      actorName,
      timestamp: Date.now(),
      message: `${actorName} played "${newTrack.title}"`,
      payload: { trackTitle: newTrack.title, artist: newTrack.primaryArtist },
    });
  }
}
