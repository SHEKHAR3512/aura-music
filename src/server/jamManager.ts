import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server } from 'http';
import { Song } from '../lib/music/types';

export interface JamMember {
  id: string; // deviceId
  name: string;
  avatar: string;
  role: 'host' | 'member';
  isAudioOutput: boolean;
  joinedAt: number;
  lastPing: number;
}

export interface JamActivity {
  id: string;
  userName: string;
  avatar?: string;
  action: string;
  trackTitle?: string;
  trackArtist?: string;
  trackArtwork?: string;
  type: 'add' | 'skip' | 'play' | 'pause' | 'join' | 'leave' | 'remove';
  timestamp: number;
}

export interface JamSession {
  id: string; // 6-character room code (e.g. "CAR-77" or "JAM-4209")
  name: string;
  hostDeviceId: string;
  playbackDeviceId: string;
  currentTrack: Song | null;
  isPlaying: boolean;
  currentTime: number;
  crossfadeSeconds: number;
  updatedAt: number;
  queue: Song[];
  members: Map<string, JamMember>;
  activity: JamActivity[];
}

export interface ClientSocket extends WebSocket {
  deviceId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

class JamSessionManager {
  private sessions = new Map<string, JamSession>();
  private sockets = new Map<string, Set<ClientSocket>>(); // sessionId -> Set of sockets
  private wss: WebSocketServer | null = null;

  public init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/jam' });

    this.wss.on('connection', (ws: ClientSocket, req: IncomingMessage) => {
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          this.handleClientMessage(ws, payload);
        } catch (err) {
          console.error('Jam WS message parse error:', err);
        }
      });

