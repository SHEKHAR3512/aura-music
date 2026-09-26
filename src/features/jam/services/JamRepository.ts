import { rtdb, db } from '../../../lib/firebase';
import {
  ref,
  set,
  get,
  update,
  onValue,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
  Unsubscribe,
} from 'firebase/database';
import { doc, setDoc, collection } from 'firebase/firestore';
import {
  JamRoomState,
  JamRoomMetadata,
  JamPlaybackState,
  JamQueueItem,
  JamParticipant,
  JamSettings,
  JamReaction,
  JamActivityEvent,
  JamSessionSummary,
  JamSongRequest,
} from '../types/jam.types';

/**
 * JamRepository
 * Unified data access layer for Jam listening rooms.
 * Bridges Firebase Realtime Database with intelligent Server WebSocket fallback
 * for zero-downtime offline/local resilience.
 */
class JamRepository {
  private activeWs: WebSocket | null = null;
  private wsListeners = new Set<(state: JamRoomState) => void>();
  private activeRoomId: string | null = null;
  private rtdbUnsub: Unsubscribe | null = null;

  /**
   * Creates a new Jam listening room
   */
  public async createRoom(
    metadata: JamRoomMetadata,
    initialPlayback: JamPlaybackState,
    initialQueue: JamQueueItem[],
    host: JamParticipant,
    settings: JamSettings
  ): Promise<JamRoomState> {
    const initialState: JamRoomState = {
      metadata,
      playback: initialPlayback,
      queue: initialQueue,
      participants: { [host.id]: host },
      settings,
      reactions: [],
      activity: [
        {
          id: `${Date.now()}-init`,
          type: 'USER_JOIN',
          actorId: host.id,
          actorName: host.displayName,
          actorAvatar: host.avatar,
          timestamp: Date.now(),
          message: `${host.displayName} created the Jam room "${metadata.name}"`,
        },
      ],
      songRequests: [],
      skipVotes: [],
      sequenceNumber: 1,
      serverTimestamp: Date.now(),
    };

    // 1. Try Firebase RTDB
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `jams/${metadata.id}`);
        await set(roomRef, initialState);

