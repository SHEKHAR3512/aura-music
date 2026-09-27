import { useEffect } from 'react';
import { useJamStore } from '../../features/jam/store/useJamStore';
import { usePlayerStore } from '../../stores/playerStore';

/**
 * useJamPlayerSync
 * Bridges active Jam listening room state into the global Aura UI
 * so MiniPlayer, ExpandedPlayer, and global navigation stay synchronized.
 */
export function useJamPlayerSync() {
  const { room } = useJamStore();

  useEffect(() => {
    if (!room) return;

    const playback = room.playback;
    const playerStore = usePlayerStore.getState();

    // Sync active track into playerStore for global UI consistency
    if (playback.track && playback.track.id !== playerStore.currentTrack?.id) {
      usePlayerStore.setState({
        currentTrack: playback.track,
        isPlaying: playback.isPlaying,
        queue: room.queue.map((q) => q.track),
      });
    } else if (playback.isPlaying !== playerStore.isPlaying) {
      usePlayerStore.setState({
        isPlaying: playback.isPlaying,
      });
    }
  }, [room?.playback.track?.id, room?.playback.isPlaying, room?.queue]);
}
