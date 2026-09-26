import { SYNC_CONFIG } from './SyncConfig';

/**
 * ClockSyncService
 * Estimates network latency (Round Trip Time) and local-to-server clock offset.
 * Employs NTP-like median filtering over multiple packet exchanges to discard outliers.
 */
class ClockSyncService {
  private serverTimeOffset: number = 0; // serverTime - localTime (in ms)
  private estimatedRtt: number = 0; // round-trip time (in ms)
  private isSynchronized: boolean = false;
  private syncTimer: any = null;

  constructor() {
    this.startBackgroundSync();
  }

  /**
   * Performs an NTP-style multi-probe clock calibration.
   */
  public async syncClock(): Promise<{ offset: number; rtt: number }> {
    const probes: Array<{ offset: number; rtt: number }> = [];

    for (let i = 0; i < SYNC_CONFIG.CLOCK_PING_COUNT; i++) {
      try {
        const clientSendTime = Date.now();
        const res = await fetch(`/api/jam/ping?clientTime=${clientSendTime}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const clientReceiveTime = Date.now();
          const data = await res.json();
          const serverTime = Number(data.serverTimestamp) || clientReceiveTime;

          const rtt = Math.max(1, clientReceiveTime - clientSendTime);
          // NTP offset formula: ((serverReceiveTime - clientSendTime) + (serverSendTime - clientReceiveTime)) / 2
          // Assuming symmetric transit: serverTime - (clientSendTime + rtt / 2)
          const offset = Math.round(serverTime - (clientSendTime + rtt / 2));

          probes.push({ offset, rtt });
        }
      } catch (e) {
        // Probe failed, continue
      }

      // Small jitter between probe packets
      await new Promise((r) => setTimeout(r, 60));
    }

    if (probes.length > 0) {
      // Sort by RTT ascending (prefer packets with lowest transit delay)
      probes.sort((a, b) => a.rtt - b.rtt);
      // Select lowest RTT probe or median of top 3
      const bestProbe = probes[0];
      this.serverTimeOffset = bestProbe.offset;
      this.estimatedRtt = bestProbe.rtt;
      this.isSynchronized = true;
    }

    return {
      offset: this.serverTimeOffset,
      rtt: this.estimatedRtt,
    };
  }

  /**
   * Sets manual offset if reported by Firebase Realtime Database info/serverTimeOffset
   */
  public setFirebaseOffset(offset: number) {
    if (!isNaN(offset) && isFinite(offset)) {
      this.serverTimeOffset = offset;
      this.isSynchronized = true;
    }
  }

  /**
   * Returns current high-precision estimated server timestamp in milliseconds.
   */
  public getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Returns current estimated clock offset (ms).
   */
  public getOffset(): number {
    return this.serverTimeOffset;
  }

  /**
   * Returns estimated round-trip latency (ms).
   */
  public getRtt(): number {
    return this.estimatedRtt;
  }

  public getIsSynchronized(): boolean {
    return this.isSynchronized;
  }

  private startBackgroundSync() {
    // Initial sync
    setTimeout(() => {
      this.syncClock().catch(() => {});
    }, 500);

    // Periodic sync
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      this.syncClock().catch(() => {});
    }, SYNC_CONFIG.CLOCK_PING_INTERVAL_MS);
  }

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const clockSyncService = new ClockSyncService();
