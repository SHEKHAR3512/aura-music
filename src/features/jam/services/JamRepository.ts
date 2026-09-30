import { rtdb, db } from '../../../lib/firebase';
import {
  ref,
  set,
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
 * Features immediate server/local WebSocket communication with optional
 * Firebase Realtime Database dual transport and offline localStorage caching.
 */
class JamRepository {
  private activeWs: WebSocket | null = null;
  private activeRoomId: string | null = null;
  private activeParticipantId: string | null = null;
  private rtdbUnsub: Unsubscribe | null = null;
  private reconnectTimeout: any = null;

  public setParticipantId(participantId: string | null) {
    this.activeParticipantId = participantId;
  }

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

    // 1. Store in localStorage cache for instant client recovery
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`aura_jam_room_${metadata.id}`, JSON.stringify(initialState));
      } catch (e) {}
    }

    // 2. Register on Server REST API (Local Express + WebSocket server)
    try {
      await fetch('/api/jam/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialState),
      });
    } catch (e) {
      console.warn('JamRepository: Local server room registration notice:', e);
    }

    // 3. Optional Firebase RTDB (non-blocking in background)
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `jams/${metadata.id}`);
        set(roomRef, initialState).catch(() => {});

        const hostPresenceRef = ref(rtdb, `jams/${metadata.id}/participants/${host.id}/isOnline`);
        onDisconnect(hostPresenceRef).set(false).catch(() => {});
      } catch (err) {
        console.warn('JamRepository: Firebase RTDB set notice:', err);
      }
    }

    return initialState;
  }

  /**
   * Fetches room state from server API or local cache
   */
  public async getRoom(roomId: string): Promise<JamRoomState | null> {
    const cleanId = roomId.trim().toUpperCase();

    // 1. Try server REST API
    try {
      const res = await fetch(`/api/jam/room/${cleanId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) return data.room as JamRoomState;
      }
    } catch (e) {}

    // 2. Try localStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`aura_jam_room_${cleanId}`);
        if (cached) return JSON.parse(cached) as JamRoomState;
      } catch (e) {}
    }

    return null;
  }

  /**
   * Subscribes to realtime updates of a room
   */
  public subscribeToRoom(
    roomId: string,
    onUpdate: (state: JamRoomState) => void,
    _onError?: (err: Error) => void
  ): () => void {
    const cleanId = roomId.trim().toUpperCase();
    this.activeRoomId = cleanId;

    // 1. Fetch initial state immediately from REST API
    fetch(`/api/jam/room/${cleanId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.room && this.activeRoomId === cleanId) {
          onUpdate(data.room);
        }
      })
      .catch(() => {});

    // 2. Check localStorage cache for instant display
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`aura_jam_room_${cleanId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.metadata?.id?.toUpperCase() === cleanId) {
            onUpdate(parsed);
          }
        }
      } catch (e) {}
    }

    // 3. Connect real-time WebSocket to server
    this.initWebSocket(cleanId, onUpdate);

    // 4. If Firebase RTDB is configured, also subscribe to RTDB
    if (rtdb) {
      try {
        const roomRef = ref(rtdb, `jams/${cleanId}`);
        this.rtdbUnsub = onValue(
          roomRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val() as JamRoomState;
              onUpdate(val);
            }
          },
          (err) => {
            console.warn('JamRepository RTDB subscription error:', err);
          }
        );
      } catch (e) {
        console.warn('JamRepository RTDB attach error:', e);
      }
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
        update(playbackRef, {
          ...playback,
          updatedAt: rtdbServerTimestamp(),
        }).catch(() => {});
        update(ref(rtdb, `jams/${roomId}`), { sequenceNumber }).catch(() => {});
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
        set(ref(rtdb, `jams/${roomId}/queue`), newQueue).catch(() => {});
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
        set(ref(rtdb, `jams/${roomId}/queue`), newQueue).catch(() => {});
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
        update(reactionsRef, { [reaction.id]: reaction }).catch(() => {});
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
        set(actRef, event).catch(() => {});
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
        update(ref(rtdb, `jams/${roomId}/settings`), settings).catch(() => {});
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
        set(ref(rtdb, `jams/${roomId}/skipVotes`), votes).catch(() => {});
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
        set(ref(rtdb, `jams/${roomId}/songRequests/${request.id}`), request).catch(() => {});
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
        update(ref(rtdb, `jams/${roomId}/participants/${participant.id}`), {
          lastSeen: Date.now(),
          isOnline: true,
          displayName: participant.displayName,
          avatar: participant.avatar,
        }).catch(() => {});
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
        update(ref(rtdb, `jams/${roomId}/metadata`), { hostId: newHostId }).catch(() => {});
        update(ref(rtdb, `jams/${roomId}/participants/${newHostId}`), { role: 'host' }).catch(() => {});
      } catch (e) {}
    }
    this.sendWsMessage('TRANSFER_HOST', { roomId, newHostId });
  }

  /**
   * Participant leaves room (marks offline immediately)
   */
  public async leaveRoom(roomId: string, participantId: string) {
    if (rtdb) {
      try {
        update(ref(rtdb, `jams/${roomId}/participants/${participantId}`), {
          isOnline: false,
          lastSeen: Date.now(),
        }).catch(() => {});
      } catch (e) {}
    }
    this.sendWsMessage('LEAVE', { roomId, participantId });
  }

  /**
   * Ends room
   */
  public async endRoom(roomId: string) {
    if (rtdb) {
      try {
        update(ref(rtdb, `jams/${roomId}/metadata`), { active: false }).catch(() => {});
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
      console.warn('JamRepository: Firestore summary save notice:', e);
    }
  }

  // --- WebSocket Subsystem ---
  private initWebSocket(roomId: string, onUpdate: (state: JamRoomState) => void) {
    if (typeof window === 'undefined') return;
    this.closeWebSocket();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/jam`;

    try {
      this.activeWs = new WebSocket(wsUrl);

      this.activeWs.onopen = () => {
        if (this.activeWs?.readyState === WebSocket.OPEN) {
          this.activeWs.send(
            JSON.stringify({
              type: 'jam:room_subscribe',
              data: { roomId, participantId: this.activeParticipantId },
            })
          );
        }
      };

      this.activeWs.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'jam:room_state' && msg.data?.state) {
            const state = msg.data.state as JamRoomState;
            try {
              localStorage.setItem(`aura_jam_room_${roomId}`, JSON.stringify(state));
            } catch (err) {}
            onUpdate(state);
          }
        } catch (err) {}
      };

      this.activeWs.onclose = () => {
        if (this.activeRoomId === roomId) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.activeRoomId === roomId) {
              this.initWebSocket(roomId, onUpdate);
            }
          }, 3000);
        }
      };

      this.activeWs.onerror = () => {
        // Handled via onclose
      };
    } catch (e) {
      console.warn('JamRepository WebSocket init error:', e);
    }
  }

  private sendWsMessage(type: string, data: any) {
    let sent = false;
    if (this.activeWs && this.activeWs.readyState === WebSocket.OPEN) {
      try {
        this.activeWs.send(JSON.stringify({ type: `jam:${type.toLowerCase()}`, data }));
        sent = true;
      } catch (e) {}
    }

    // Always ensure server processes the action even if WebSocket is buffering or reconnecting
    if (!sent) {
      fetch('/api/jam/room-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      }).catch(() => {});
    }
  }

  private closeWebSocket() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.activeWs) {
      try {
        this.activeWs.close();
      } catch (e) {}
      this.activeWs = null;
    }
  }
}

export const jamRepository = new JamRepository();
