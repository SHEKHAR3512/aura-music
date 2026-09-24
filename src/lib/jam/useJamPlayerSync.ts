import { useEffect, useRef } from 'react';
import { useJamStore, JamSessionData } from './jamStore';
import { usePlayerStore } from '../../stores/playerStore';
import { audioEngine } from '../audio/AudioEngine';

export function useJamPlayerSync() {
  const { session, isAudioOutput, broadcastControl, broadcastPlayTrack } = useJamStore();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    queue,
  } = usePlayerStore();

  const isRemoteSyncing = useRef(false);
  const lastSessionTrackId = useRef<string | null>(null);
  const lastSessionIsPlaying = useRef<boolean | null>(null);

  // 1. Synchronize incoming Jam session state into local player
  useEffect(() => {
    if (!session) return;

    const sessionTrack = session.currentTrack;
    const sessionPlaying = session.isPlaying;

    // Synchronize Jam session crossfade duration to local player
    if (session.crossfadeSeconds !== undefined) {
      const localCrossfade = usePlayerStore.getState().crossfadeSeconds;
      if (localCrossfade !== session.crossfadeSeconds) {
        usePlayerStore.getState().setCrossfade(session.crossfadeSeconds);
      }
    }

    // Track change
    if (sessionTrack && sessionTrack.id !== currentTrack?.id) {
      isRemoteSyncing.current = true;
      lastSessionTrackId.current = sessionTrack.id;
      lastSessionIsPlaying.current = sessionPlaying;

      if (isAudioOutput) {
        // Output device (Car Speaker / Host) plays the track audio
        playTrack(sessionTrack, session.queue).finally(() => {
          setTimeout(() => {
            isRemoteSyncing.current = false;
          }, 300);
        });
      } else {
        // Controller device (passenger phone) updates UI without sound blaring
        usePlayerStore.setState({
          currentTrack: sessionTrack,
          isPlaying: sessionPlaying,
          queue: session.queue,
        });
        // Ensure local audio engine doesn't blast speaker
        audioEngine.pause();
        isRemoteSyncing.current = false;
      }
      return;
    }

    // Play/Pause sync
    if (sessionPlaying !== isPlaying && !isRemoteSyncing.current) {
      if (isAudioOutput) {
        if (sessionPlaying) {
          audioEngine.play();
          usePlayerStore.setState({ isPlaying: true });
        } else {
          audioEngine.pause();
          usePlayerStore.setState({ isPlaying: false });
        }
      } else {
        usePlayerStore.setState({ isPlaying: sessionPlaying });
        audioEngine.pause();
      }
    }
  }, [session, isAudioOutput, currentTrack?.id, isPlaying, playTrack]);

  // 2. Handle audio output mode toggle
  useEffect(() => {
    if (!session) return;
    if (!isAudioOutput) {
      // If controller mode, ensure local audio element is silenced
      audioEngine.pause();
    } else if (session.isPlaying && currentTrack) {
      // If this device became the designated output, resume audio
      audioEngine.play();
    }
  }, [isAudioOutput, session, currentTrack]);
}
