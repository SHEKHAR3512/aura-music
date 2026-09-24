import { create } from 'zustand';
import { Song } from '../music/types';

export interface JamMember {
  id: string; // deviceId
  name: string;
  avatar: string;
  role: 'host' | 'member';
  isAudioOutput: boolean;
  joinedAt: number;
}

export interface JamActivity {
  id: string;
  userName: string;
  avatar?: string;
  action: string;
  trackTitle?: string;
  trackArtist?: string;
  trackArtwork?: string;
  type?: 'add' | 'skip' | 'play' | 'pause' | 'join' | 'leave' | 'remove';
  timestamp: number;
}

export interface JamSessionData {
  id: string; // e.g. "JAM-8431"
  name: string;
  hostDeviceId: string;
  playbackDeviceId: string;
  currentTrack: Song | null;
  isPlaying: boolean;
  currentTime: number;
  crossfadeSeconds?: number;
  updatedAt: number;
  queue: Song[];
  members: JamMember[];
  activity: JamActivity[];
}

interface JamStoreState {
  session: JamSessionData | null;
  deviceId: string;
  userName: string;
  avatar: string;
  isAudioOutput: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Actions
  initDevice: () => void;
  setUserName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  createSession: (name?: string, currentTrack?: Song | null, queue?: Song[]) => Promise<string | null>;
  joinSession: (code: string, customName?: string, customAvatar?: string) => Promise<boolean>;
  leaveSession: () => void;
  broadcastPlayTrack: (track: Song, queue?: Song[]) => void;
  broadcastControl: (action: 'play' | 'pause' | 'next' | 'prev' | 'seek', payload?: any) => void;
  broadcastAddToQueue: (track: Song) => void;
  broadcastReorderQueue: (fromIndex: number, toIndex: number) => void;
  broadcastRemoveFromQueue: (index: number) => void;
  broadcastSetCrossfade: (seconds: number) => void;
  setAudioOutput: (targetDeviceId: string) => void;
  toggleLocalAudioOutput: () => void;
}

const STORAGE_DEVICE_KEY = 'aura_jam_device_id';
const STORAGE_USER_NAME = 'aura_jam_user_name';
const BROADCAST_CHANNEL_NAME = 'aura_car_jam_channel';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'device-init';
  let id = localStorage.getItem(STORAGE_DEVICE_KEY);
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    localStorage.setItem(STORAGE_DEVICE_KEY, id);
  }
  return id;
}

function getInitialUserName(): string {
  if (typeof window === 'undefined') return 'Shekhar';
  return localStorage.getItem(STORAGE_USER_NAME) || 'Shekhar';
}

let wsClient: WebSocket | null = null;
let pollTimer: any = null;
let localChannel: BroadcastChannel | null = null;

