import { jamRepository } from './JamRepository';
import { JamRoomState, JamQueueItem, JamParticipant } from '../types/jam.types';
import { Song } from '../../../lib/music/types';
import { JamPlaybackService } from './JamPlaybackService';

export class JamQueueService {
  private static recentAddTimestamps = new Map<string, number>();

  /**
   * Adds a track to the collaborative Jam queue (with duplicate prevention & debounce)
   */
  public static async addToQueue(
    state: JamRoomState,
    actor: { id: string; name: string; avatar: string },
    track: Song
  ) {
    const isHost = state.metadata.hostId === actor.id;
    if (!isHost && !state.settings.allowGuestQueue) {
      throw new Error('Guests cannot add tracks to this Jam.');
    }

    // 1. Debounce rapid double-taps within 1.5 seconds
    const debounceKey = `${state.metadata.id}-${track.id}`;
    const lastAdd = JamQueueService.recentAddTimestamps.get(debounceKey) || 0;
    const now = Date.now();
    if (now - lastAdd < 1500) {
      console.warn(`[JamQueue] Debouncing rapid add for "${track.title}"`);
      return;
    }
    JamQueueService.recentAddTimestamps.set(debounceKey, now);

    // 2. Prevent adding if song is currently playing in the room
    if (state.playback.trackId === track.id) {
      console.warn(`[JamQueue] Track "${track.title}" is currently playing.`);
      return;
    }

    // 3. Prevent duplicate tracks already in the queue
    const isAlreadyInQueue = state.queue.some((q) => q.track.id === track.id);
    if (isAlreadyInQueue) {
      console.warn(`[JamQueue] Track "${track.title}" is already in the queue.`);
      return;
    }

    // 4. If room has no active track playing, start playing it immediately
    if (!state.playback.trackId) {
      await JamPlaybackService.changeTrack(state, actor.id, actor.name, track);
      return;
    }

    const newItem: JamQueueItem = {
      id: `${track.id}-${now}`,
      track,
      addedBy: {
        id: actor.id,
        displayName: actor.name,
        avatar: actor.avatar,
      },
      addedAt: now,
      position: state.queue.length,
    };

    const newQueue = [...state.queue, newItem];
    await jamRepository.addQueueItem(state.metadata.id, newItem, newQueue);

    await jamRepository.logActivity(state.metadata.id, {
      id: `${now}-qadd`,
      type: 'QUEUE_ADD',
      actorId: actor.id,
      actorName: actor.name,
      timestamp: now,
      message: `${actor.name} added "${track.title}" to the queue`,
      payload: { trackTitle: track.title, trackArtist: track.primaryArtist },
    });
  }

  /**
   * Removes a track from the queue
   */
  public static async removeFromQueue(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    itemId: string
  ) {
    const isHost = state.metadata.hostId === actorId;
    const item = state.queue.find((q) => q.id === itemId);

    // Only host or the person who added it can remove it
    if (!isHost && item?.addedBy.id !== actorId) {
      throw new Error('You do not have permission to remove this track.');
    }

    const newQueue = state.queue
      .filter((q) => q.id !== itemId)
      .map((item, idx) => ({ ...item, position: idx }));

    await jamRepository.setQueue(state.metadata.id, newQueue);

    if (item) {
      await jamRepository.logActivity(state.metadata.id, {
        id: `${Date.now()}-qrem`,
        type: 'QUEUE_REMOVE',
        actorId,
        actorName,
        timestamp: Date.now(),
        message: `${actorName} removed "${item.track.title}" from the queue`,
      });
    }
  }

  /**
   * Reorders items in the queue (e.g. from dnd-kit drag-and-drop)
   */
  public static async reorderQueue(
    state: JamRoomState,
    actorId: string,
    actorName: string,
    fromIndex: number,
    toIndex: number
  ) {
    const isHost = state.metadata.hostId === actorId;
    if (!isHost && !state.settings.allowGuestReorder) {
      throw new Error('Guests cannot reorder the queue in this Jam.');
    }

    const result = Array.from(state.queue);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);

    const reindexed = result.map((item, idx) => ({ ...item, position: idx }));
    await jamRepository.setQueue(state.metadata.id, reindexed);

    await jamRepository.logActivity(state.metadata.id, {
      id: `${Date.now()}-qreorder`,
      type: 'QUEUE_REORDER',
      actorId,
      actorName,
      timestamp: Date.now(),
      message: `${actorName} reordered the queue`,
    });
  }

  /**
   * Advances to next track in the queue, or invokes smart continuation
   */
  public static async advanceQueue(state: JamRoomState, actorId: string, actorName: string) {
    if (state.queue.length > 0) {
      const nextItem = state.queue[0];
      const remainingQueue = state.queue.slice(1).map((item, idx) => ({ ...item, position: idx }));

      // 1. Transition playback track first
      await JamPlaybackService.changeTrack(state, actorId, actorName, nextItem.track);
      // 2. Set remaining queue after successful track transition
      await jamRepository.setQueue(state.metadata.id, remainingQueue);
    } else {
      // If queue is empty, reset skip votes
      await jamRepository.voteSkip(state.metadata.id, '', []);
    }
  }

  /**
   * Vote-to-skip processing.
   * If threshold is reached, advances the track automatically!
   */
  public static async handleVoteSkip(
    state: JamRoomState,
    userId: string,
    userName: string
  ): Promise<{ skipped: boolean; currentVotes: number; totalNeeded: number }> {
    const currentVotes = new Set(state.skipVotes || []);
    currentVotes.add(userId);

    const updatedVotes = Array.from(currentVotes);
    const now = Date.now();
    // Count only participants with active heartbeat within last 35 seconds
    const onlineParticipants = Object.values(state.participants).filter(
      (p) => p.isOnline && now - (p.lastSeen || 0) < 35000
    );
    const totalParticipants = Math.max(1, onlineParticipants.length);

    const thresholdPercent = state.settings.voteSkipThresholdPercent || 50;
    const votesNeeded = Math.ceil((totalParticipants * thresholdPercent) / 100);

    await jamRepository.voteSkip(state.metadata.id, userId, updatedVotes);
    await jamRepository.logActivity(state.metadata.id, {
      id: `${now}-voteskip`,
      type: 'VOTE_SKIP',
      actorId: userId,
      actorName: userName,
      timestamp: now,
      message: `${userName} voted to skip (${updatedVotes.length}/${votesNeeded} votes)`,
    });

    if (updatedVotes.length >= votesNeeded) {
      // Advance track!
      await this.advanceQueue(state, 'system', 'Vote to Skip');
      return { skipped: true, currentVotes: updatedVotes.length, totalNeeded: votesNeeded };
    }

    return { skipped: false, currentVotes: updatedVotes.length, totalNeeded: votesNeeded };
  }
}
