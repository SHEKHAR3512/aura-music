/**
 * Playback Synchronization Configuration
 * Calibrated for sub-audible latency correction and robust jitter resilience.
 */
export const SYNC_CONFIG = {
  // Drift thresholds (milliseconds)
  SYNC_DEADBAND_MS: 80, // <80ms: imperceptible, do nothing
  SYNC_RATE_ADJUST_MS: 300, // 80ms - 300ms: micro pitch/rate adjust (0.98x - 1.02x)
  SYNC_SEEK_THRESHOLD_MS: 1000, // 300ms - 1000ms: soft seek
  // > 1000ms: hard resync

  // Rate correction factors
  RATE_SLOWDOWN: 0.985, // When client is ahead of room
  RATE_SPEEDUP: 1.015, // When client is lagging behind room
  RATE_NORMAL: 1.0,

  // Clock sync ping settings
  CLOCK_PING_COUNT: 5, // Ping samples collected for median filter
  CLOCK_PING_INTERVAL_MS: 30000, // Background sync every 30s
  INITIAL_CLOCK_SYNC_TIMEOUT_MS: 4000,

  // Presence & Heartbeat
  PRESENCE_HEARTBEAT_INTERVAL_MS: 12000, // 12 seconds
  PRESENCE_OFFLINE_TIMEOUT_MS: 30000, // 30 seconds
  HOST_DISCONNECT_TAKEOVER_MS: 25000, // 25 seconds before promoting new host

  // Rate Limiting
  REACTION_RATE_LIMIT_MS: 400, // Max 1 reaction per 400ms per user
  QUEUE_ADD_RATE_LIMIT_MS: 1000, // Max 1 add per second per user
  SEEK_DEBOUNCE_MS: 200,

  // Room Expiration
  DEFAULT_ROOM_EXPIRY_HOURS: 12,
} as const;
