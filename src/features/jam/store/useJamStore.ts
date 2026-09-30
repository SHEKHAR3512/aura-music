import { create } from 'zustand';
import {
  JamRoomState,
  JamConnectionState,
  JamMode,
  JamPrivacy,
  JamSettings,
  JamReaction,
  JamActivityEvent,
  JamParticipant,
  RoomDNA,
  JamSessionSummary,
} from '../types/jam.types';
import { JamService } from '../services/JamService';
import { JamPlaybackService } from '../services/JamPlaybackService';
import { JamQueueService } from '../services/JamQueueService';
import { jamPresenceService, JamPresenceService, isParticipantOnline } from '../services/JamPresenceService';
import { jamSyncEngine } from '../sync/JamSyncEngine';
import { clockSyncService } from '../sync/ClockSyncService';
import { jamRepository } from '../services/JamRepository';
import { RoomDNAEngine } from '../recommendations/RoomDNAEngine';
import { Song } from '../../../lib/music/types';
import { audioEngine } from '../../../lib/audio/AudioEngine';
import { DEFAULT_AVATARS } from '../utils/jamUtils';

interface JamStoreState {
  // Active Room State
  room: JamRoomState | null;
  connectionState: JamConnectionState;
  roomDNA: RoomDNA | null;
  summary: JamSessionSummary | null;

  // Diagnostic / Connection Telemetry
  latencyRtt: number;
  clockOffset: number;
  driftMs: number;
  isSynced: boolean;

  // Local User Identity in Jam
  userId: string;
  userName: string;
  userAvatar: string;
  isAnonymous: boolean;

  // UI Modals State
  isCreateModalOpen: boolean;
  isJoinModalOpen: boolean;
  isInviteModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isSummaryModalOpen: boolean;
  isRequestsModalOpen: boolean;
  isDebugPanelOpen: boolean;

  // Actions
  initUser: (user: { id?: string; name?: string; avatar?: string; isAnonymous?: boolean }) => void;
  setUserName: (name: string) => void;
  setUserAvatar: (avatar: string) => void;

  createJam: (params: {
    roomName: string;
    mode: JamMode;
    privacy: JamPrivacy;
    initialTrack: Song | null;
    initialQueue: Song[];
    settings?: Partial<JamSettings>;
  }) => Promise<string>;

  joinJam: (roomId: string, customName?: string, customAvatar?: string) => Promise<boolean>;
  leaveJam: () => Promise<void>;
  endJam: () => Promise<JamSessionSummary | null>;

