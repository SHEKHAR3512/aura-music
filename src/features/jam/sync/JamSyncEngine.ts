import { JamPlaybackState, JamConnectionState } from '../types/jam.types';
import { clockSyncService } from './ClockSyncService';
import { driftCorrection, DriftEvaluationResult } from './DriftCorrection';
import { audioEngine } from '../../../lib/audio/AudioEngine';
import { Song } from '../../../lib/music/types';

export type SyncStateCallback = (state: {
  connectionState: JamConnectionState;
  expectedPosition: number;
  actualPosition: number;
  driftMs: number;
  isSynced: boolean;
}) => void;

/**
 * JamSyncEngine
 * Authoritative client-side synchronization engine.
 * Calculates expected playback position from server playback events,
 * detects drift against the local HTML5 Audio element, and orchestrates
 * drift correction and track changes without audible glitching.
 */
class JamSyncEngine {
  private currentPlaybackState: JamPlaybackState | null = null;
  private currentTrack: Song | null = null;
  private isProcessingEvent = false;
  private syncIntervalTimer: any = null;
  private lastDriftResult: DriftEvaluationResult | null = null;
  private stateListeners = new Set<SyncStateCallback>();
  private activeRoomId: string | null = null;
  private isLocallyPausedByDrift = false;

  /**
   * Initializes or updates playback synchronization for an active room.
   */
  public attachRoom(roomId: string) {
    this.activeRoomId = roomId;
    this.startSyncLoop();
  }

  public detachRoom() {
    this.activeRoomId = null;
    this.stopSyncLoop();
    this.currentPlaybackState = null;
    this.currentTrack = null;
    driftCorrection.reset();
  }

  /**
   * Calculates the authoritative expected playback position in seconds.
   */
  public calculateExpectedPosition(playbackState: JamPlaybackState): number {
    if (!playbackState.isPlaying) {
      return Math.max(0, playbackState.position);
    }

    const currentServerTime = clockSyncService.getServerTime();
    // Milliseconds elapsed since the state was broadcasted
    const elapsedMs = Math.max(0, currentServerTime - playbackState.updatedAt);
    const elapsedSeconds = elapsedMs / 1000;

    return Math.max(0, playbackState.position + elapsedSeconds);
  }

  /**
   * Receives incoming authoritative server playback state.
   * Enforces event ordering and version monotonicity.
   */
  public async handleServerPlaybackUpdate(
    newState: JamPlaybackState,
    songResolver?: (trackId: string) => Promise<Song | null>
  ): Promise<void> {
    // 1. Version check: discard older / stale events to eliminate race conditions
    if (
      this.currentPlaybackState &&
      newState.playbackVersion < this.currentPlaybackState.playbackVersion
    ) {
      return;
    }

    const isTrackChange =
      !this.currentPlaybackState ||
      newState.trackId !== this.currentPlaybackState.trackId;
    const isPlayStateChange =
      !this.currentPlaybackState ||
      newState.isPlaying !== this.currentPlaybackState.isPlaying;

    this.currentPlaybackState = newState;

    // 2. Handle Track Transition
    if (isTrackChange && newState.trackId) {
      this.isProcessingEvent = true;
      let targetSong = newState.track;

      if (!targetSong && songResolver) {
        targetSong = await songResolver(newState.trackId);
      }

      if (targetSong && targetSong.audioUrl) {
        this.currentTrack = targetSong;
        const expectedPos = this.calculateExpectedPosition(newState);

        try {
          await audioEngine.loadAndPlay(targetSong.audioUrl, false);
          if (expectedPos > 0.5) {
            audioEngine.seek(expectedPos);
          }
          if (!newState.isPlaying) {
            audioEngine.pause();
          }
        } catch (e) {
          console.warn('JamSyncEngine: audio load failure, will retry:', e);
        }
      }
      this.isProcessingEvent = false;
      return;
    }

    // 3. Handle Play / Pause / Seek on the same track
    const expectedPos = this.calculateExpectedPosition(newState);
    const currentAudioTime = audioEngine.getCurrentTime();

    if (isPlayStateChange) {
      if (newState.isPlaying) {
        audioEngine.seek(expectedPos);
        audioEngine.play().catch(() => {});
      } else {
        audioEngine.pause();
        audioEngine.seek(expectedPos);
      }
      return;
    }

    // 4. Seek adjustment
    const driftMs = Math.abs((currentAudioTime - expectedPos) * 1000);
    if (driftMs > 300) {
      audioEngine.seek(expectedPos);
    }
  }

  /**
   * High frequency background drift watchdog loop (runs every 1000ms)
   */
  private startSyncLoop() {
    this.stopSyncLoop();
    this.syncIntervalTimer = setInterval(() => {
      this.performPeriodicDriftCheck();
    }, 1000);
  }

  private stopSyncLoop() {
    if (this.syncIntervalTimer) {
      clearInterval(this.syncIntervalTimer);
      this.syncIntervalTimer = null;
    }
  }

  /**
   * Evaluates drift and notifies registered diagnostic listeners.
   */
  public performPeriodicDriftCheck() {
    if (!this.currentPlaybackState || this.isProcessingEvent) return;

    const expectedPosition = this.calculateExpectedPosition(this.currentPlaybackState);
    const actualPosition = audioEngine.getCurrentTime();
    const isPlaying = this.currentPlaybackState.isPlaying && !audioEngine.isPaused();

    const driftResult = driftCorrection.evaluateAndCorrect(
      actualPosition,
      expectedPosition,
      isPlaying
    );
    this.lastDriftResult = driftResult;

    const isSynced = Math.abs(driftResult.driftMs) <= 150;

    // Notify UI / Status components
    this.stateListeners.forEach((listener) => {
      listener({
        connectionState: isSynced ? 'synced' : 'syncing',
        expectedPosition,
        actualPosition,
        driftMs: driftResult.driftMs,
        isSynced,
      });
    });
  }

  public subscribeState(listener: SyncStateCallback): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public getCurrentDrift(): number {
    return this.lastDriftResult?.driftMs || 0;
  }

  public getExpectedPosition(): number {
    return this.currentPlaybackState
      ? this.calculateExpectedPosition(this.currentPlaybackState)
      : audioEngine.getCurrentTime();
  }
}

export const jamSyncEngine = new JamSyncEngine();
