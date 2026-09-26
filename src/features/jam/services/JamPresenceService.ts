import { jamRepository } from './JamRepository';
import { JamRoomState, JamParticipant } from '../types/jam.types';
import { SYNC_CONFIG } from '../sync/SyncConfig';

/**
 * JamPresenceService
 * Handles participant heartbeats, presence state, and resilient host election
 * when the current host unexpectedly drops.
 */
export class JamPresenceService {
  private heartbeatInterval: any = null;
  private currentRoomId: string | null = null;
  private currentParticipant: JamParticipant | null = null;

  public startHeartbeat(roomId: string, participant: JamParticipant) {
    this.stopHeartbeat();
    this.currentRoomId = roomId;
    this.currentParticipant = participant;

    // Send immediate heartbeat
    jamRepository.sendHeartbeat(roomId, participant);

    // Periodic heartbeat every 12 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.currentRoomId && this.currentParticipant) {
        jamRepository.sendHeartbeat(this.currentRoomId, {
          ...this.currentParticipant,
          lastSeen: Date.now(),
          isOnline: navigator.onLine,
        });
      }
    }, SYNC_CONFIG.PRESENCE_HEARTBEAT_INTERVAL_MS);
  }

  public stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.currentRoomId = null;
    this.currentParticipant = null;
  }

  /**
   * Deterministically evaluates whether the room host is offline.
   * If offline beyond threshold, elects the longest-connected active participant.
   */
  public static checkAndElectNewHost(state: JamRoomState, currentUserId: string): string | null {
    const host = state.participants[state.metadata.hostId];
    const now = Date.now();

    // If host was seen recently or is marked online, do nothing
    if (host && host.isOnline && now - host.lastSeen < SYNC_CONFIG.HOST_DISCONNECT_TAKEOVER_MS) {
      return null;
    }

    // Host has dropped! Find eligible active participants
    const activeCandidates = Object.values(state.participants)
      .filter((p) => p.isOnline && p.id !== state.metadata.hostId)
      .sort((a, b) => {
        // 1. Longest joined first
        if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
        // 2. Deterministic ID tie-breaker
        return a.id.localeCompare(b.id);
      });

    if (activeCandidates.length === 0) return null;

    const newHost = activeCandidates[0];

    // Only the elected candidate or an observer executes the transfer mutation
    if (currentUserId === newHost.id) {
      jamRepository.transferHost(state.metadata.id, newHost.id);
      jamRepository.logActivity(state.metadata.id, {
        id: `${Date.now()}-host-election`,
        type: 'HOST_TRANSFER',
        actorId: 'system',
        actorName: 'System',
        timestamp: Date.now(),
        message: `${host?.displayName || 'Host'} disconnected. ${newHost.displayName} is now the host.`,
      });
      return newHost.id;
    }

    return newHost.id;
  }
}

export const jamPresenceService = new JamPresenceService();
