import { useEffect, useState } from 'react';
import { audioEngine } from '../lib/audio/AudioEngine';

export interface AudioTimeState {
  currentTime: number;
  duration: number;
  buffered: number;
  progress: number; // 0 to 1
}

export function useAudioTime(): AudioTimeState {
  const [timeState, setTimeState] = useState<AudioTimeState>(() => {
    const cur = audioEngine.getCurrentTime();
    const dur = audioEngine.getDuration();
    return {
      currentTime: cur,
      duration: dur,
      buffered: 0,
      progress: dur > 0 ? cur / dur : 0,
    };
  });

  useEffect(() => {
    const unsubscribe = audioEngine.subscribeTime((currentTime, duration, buffered) => {
      setTimeState({
        currentTime,
        duration,
        buffered,
        progress: duration > 0 ? currentTime / duration : 0,
      });
    });

    return unsubscribe;
  }, []);

  return timeState;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
