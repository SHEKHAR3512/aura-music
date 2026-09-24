/**
 * AURA Tactile Haptics Engine
 * Provides navigator.vibrate() haptic feedback for physical player interactions
 * (play, pause, next track, prev track, scrub, like, queue actions) on mobile devices.
 */

export type HapticType = 
  | 'play'
  | 'pause'
  | 'togglePlay'
  | 'skipForward'
  | 'skipBack'
  | 'seek'
  | 'like'
  | 'button'
  | 'queue'
  | 'selection';

// Tactile millisecond vibration patterns
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  // Play / Pause: Crisp affirmative thump
  play: 18,
  pause: 14,
  togglePlay: 16,

  // Track skips: Double rhythmic nudge mimicking physical mechanical click
  skipForward: [12, 35, 14],
  skipBack: [14, 35, 12],

  // Scrubbing along track timeline
  seek: 8,

  // Heart / Like song: Warm double heartbeat
  like: [14, 50, 22],

  // Generic buttons & switches
  button: 10,
  selection: 6,

  // Added to queue
  queue: [10, 40, 12],
};

/**
 * Triggers a designated haptic pattern if navigator.vibrate is supported by the browser and device.
 * Gracefully silent on desktops and unsupported platforms without throwing.
 */
export function triggerHaptic(type: HapticType = 'button'): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[type] ?? 10;
      return navigator.vibrate(pattern);
    }
  } catch (err) {
    // Some secure iframe policies or battery saving modes disallow vibration
  }

  return false;
}

/**
 * Custom pattern trigger for specialized interactions
 */
export function triggerCustomHaptic(pattern: number | number[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(pattern);
    }
  } catch {
    // Ignore
  }

  return false;
}
