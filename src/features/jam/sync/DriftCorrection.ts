import { SYNC_CONFIG } from './SyncConfig';
import { audioEngine } from '../../../lib/audio/AudioEngine';

export type DriftAction = 'none' | 'rate_adjust' | 'soft_seek' | 'hard_resync';

export interface DriftEvaluationResult {
  driftMs: number;
  action: DriftAction;
  targetPositionSeconds: number;
  suggestedRate: number;
}

/**
 * DriftCorrection
 * Evaluates the divergence between the client's current audio playback head
 * and the authoritative room playback position. Selects the most imperceptible
 * corrective action.
 */
export class DriftCorrection {
  private lastRateAdjustmentTime = 0;
  private isRateAdjusted = false;

  /**
   * Evaluates drift and triggers the appropriate AudioEngine correction.
   *
   * @param currentLocalTime Current audio element playback position (seconds)
   * @param expectedServerTime Authoritative expected position (seconds)
   * @param isPlaying Whether playback is actively running
   */
  public evaluateAndCorrect(
    currentLocalTime: number,
    expectedServerTime: number,
    isPlaying: boolean
  ): DriftEvaluationResult {
    if (!isPlaying || isNaN(currentLocalTime) || isNaN(expectedServerTime)) {
      // If paused or invalid, restore normal playback rate
      if (this.isRateAdjusted) {
        audioEngine.setPlaybackRate(SYNC_CONFIG.RATE_NORMAL);
        this.isRateAdjusted = false;
      }
      return {
        driftMs: 0,
        action: 'none',
        targetPositionSeconds: expectedServerTime,
        suggestedRate: SYNC_CONFIG.RATE_NORMAL,
      };
    }

    // Drift in milliseconds: positive means local is ahead, negative means local is behind
    const driftMs = Math.round((currentLocalTime - expectedServerTime) * 1000);
    const absDriftMs = Math.abs(driftMs);

    // 1. Inaudible deadband: < 80ms
    if (absDriftMs <= SYNC_CONFIG.SYNC_DEADBAND_MS) {
      if (this.isRateAdjusted) {
        audioEngine.setPlaybackRate(SYNC_CONFIG.RATE_NORMAL);
        this.isRateAdjusted = false;
      }
      return {
        driftMs,
        action: 'none',
        targetPositionSeconds: expectedServerTime,
        suggestedRate: SYNC_CONFIG.RATE_NORMAL,
      };
    }

    // 2. Micro rate adjustment: 80ms to 300ms
    // Rather than audible clicking from seeking, gently speed up or slow down
    if (absDriftMs <= SYNC_CONFIG.SYNC_RATE_ADJUST_MS) {
      const now = Date.now();
      // Local is ahead -> slow down; Local is behind -> speed up
      const suggestedRate = driftMs > 0 ? SYNC_CONFIG.RATE_SLOWDOWN : SYNC_CONFIG.RATE_SPEEDUP;

      audioEngine.setPlaybackRate(suggestedRate);
      this.isRateAdjusted = true;
      this.lastRateAdjustmentTime = now;

      return {
        driftMs,
        action: 'rate_adjust',
        targetPositionSeconds: expectedServerTime,
        suggestedRate,
      };
    }

    // Restore normal rate for larger drift where seek is required
    if (this.isRateAdjusted) {
      audioEngine.setPlaybackRate(SYNC_CONFIG.RATE_NORMAL);
      this.isRateAdjusted = false;
    }

    // 3. Controlled seek: 300ms to 1000ms
    if (absDriftMs <= SYNC_CONFIG.SYNC_SEEK_THRESHOLD_MS) {
      audioEngine.seek(expectedServerTime);
      return {
        driftMs,
        action: 'soft_seek',
        targetPositionSeconds: expectedServerTime,
        suggestedRate: SYNC_CONFIG.RATE_NORMAL,
      };
    }

    // 4. Hard resync: > 1000ms
    audioEngine.seek(expectedServerTime);
    return {
      driftMs,
      action: 'hard_resync',
      targetPositionSeconds: expectedServerTime,
      suggestedRate: SYNC_CONFIG.RATE_NORMAL,
    };
  }

  public reset() {
    if (this.isRateAdjusted) {
      audioEngine.setPlaybackRate(SYNC_CONFIG.RATE_NORMAL);
      this.isRateAdjusted = false;
    }
  }
}

export const driftCorrection = new DriftCorrection();
