/**
 * Jam Utility Functions
 */

export function generateJamRoomCode(): string {
  // Uppercase alphanumeric excluding ambiguous characters (0, O, I, 1)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateInviteToken(): string {
  return `${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}

let cachedNetworkOrigin: string | null = null;

if (typeof window !== 'undefined') {
  fetch('/api/system/info')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.url) {
        cachedNetworkOrigin = data.url;
      }
    })
    .catch(() => {});
}

export function getCachedNetworkOrigin(): string | null {
  return cachedNetworkOrigin;
}

export function getJamShareUrl(roomId: string, inviteToken?: string, preferNetworkIp: boolean = true): string {
  if (typeof window === 'undefined') return `/jam/${roomId}`;
  let origin = window.location.origin;

  // When on localhost/127.0.0.1 and a network IP is available, prefer the network IP
  // so phones scanning the QR code or opening the link can connect seamlessly
  if (
    preferNetworkIp &&
    cachedNetworkOrigin &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    origin = cachedNetworkOrigin;
  }

  const tokenParam = inviteToken ? `?token=${encodeURIComponent(inviteToken)}` : '';
  return `${origin}/jam/${roomId}${tokenParam}`;
}

export function formatTimeRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
];