      ws.on('close', () => {
        this.handleSocketDisconnect(ws);
      });
    });

    // Heartbeat cleanup every 30s
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const c = client as ClientSocket;
        if (c.isAlive === false) return c.terminate();
        c.isAlive = false;
        c.ping();
      });
    }, 30000);
  }

  private handleClientMessage(ws: ClientSocket, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'jam:create': {
        const session = this.createSession(
          data.name || 'Car Roadtrip Jam',
          data.deviceId,
          data.userName || 'Shekhar',
          data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          data.currentTrack || null,
          data.queue || []
        );

        ws.deviceId = data.deviceId;
        ws.sessionId = session.id;
        this.addSocketToSession(session.id, ws);

        this.sendToSocket(ws, 'jam:created', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:join': {
        const session = this.sessions.get(data.sessionId?.toUpperCase());
        if (!session) {
          this.sendToSocket(ws, 'jam:error', { message: 'Jam Session not found or expired' });
          return;
        }

        ws.deviceId = data.deviceId;
        ws.sessionId = session.id;
        this.addSocketToSession(session.id, ws);

        const member: JamMember = {
          id: data.deviceId,
          name: data.userName || 'Co-pilot',
          avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.deviceId}`,
          role: 'member',
          isAudioOutput: !!data.isAudioOutput,
          joinedAt: Date.now(),
          lastPing: Date.now(),
        };

        session.members.set(member.id, member);
        this.logActivity(session, member.name, 'joined the Jam Session');

        this.sendToSocket(ws, 'jam:joined', {
          session: this.serializeSession(session),
        });

        this.broadcastToSession(session.id, 'jam:member_joined', {
          member,
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:leave': {
        if (ws.sessionId && ws.deviceId) {
          this.leaveSession(ws.sessionId, ws.deviceId);
        }
        break;
      }

      case 'jam:play_track': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;

        session.currentTrack = data.track;
        session.isPlaying = true;
        session.currentTime = 0;
        session.updatedAt = Date.now();
        if (data.queue) {
          session.queue = data.queue;
        }

        const member = session.members.get(ws.deviceId || '');
        const userName = member?.name || 'Someone';
        const userAvatar = member?.avatar;
        this.logActivity(
          session,
          userName,
          'started playing',
          data.track?.title,
          'play',
          userAvatar,
          data.track?.primaryArtist,
          data.track?.artwork?.low || data.track?.artwork?.medium
        );

        this.broadcastToSession(session.id, 'jam:sync_state', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:playback_control': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;

        const member = session.members.get(ws.deviceId || '');
        const userName = member?.name || 'Someone';
        const userAvatar = member?.avatar;

        if (data.action === 'play') {
          session.isPlaying = true;
          this.logActivity(session, userName, 'resumed car playback', undefined, 'play', userAvatar);
        } else if (data.action === 'pause') {
          session.isPlaying = false;
          this.logActivity(session, userName, 'paused car playback', undefined, 'pause', userAvatar);
        } else if (data.action === 'seek') {
          session.currentTime = data.currentTime || 0;
        } else if (data.action === 'next') {
          if (session.queue.length > 0) {
            const nextTrack = session.queue[0];
            session.queue = session.queue.slice(1);
            session.currentTrack = nextTrack;
            session.currentTime = 0;
            session.isPlaying = true;
            this.logActivity(
              session,
              userName,
              'skipped to next track',
              nextTrack.title,
              'skip',
              userAvatar,
              nextTrack.primaryArtist,
              nextTrack.artwork?.low || nextTrack.artwork?.medium
            );
          }
        }

        session.updatedAt = Date.now();

        this.broadcastToSession(session.id, 'jam:sync_state', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:add_queue': {
        const session = this.getSession(ws.sessionId);
        if (!session || !data.track) return;

        session.queue.push(data.track);
        const member = session.members.get(ws.deviceId || '');
        const userName = member?.name || 'Someone';
        const userAvatar = member?.avatar;

        this.logActivity(
          session,
          userName,
          'added to car queue',
          data.track.title,
          'add',
          userAvatar,
          data.track.primaryArtist,
          data.track.artwork?.low || data.track.artwork?.medium
        );

        this.broadcastToSession(session.id, 'jam:sync_state', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:reorder_queue': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;
        const { fromIndex, toIndex } = data;
        if (fromIndex >= 0 && toIndex >= 0 && fromIndex < session.queue.length && toIndex < session.queue.length) {
          const [moved] = session.queue.splice(fromIndex, 1);
          session.queue.splice(toIndex, 0, moved);

          const member = session.members.get(ws.deviceId || '');
          const userName = member?.name || 'Someone';
          this.logActivity(session, userName, 'reordered the car queue', moved?.title, 'play', member?.avatar);

          this.broadcastToSession(session.id, 'jam:sync_state', {
            session: this.serializeSession(session),
          });
        }
        break;
      }

      case 'jam:remove_queue': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;
        const { index } = data;
        if (index >= 0 && index < session.queue.length) {
          const [removed] = session.queue.splice(index, 1);
          const member = session.members.get(ws.deviceId || '');
          const userName = member?.name || 'Someone';
          this.logActivity(
            session,
            userName,
            'removed from car queue',
            removed?.title,
            'remove',
            member?.avatar,
            removed?.primaryArtist
          );

          this.broadcastToSession(session.id, 'jam:sync_state', {
            session: this.serializeSession(session),
          });
        }
        break;
      }

      case 'jam:set_audio_output': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;
        session.playbackDeviceId = data.targetDeviceId;
        session.members.forEach((m) => {
          m.isAudioOutput = m.id === data.targetDeviceId;
        });

        const targetName = session.members.get(data.targetDeviceId)?.name || 'device';
        this.logActivity(session, targetName, 'designated as Car Speaker output');

        this.broadcastToSession(session.id, 'jam:sync_state', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:set_crossfade': {
        const session = this.getSession(ws.sessionId);
        if (!session) return;
        const seconds = Math.max(0, Math.min(12, Number(data.crossfadeSeconds) || 0));
        session.crossfadeSeconds = seconds;
        session.updatedAt = Date.now();
        const member = session.members.get(ws.deviceId || '');
        const userName = member?.name || 'Someone';
        this.logActivity(
          session,
          userName,
          `set transition crossfade to ${seconds}s`,
          undefined,
          'play',
          member?.avatar
        );
        this.broadcastToSession(session.id, 'jam:sync_state', {
          session: this.serializeSession(session),
        });
        break;
      }

      case 'jam:ping': {
        if (ws.sessionId && ws.deviceId) {
          const session = this.sessions.get(ws.sessionId);
          const member = session?.members.get(ws.deviceId);
          if (member) member.lastPing = Date.now();
        }
        break;
      }
    }
  }

  public createSession(
    name: string,
    hostDeviceId: string,
    hostName: string,
    avatar: string,
    initialTrack: Song | null = null,
    initialQueue: Song[] = []
  ): JamSession {
    const code = this.generateSessionCode();
    const hostMember: JamMember = {
      id: hostDeviceId,
      name: hostName,
      avatar,
      role: 'host',
      isAudioOutput: true, // Host defaults as the Car Speaker
      joinedAt: Date.now(),
      lastPing: Date.now(),
    };

    const session: JamSession = {
      id: code,
      name,
      hostDeviceId,
      playbackDeviceId: hostDeviceId,
      currentTrack: initialTrack,
      isPlaying: !!initialTrack,
      currentTime: 0,
      crossfadeSeconds: 3,
      updatedAt: Date.now(),
      queue: initialQueue,
      members: new Map([[hostDeviceId, hostMember]]),
      activity: [
        {
          id: `${Date.now()}-init`,
          userName: hostName,
          avatar,
          action: 'started the Car Jam Session',
          type: 'join',
          timestamp: Date.now(),
        },
      ],
    };

    this.sessions.set(code, session);
    return session;
  }

  public getSession(id?: string): JamSession | undefined {
    if (!id) return undefined;
    return this.sessions.get(id.toUpperCase());
  }

  public leaveSession(sessionId: string, deviceId: string) {
    const session = this.sessions.get(sessionId.toUpperCase());
    if (!session) return;

    const member = session.members.get(deviceId);
    session.members.delete(deviceId);

    if (member) {
      this.logActivity(session, member.name, 'left the Jam Session');
    }

    if (session.members.size === 0) {
      this.sessions.delete(session.id);
    } else {
      // If host left, designate next oldest member as host
      if (session.hostDeviceId === deviceId) {
        const nextHost = Array.from(session.members.values())[0];
        if (nextHost) {
          nextHost.role = 'host';
          session.hostDeviceId = nextHost.id;
          if (session.playbackDeviceId === deviceId) {
            session.playbackDeviceId = nextHost.id;
            nextHost.isAudioOutput = true;
          }
        }
      }

      this.broadcastToSession(session.id, 'jam:member_left', {
        deviceId,
        session: this.serializeSession(session),
      });
    }
  }

  private handleSocketDisconnect(ws: ClientSocket) {
    if (ws.sessionId && ws.deviceId) {
      const socketSet = this.sockets.get(ws.sessionId);
      if (socketSet) {
        socketSet.delete(ws);
        if (socketSet.size === 0) {
          this.sockets.delete(ws.sessionId);
        }
      }
      this.leaveSession(ws.sessionId, ws.deviceId);
    }
  }

  private addSocketToSession(sessionId: string, ws: ClientSocket) {
    if (!this.sockets.has(sessionId)) {
      this.sockets.set(sessionId, new Set());
    }
    this.sockets.get(sessionId)!.add(ws);
  }

  public broadcastToSession(sessionId: string, type: string, payload: any) {
    const socketSet = this.sockets.get(sessionId);
    if (!socketSet) return;
    const msg = JSON.stringify({ type, data: payload });
    socketSet.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  private sendToSocket(ws: WebSocket, type: string, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data: payload }));
    }
  }

  public logActivity(
    session: JamSession,
    userName: string,
    action: string,
    trackTitle?: string,
    type: 'add' | 'skip' | 'play' | 'pause' | 'join' | 'leave' | 'remove' = 'play',
    avatar?: string,
    trackArtist?: string,
    trackArtwork?: string
  ) {
    const act: JamActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userName,
      avatar,
      action,
      trackTitle,
      trackArtist,
      trackArtwork,
      type,
      timestamp: Date.now(),
    };
    session.activity.unshift(act);
    if (session.activity.length > 50) {
      session.activity = session.activity.slice(0, 50);
    }
  }

  public serializeSession(session: JamSession) {
    return {
      id: session.id,
      name: session.name,
      hostDeviceId: session.hostDeviceId,
      playbackDeviceId: session.playbackDeviceId,
      currentTrack: session.currentTrack,
      isPlaying: session.isPlaying,
      currentTime: session.currentTime,
      crossfadeSeconds: session.crossfadeSeconds ?? 3,
      updatedAt: session.updatedAt,
      queue: session.queue,
      members: Array.from(session.members.values()),
      activity: session.activity,
    };
  }

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalCode = `JAM-${code}`;
    return this.sessions.has(finalCode) ? this.generateSessionCode() : finalCode;
  }
}

export const jamManager = new JamSessionManager();
