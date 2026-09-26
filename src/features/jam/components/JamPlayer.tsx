import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  User,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { jamSyncEngine } from '../sync/JamSyncEngine';
import { formatTimeRemaining } from '../utils/jamUtils';
import { audioEngine } from '../../../lib/audio/AudioEngine';
import { JamReactions } from './JamReactions';

export const JamPlayer: React.FC = () => {
  const { room, userId, play, pause, seek, next, previous } = useJamStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeekingLocally, setIsSeekingLocally] = useState(false);
  const [localSeekTime, setLocalSeekTime] = useState(0);

  const track = room?.playback.track;
  const isPlaying = room?.playback.isPlaying ?? false;
  const isHost = room?.metadata.hostId === userId;

  const canPause = isHost || !!room?.settings.allowGuestPause;
  const canSeek = isHost || !!room?.settings.allowGuestSeek;
  const canSkip = isHost || !!room?.settings.allowGuestSkip;

  // Realtime playback timer tick (50ms interval for smooth UI scrubbing)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSeekingLocally) {
        const expected = jamSyncEngine.getExpectedPosition();
        setCurrentTime(expected);
      }
      setDuration(audioEngine.getDuration() || track?.duration || 0);
    }, 50);

    return () => clearInterval(timer);
  }, [isSeekingLocally, track?.duration]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeekingLocally(true);
    setLocalSeekTime(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    setIsSeekingLocally(false);
    seek(localSeekTime);
  };

  const handleToggleVolumeMute = () => {
    if (isMuted) {
      audioEngine.setVolume(volume || 0.85);
      setIsMuted(false);
    } else {
      audioEngine.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    audioEngine.setVolume(val);
  };

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3">
        <Sparkles className="w-12 h-12 text-slate-600 animate-pulse" />
        <h4 className="text-sm font-semibold text-slate-400">Waiting for track selection...</h4>
        <p className="text-xs text-slate-600">The room is ready. Choose a track from the queue.</p>
      </div>
    );
  }

  const activeTime = isSeekingLocally ? localSeekTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (activeTime / duration) * 100) : 0;

  return (
    <div className="relative w-full flex flex-col items-center space-y-6">
      {/* Floating Reaction Layer */}
      <JamReactions />

      {/* Album Artwork with Ambient Halo & Drop Shadow */}
      <div className="relative group mt-2">
        <div
          className="absolute -inset-4 rounded-3xl opacity-60 blur-2xl transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, var(--aura-primary, rgba(99, 102, 241, 0.4)) 0%, transparent 70%)`,
          }}
        />

        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
          <img
            src={track.artwork.high || track.artwork.medium}
            alt={track.title}
            className="w-full h-full object-cover select-none"
          />
        </div>
      </div>

      {/* Track Metadata & Attribution */}
      <div className="w-full text-center space-y-1 px-4">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate max-w-md mx-auto">
          {track.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 truncate max-w-sm mx-auto">
          {track.primaryArtist} • {track.album.title}
        </p>

        {/* "Added by" Tag */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
          <User className="w-2.5 h-2.5 text-[var(--aura-primary,#6366f1)]" />
          <span>Synchronized in Jam</span>
        </div>
      </div>

      {/* Synchronized Live Scrubber */}
      <div className="w-full max-w-md px-2 space-y-1.5">
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={activeTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            disabled={!canSeek}
            aria-label="Seek track"
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
          />
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[var(--aura-primary,#6366f1)] to-cyan-400 rounded-lg pointer-events-none h-1.5"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTimeRemaining(activeTime)}</span>
          <span>{formatTimeRemaining(duration)}</span>
        </div>
      </div>

      {/* Primary Transport Controls */}
      <div className="flex items-center justify-center gap-6">
        {/* Previous */}
        <button
          onClick={previous}
          disabled={!canSkip}
          aria-label="Previous track"
          className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? pause : play}
          disabled={!canPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-13 h-13 rounded-full bg-white hover:bg-slate-200 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={next}
          disabled={!canSkip}
          aria-label="Next track"
          className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Local Volume Slider (Client personal audio, not synchronized) */}
      <div className="flex items-center gap-2 max-w-[200px] w-full text-slate-400">
        <button
          onClick={handleToggleVolumeMute}
          aria-label="Toggle mute"
          className="p-1 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Local playback volume"
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
    </div>
  );
};