  // Playback & Queue Controls
  isAudioOutput: boolean;
  toggleAudioOutput: () => void;
  setAudioOutput: (enabled: boolean) => void;
  playTrack: (track: Song) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  addToQueue: (track: Song) => Promise<void>;
  removeFromQueue: (itemId: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;

  // Social & Permissions
  sendReaction: (emoji: string) => Promise<void>;
  voteToSkip: () => Promise<void>;
  transferHost: (newHostId: string) => Promise<void>;
  updateSettings: (settings: Partial<JamSettings>) => Promise<void>;
  setRoomMode: (mode: JamMode) => Promise<void>;

  // Modal Toggles
  setIsCreateModalOpen: (open: boolean) => void;
  setIsJoinModalOpen: (open: boolean) => void;
  setIsInviteModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsSummaryModalOpen: (open: boolean) => void;
  setIsRequestsModalOpen: (open: boolean) => void;
  setIsDebugPanelOpen: (open: boolean) => void;
  toggleDebugPanel: () => void;
}

const STORAGE_DEVICE_KEY = 'aura_jam_user_id';
const STORAGE_NAME_KEY = 'aura_jam_name';
const STORAGE_AVATAR_KEY = 'aura_jam_avatar';

function getInitialUserId(): string {
  if (typeof window === 'undefined') return 'guest-init';
  let id = localStorage.getItem(STORAGE_DEVICE_KEY);
  if (!id) {
    id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem(STORAGE_DEVICE_KEY, id);
  }
  return id;
}

let roomUnsubscribe: (() => void) | null = null;
let syncUnsubscribe: (() => void) | null = null;

export const useJamStore = create<JamStoreState>((set, get) => {
  return {
    room: null,
    connectionState: 'disconnected',
    roomDNA: null,
    summary: null,

    latencyRtt: 0,
    clockOffset: 0,
    driftMs: 0,
    isSynced: false,
    isAudioOutput: true,

    userId: getInitialUserId(),
    userName: (typeof window !== 'undefined' && localStorage.getItem(STORAGE_NAME_KEY)) || 'Aura Listener',
    userAvatar:
      (typeof window !== 'undefined' && localStorage.getItem(STORAGE_AVATAR_KEY)) || DEFAULT_AVATARS[0],
    isAnonymous: true,

    isCreateModalOpen: false,
    isJoinModalOpen: false,
    isInviteModalOpen: false,
    isSettingsModalOpen: false,
    isSummaryModalOpen: false,
    isRequestsModalOpen: false,
    isDebugPanelOpen: false,

    initUser: (user) => {
      const id = user.id || get().userId;
      const name = user.name || get().userName;
      const avatar = user.avatar || get().userAvatar;
      const isAnon = user.isAnonymous !== undefined ? user.isAnonymous : get().isAnonymous;

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_DEVICE_KEY, id);
        localStorage.setItem(STORAGE_NAME_KEY, name);
        localStorage.setItem(STORAGE_AVATAR_KEY, avatar);
      }

      set({
        userId: id,
        userName: name,
        userAvatar: avatar,
        isAnonymous: isAnon,
      });
    },

    setUserName: (name: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_NAME_KEY, name);
      }
      set({ userName: name });
    },

    setUserAvatar: (avatar: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_AVATAR_KEY, avatar);
      }
      set({ userAvatar: avatar });
    },

    createJam: async (params) => {
      set({ connectionState: 'connecting' });
      const state = get();

      const newRoom = await JamService.createRoom({
        roomName: params.roomName,
        mode: params.mode,
        privacy: params.privacy,
        host: {
          id: state.userId,
          name: state.userName,
          avatar: state.userAvatar,
          isAnonymous: state.isAnonymous,
        },
        initialTrack: params.initialTrack,
        initialQueue: params.initialQueue,
        settings: params.settings,
      });

      // Calculate initial DNA
      const dna = RoomDNAEngine.calculate(
        params.initialTrack ? [params.initialTrack, ...params.initialQueue] : params.initialQueue,
        1,
        params.mode
      );

      set({
        room: newRoom,
        roomDNA: dna,
        connectionState: 'connected',
        isCreateModalOpen: false,
        isAudioOutput: true,
      });

      // Attach sync engine & presence
      jamSyncEngine.setAudioOutputEnabled(true);
      jamSyncEngine.attachRoom(newRoom.metadata.id);
      jamPresenceService.startHeartbeat(newRoom.metadata.id, {
        id: state.userId,
        displayName: state.userName,
        avatar: state.userAvatar,
        role: 'host',
        isOnline: true,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        isAnonymous: state.isAnonymous,
      });

      // Listen for updates
      get().joinJam(newRoom.metadata.id);

      return newRoom.metadata.id;
    },

    joinJam: async (roomId: string, customName?: string, customAvatar?: string) => {
      const cleanId = roomId.trim().toUpperCase();
      if (!cleanId) return false;

      set({ connectionState: 'connecting' });
      if (customName) get().setUserName(customName);
      if (customAvatar) get().setUserAvatar(customAvatar);

      const state = get();

      try {
        // Pre-fetch room state immediately if available
        const preloaded = await jamRepository.getRoom(cleanId);
        if (preloaded) {
          const allSongs: Song[] = [];
          if (preloaded.playback.track) allSongs.push(preloaded.playback.track);
          preloaded.queue.forEach((q) => allSongs.push(q.track));

          const activeOnlineCount = Math.max(
            1,
            Object.values(preloaded.participants || {}).filter(isParticipantOnline).length
          );

          const computedDNA = RoomDNAEngine.calculate(
            allSongs,
            activeOnlineCount,
            preloaded.metadata.mode
          );

          set({
            room: preloaded,
            roomDNA: computedDNA,
            connectionState: 'connected',
            isJoinModalOpen: false,
          });
        }

        await JamService.joinRoom(cleanId, {
          id: state.userId,
          name: state.userName,
          avatar: state.userAvatar,
          isAnonymous: state.isAnonymous,
        });

        // Cleanup any previous subscription
        if (roomUnsubscribe) roomUnsubscribe();
        if (syncUnsubscribe) syncUnsubscribe();

        // Subscribe to sync telemetry
        syncUnsubscribe = jamSyncEngine.subscribeState((syncInfo) => {
          set({
            latencyRtt: clockSyncService.getRtt(),
            clockOffset: clockSyncService.getOffset(),
            driftMs: syncInfo.driftMs,
            isSynced: syncInfo.isSynced,
            connectionState: syncInfo.isSynced ? 'synced' : 'syncing',
          });
        });

        // Subscribe to Room State in RTDB / WebSocket
        roomUnsubscribe = jamRepository.subscribeToRoom(cleanId, async (updatedRoom) => {
          if (!updatedRoom) return;

          // Check if host dropped and elect successor if needed
          JamPresenceService.checkAndElectNewHost(updatedRoom, get().userId);

          // Update sync engine with authoritative playback state
          await jamSyncEngine.handleServerPlaybackUpdate(updatedRoom.playback, async (trackId) => {
            try {
              const res = await fetch(`/api/music/song/${trackId}`);
              return res.ok ? await res.json() : null;
            } catch (e) {
              return null;
            }
          });

          // Calculate Room DNA
          const allSongs: Song[] = [];
          if (updatedRoom.playback.track) allSongs.push(updatedRoom.playback.track);
          updatedRoom.queue.forEach((q) => allSongs.push(q.track));

          const activeOnlineCount = Math.max(
            1,
            Object.values(updatedRoom.participants || {}).filter(isParticipantOnline).length
          );

          const computedDNA = RoomDNAEngine.calculate(
            allSongs,
            activeOnlineCount,
            updatedRoom.metadata.mode
          );

          set({
            room: updatedRoom,
            roomDNA: computedDNA,
            connectionState: 'connected',
          });
        });

        const activeRoom = get().room || preloaded;
        const isHost = activeRoom ? activeRoom.metadata.hostId === state.userId : false;
        // Host device outputs audio; joining devices default to Remote Controller mode (false) to avoid double-play echo!
        const isAudioOutput = isHost;

        jamSyncEngine.setAudioOutputEnabled(isAudioOutput);
        jamSyncEngine.attachRoom(cleanId);
        jamPresenceService.startHeartbeat(cleanId, {
          id: state.userId,
          displayName: state.userName,
          avatar: state.userAvatar,
          role: isHost ? 'host' : 'guest',
          isOnline: true,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
          isAnonymous: state.isAnonymous,
        });

        set({ connectionState: 'connected', isJoinModalOpen: false, isAudioOutput });
        return true;
      } catch (err: any) {
        set({ connectionState: 'disconnected' });
        return false;
      }
    },

    leaveJam: async () => {
      const state = get();
      if (state.room) {
        await JamService.leaveRoom(state.room.metadata.id, state.userId, state.userName);
      }

      if (roomUnsubscribe) {
        roomUnsubscribe();
        roomUnsubscribe = null;
      }
      if (syncUnsubscribe) {
        syncUnsubscribe();
        syncUnsubscribe = null;
      }

      jamSyncEngine.setAudioOutputEnabled(true);
      jamSyncEngine.detachRoom();
      jamPresenceService.stopHeartbeat();

      set({
        room: null,
        roomDNA: null,
        connectionState: 'disconnected',
        isSynced: false,
        isAudioOutput: true,
      });
    },

    endJam: async () => {
      const state = get();
      if (!state.room) return null;

      const summary = await JamService.endRoom(state.room);
      get().leaveJam();
      set({ summary, isSummaryModalOpen: true });
      return summary;
    },

    toggleAudioOutput: () => {
      const next = !get().isAudioOutput;
      get().setAudioOutput(next);
    },

    setAudioOutput: (enabled: boolean) => {
      set({ isAudioOutput: enabled });
      jamSyncEngine.setAudioOutputEnabled(enabled);
    },

    playTrack: async (track: Song) => {
      const { room, userId, userName, userAvatar } = get();
      if (!room) return;
      const isHost = room.metadata.hostId === userId;
      const canDirectPlay = isHost || room.settings.allowGuestSkip || !room.playback.trackId;

      if (canDirectPlay) {
        await JamPlaybackService.changeTrack(room, userId, userName, track);
      } else {
        await JamQueueService.addToQueue(room, { id: userId, name: userName, avatar: userAvatar }, track);
      }
    },

    play: async () => {
      const { room, userId, userName } = get();
      if (!room) return;
      const currentAudioTime = audioEngine.getCurrentTime();
      await JamPlaybackService.play(room, userId, userName, currentAudioTime);
    },

    pause: async () => {
      const { room, userId, userName } = get();
      if (!room) return;
      const currentAudioTime = audioEngine.getCurrentTime();
      await JamPlaybackService.pause(room, userId, userName, currentAudioTime);
    },

    seek: async (seconds: number) => {
      const { room, userId, userName } = get();
      if (!room) return;
      await JamPlaybackService.seek(room, userId, userName, seconds);
    },

    next: async () => {
      const { room, userId, userName } = get();
      if (!room) return;
      await JamQueueService.advanceQueue(room, userId, userName);
    },

    previous: async () => {
      // Seek to beginning if in progress
      audioEngine.seek(0);
      get().seek(0);
    },

    addToQueue: async (track: Song) => {
      const { room, userId, userName, userAvatar } = get();
      if (!room) return;
      await JamQueueService.addToQueue(room, { id: userId, name: userName, avatar: userAvatar }, track);
    },

    removeFromQueue: async (itemId: string) => {
      const { room, userId, userName } = get();
      if (!room) return;
      await JamQueueService.removeFromQueue(room, userId, userName, itemId);
    },

    reorderQueue: async (fromIndex: number, toIndex: number) => {
      const { room, userId, userName } = get();
      if (!room) return;
      await JamQueueService.reorderQueue(room, userId, userName, fromIndex, toIndex);
    },

    sendReaction: async (emoji: string) => {
      const { room, userId, userName, userAvatar } = get();
      if (!room) return;

      const reaction: JamReaction = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        userName,
        userAvatar,
        emoji,
        timestamp: Date.now(),
        trackId: room.playback.trackId || undefined,
      };

      await jamRepository.sendReaction(room.metadata.id, reaction);
    },

    voteToSkip: async () => {
      const { room, userId, userName } = get();
      if (!room) return;
      await JamQueueService.handleVoteSkip(room, userId, userName);
    },

    transferHost: async (newHostId: string) => {
      const { room } = get();
      if (!room) return;
      await jamRepository.transferHost(room.metadata.id, newHostId);
    },

    updateSettings: async (settingsUpdate: Partial<JamSettings>) => {
      const { room } = get();
      if (!room) return;
      const updated = { ...room.settings, ...settingsUpdate };
      await jamRepository.updateSettings(room.metadata.id, updated);
    },

    setRoomMode: async (mode: JamMode) => {
      const { room, userId, userName } = get();
      if (!room) return;
      await jamRepository.logActivity(room.metadata.id, {
        id: `${Date.now()}-mode`,
        type: 'ROOM_MODE_CHANGE',
        actorId: userId,
        actorName: userName,
        timestamp: Date.now(),
        message: `${userName} changed room mode to ${mode.toUpperCase()}`,
      });
    },

    setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
    setIsJoinModalOpen: (open) => set({ isJoinModalOpen: open }),
    setIsInviteModalOpen: (open) => set({ isInviteModalOpen: open }),
    setIsSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
    setIsSummaryModalOpen: (open) => set({ isSummaryModalOpen: open }),
    setIsRequestsModalOpen: (open) => set({ isRequestsModalOpen: open }),
    setIsDebugPanelOpen: (open) => set({ isDebugPanelOpen: open }),
    toggleDebugPanel: () => set((s) => ({ isDebugPanelOpen: !s.isDebugPanelOpen })),
  };
});