        // Setup onDisconnect for host presence
        const hostPresenceRef = ref(rtdb, `jams/${metadata.id}/participants/${host.id}/isOnline`);
        onDisconnect(hostPresenceRef).set(false);
      } catch (err) {
        console.warn('JamRepository: Firebase RTDB set notice (falling back to server WS):', err);
      }
    }

    // 2. Also register on Server API for dual transport resilience
    try {
      await fetch('/api/jam/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialState),
      });
    } catch (e) {
      // Offline / standalone
    }

    return initialState;
  }

  /**
   * Subscribes to realtime updates of a room
   */
  public subscribeToRoom(
    roomId: string,
    onUpdate: (state: JamRoomState) => void,
    onError?: (err: Error) => void
  ): () => void {
    this.activeRoomId = roomId;

    // 1. If Firebase RTDB is available, listen via onValue
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `jams/${roomId}`);
        this.rtdbUnsub = onValue(
          roomRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val() as JamRoomState;
              onUpdate(val);
            }
          },
          (err) => {
            console.warn('JamRepository RTDB subscription error, switching to WS:', err);
            this.initWebSocket(roomId, onUpdate);
          }
        );
      } catch (e) {
        this.initWebSocket(roomId, onUpdate);
      }
    } else {
      // 2. Fallback to WebSocket
      this.initWebSocket(roomId, onUpdate);
    }

    return () => {
      if (this.rtdbUnsub) {
        this.rtdbUnsub();
        this.rtdbUnsub = null;
      }
      this.closeWebSocket();
      this.activeRoomId = null;
    };
  }

  /**
   * Updates playback state
   */
  public async updatePlayback(roomId: string, playback: Partial<JamPlaybackState>, sequenceNumber: number) {
    if (rtdb) {
      try {
        const playbackRef = ref(rtdb, `jams/${roomId}/playback`);
        await update(playbackRef, {
          ...playback,
          updatedAt: rtdbServerTimestamp(),
        });
        await update(ref(rtdb, `jams/${roomId}`), { sequenceNumber });
      } catch (e) {}
    }

    this.sendWsMessage('PLAYBACK_UPDATE', { roomId, playback, sequenceNumber });
  }

  /**
   * Adds an item to the collaborative queue
   */
  public async addQueueItem(roomId: string, item: JamQueueItem, newQueue: JamQueueItem[]) {
    if (rtdb) {
      try {
        await set(ref(rtdb, `jams/${roomId}/queue`), newQueue);
      } catch (e) {}
    }
    this.sendWsMessage('QUEUE_ADD', { roomId, item, queue: newQueue });
  }

  /**
   * Reorders queue
   */
  public async setQueue(roomId: string, newQueue: JamQueueItem[]) {
    if (rtdb) {
      try {
        await set(ref(rtdb, `jams/${roomId}/queue`), newQueue);
      } catch (e) {}
    }
    this.sendWsMessage('QUEUE_SET', { roomId, queue: newQueue });
  }

  /**
   * Adds a reaction emoji
   */
  public async sendReaction(roomId: string, reaction: JamReaction) {
    if (rtdb) {
      try {
        const reactionsRef = ref(rtdb, `jams/${roomId}/reactions`);
        await update(reactionsRef, { [reaction.id]: reaction });
      } catch (e) {}
    }
    this.sendWsMessage('REACTION', { roomId, reaction });
  }

  /**
   * Appends an activity event
   */
  public async logActivity(roomId: string, event: JamActivityEvent) {
    if (rtdb) {
      try {
        const actRef = ref(rtdb, `jams/${roomId}/activity/${event.id}`);
        await set(actRef, event);
      } catch (e) {}
    }
    this.sendWsMessage('ACTIVITY', { roomId, event });
  }

  /**
   * Updates room settings
   */
  public async updateSettings(roomId: string, settings: JamSettings) {
    if (rtdb) {
      try {
        await update(ref(rtdb, `jams/${roomId}/settings`), settings);
      } catch (e) {}
    }
    this.sendWsMessage('SETTINGS_UPDATE', { roomId, settings });
  }

  /**
   * Cast a vote to skip the current track
   */
  public async voteSkip(roomId: string, userId: string, votes: string[]) {
    if (rtdb) {
      try {
        await set(ref(rtdb, `jams/${roomId}/skipVotes`), votes);
      } catch (e) {}
    }
    this.sendWsMessage('VOTE_SKIP', { roomId, userId, votes });
  }

  /**
   * Submits a guest song request
   */
  public async requestSong(roomId: string, request: JamSongRequest) {
    if (rtdb) {
      try {
        await set(ref(rtdb, `jams/${roomId}/songRequests/${request.id}`), request);
      } catch (e) {}
    }
    this.sendWsMessage('SONG_REQUEST', { roomId, request });
  }

  /**
   * Heartbeat for participant presence
   */
  public async sendHeartbeat(roomId: string, participant: JamParticipant) {
    if (rtdb) {
      try {
        await update(ref(rtdb, `jams/${roomId}/participants/${participant.id}`), {
          lastSeen: Date.now(),
          isOnline: true,
          displayName: participant.displayName,
          avatar: participant.avatar,
        });
      } catch (e) {}
    }
    this.sendWsMessage('HEARTBEAT', { roomId, participant });
  }

  /**
   * Transfers room ownership to another participant
   */
  public async transferHost(roomId: string, newHostId: string) {
    if (rtdb) {
      try {
        await update(ref(rtdb, `jams/${roomId}/metadata`), { hostId: newHostId });
        await update(ref(rtdb, `jams/${roomId}/participants/${newHostId}`), { role: 'host' });
      } catch (e) {}
    }
    this.sendWsMessage('TRANSFER_HOST', { roomId, newHostId });
  }

  /**
   * Ends room
   */
  public async endRoom(roomId: string) {
    if (rtdb) {
      try {
        await update(ref(rtdb, `jams/${roomId}/metadata`), { active: false });
      } catch (e) {}
    }
    this.sendWsMessage('END_ROOM', { roomId });
  }

  /**
   * Persists completed session to Firestore `jamHistory`
   */
  public async saveSessionSummary(summary: JamSessionSummary) {
    if (!db) return;
    try {
      const historyRef = doc(collection(db, 'jamHistory'), summary.roomId);
      await setDoc(historyRef, summary);
    } catch (e) {
      console.warn('JamRepository: Firestore summary save skipped:', e);
    }
  }

  // --- WebSocket Fallback Subsystem ---
  private initWebSocket(roomId: string, onUpdate: (state: JamRoomState) => void) {
    if (typeof window === 'undefined') return;
    this.closeWebSocket();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/jam`;

    try {
      this.activeWs = new WebSocket(wsUrl);

      this.activeWs.onopen = () => {
        this.activeWs?.send(JSON.stringify({ type: 'jam:room_subscribe', data: { roomId } }));
      };

      this.activeWs.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'jam:room_state' && msg.data?.state) {
            onUpdate(msg.data.state);
          }
        } catch (err) {}
      };
    } catch (e) {}
  }

  private sendWsMessage(type: string, data: any) {
    if (this.activeWs && this.activeWs.readyState === WebSocket.OPEN) {
      this.activeWs.send(JSON.stringify({ type: `jam:${type.toLowerCase()}`, data }));
    } else {
      // Also post action to REST endpoint
      fetch('/api/jam/room-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      }).catch(() => {});
    }
  }

  private closeWebSocket() {
    if (this.activeWs) {
      try {
        this.activeWs.close();
      } catch (e) {}
      this.activeWs = null;
    }
  }
}

export const jamRepository = new JamRepository();