export const useJamStore = create<JamStoreState>((set, get) => {
  // Setup BroadcastChannel for multi-tab synchronization
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    localChannel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'jam:sync_state' && data?.session) {
        const state = get();
        if (state.session?.id === data.session.id) {
          const myMember = data.session.members.find((m: JamMember) => m.id === state.deviceId);
          set({
            session: data.session,
            isAudioOutput: myMember ? myMember.isAudioOutput : state.isAudioOutput,
          });
        }
      }
    };
  }

  const connectWebSocket = (sessionId: string) => {
    if (typeof window === 'undefined') return;
    if (wsClient) {
      try { wsClient.close(); } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/jam`;

    try {
      wsClient = new WebSocket(wsUrl);

      wsClient.onopen = () => {
        set({ isConnected: true, isConnecting: false, error: null });
        // Send join packet immediately upon connection
        const state = get();
        wsClient?.send(
          JSON.stringify({
            type: 'jam:join',
            data: {
              sessionId,
              deviceId: state.deviceId,
              userName: state.userName,
              avatar: state.avatar,
              isAudioOutput: state.isAudioOutput,
            },
          })
        );
      };

      wsClient.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, data } = msg;

          if (type === 'jam:sync_state' || type === 'jam:created' || type === 'jam:joined' || type === 'jam:member_joined') {
            if (data.session) {
              const state = get();
              const myMember = data.session.members.find((m: JamMember) => m.id === state.deviceId);
              set({
                session: data.session,
                isAudioOutput: myMember ? myMember.isAudioOutput : state.isAudioOutput,
                isConnected: true,
                error: null,
              });

              // Relay to local browser tabs
              localChannel?.postMessage({ type: 'jam:sync_state', data: { session: data.session } });
            }
          } else if (type === 'jam:error') {
            set({ error: data.message });
          }
        } catch (e) {
          console.error('Jam WS message error:', e);
        }
      };

      wsClient.onerror = () => {
        set({ isConnected: false });
        startPollingFallback(sessionId);
      };

      wsClient.onclose = () => {
        set({ isConnected: false });
        startPollingFallback(sessionId);
      };
    } catch (e) {
      startPollingFallback(sessionId);
    }
  };

  const startPollingFallback = (sessionId: string) => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const state = get();
      if (!state.session) {
        clearInterval(pollTimer);
        return;
      }
      try {
        const res = await fetch(`/api/jam/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            const myMember = data.session.members.find((m: JamMember) => m.id === state.deviceId);
            set({
              session: data.session,
              isAudioOutput: myMember ? myMember.isAudioOutput : state.isAudioOutput,
              isConnected: true,
            });
          }
        }
      } catch (err) {
        // network retry
      }
    }, 2000);
  };

  const sendWs = (type: string, data: any) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(JSON.stringify({ type, data }));
    } else {
      // Fallback via REST API action
      const state = get();
      if (state.session) {
        fetch(`/api/jam/${state.session.id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: type.replace('jam:', ''),
            deviceId: state.deviceId,
            payload: data,
          }),
        }).catch(() => {});
      }
    }
  };

  return {
    session: null,
    deviceId: getOrCreateDeviceId(),
    userName: getInitialUserName(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isAudioOutput: true,
    isConnected: false,
    isConnecting: false,
    error: null,

    initDevice: () => {
      const id = getOrCreateDeviceId();
      set({ deviceId: id });
    },

    setUserName: (name: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_USER_NAME, name);
      }
      set({ userName: name });
    },

    setAvatar: (avatar: string) => {
      set({ avatar });
    },

    createSession: async (name = 'Car Roadtrip Jam', currentTrack = null, queue = []) => {
      set({ isConnecting: true, error: null });
      const state = get();
      try {
        const res = await fetch('/api/jam/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            deviceId: state.deviceId,
            userName: state.userName,
            avatar: state.avatar,
            currentTrack,
            queue,
          }),
        });

        if (!res.ok) throw new Error('Failed to create Jam Session');
        const data = await res.json();
        const createdSession: JamSessionData = data.session;

        set({
          session: createdSession,
          isAudioOutput: true, // Host is car output by default
          isConnecting: false,
          isConnected: true,
        });

        connectWebSocket(createdSession.id);
        localChannel?.postMessage({ type: 'jam:sync_state', data: { session: createdSession } });
        return createdSession.id;
      } catch (err: any) {
        set({ isConnecting: false, error: err.message });
        return null;
      }
    },

    joinSession: async (code: string, customName?: string, customAvatar?: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return false;

      set({ isConnecting: true, error: null });
      if (customName) get().setUserName(customName);
      if (customAvatar) get().setAvatar(customAvatar);

      const state = get();
      try {
        const res = await fetch(`/api/jam/${cleanCode}`);
        if (!res.ok) {
          throw new Error('Invalid Jam Code. Verify code and retry.');
        }

        const data = await res.json();
        const session: JamSessionData = data.session;

        // Joined device defaults to remote controller mode (false) so it doesn't double-play car audio
        set({
          session,
          isAudioOutput: false,
          isConnecting: false,
          isConnected: true,
        });

        connectWebSocket(cleanCode);
        return true;
      } catch (err: any) {
        set({ isConnecting: false, error: err.message || 'Session not found' });
        return false;
      }
    },

    leaveSession: () => {
      const state = get();
      if (state.session) {
        sendWs('jam:leave', { sessionId: state.session.id });
      }
      if (wsClient) {
        try { wsClient.close(); } catch (e) {}
        wsClient = null;
      }
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      set({ session: null, isConnected: false, error: null, isAudioOutput: true });
    },

    broadcastPlayTrack: (track: Song, queue?: Song[]) => {
      sendWs('jam:play_track', { track, queue });
    },

    broadcastControl: (action, payload) => {
      sendWs('jam:playback_control', { action, ...payload });
    },

    broadcastAddToQueue: (track: Song) => {
      sendWs('jam:add_queue', { track });
    },

    broadcastReorderQueue: (fromIndex: number, toIndex: number) => {
      sendWs('jam:reorder_queue', { fromIndex, toIndex });
    },

    broadcastRemoveFromQueue: (index: number) => {
      sendWs('jam:remove_queue', { index });
    },

    broadcastSetCrossfade: (seconds: number) => {
      sendWs('jam:set_crossfade', { crossfadeSeconds: seconds });
    },

    setAudioOutput: (targetDeviceId: string) => {
      sendWs('jam:set_audio_output', { targetDeviceId });
    },

    toggleLocalAudioOutput: () => {
      const state = get();
      const nextVal = !state.isAudioOutput;
      set({ isAudioOutput: nextVal });
      if (nextVal && state.session) {
        sendWs('jam:set_audio_output', { targetDeviceId: state.deviceId });
      }
    },
  };
});
