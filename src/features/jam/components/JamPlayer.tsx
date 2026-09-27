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
  Smartphone,
  Plus,
  Music,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { jamSyncEngine } from '../sync/JamSyncEngine';
import { formatTimeRemaining } from '../utils/jamUtils';
import { audioEngine } from '../../../lib/audio/AudioEngine';
import { JamReactions } from './JamReactions';

export const JamPlayer: React.FC = () => {
  const { setSearchModalOpen } = usePlayerStore();
  const {
    room,
    userId,
    isAudioOutput,
    toggleAudioOutput,
    play,
    pause,
    seek,
    next,
    previous,
  } = useJamStore();

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
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 space-y-4 max-w-sm mx-auto animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shadow-xl">
          <Music className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white tracking-tight">No Song Playing Yet</h4>
          <p className="text-xs text-slate-400">
            The Jam room is live and ready! Search and add songs to start synchronized listening with your friends.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--aura-primary,#6366f1)] hover:brightness-110 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Songs to Jam</span>
        </button>
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

      {/* Audio Output Mode (Speaker vs Remote Controller) */}
      <div className="w-full max-w-md px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5 min-w-0">
          {isAudioOutput ? (
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {isAudioOutput ? 'Speaker Mode' : 'Remote Controller Mode'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {isAudioOutput
                ? 'Audio is playing on this device'
                : 'Muted here • Playing on Host / Laptop'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAudioOutput}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            isAudioOutput
              ? 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
          }`}
        >
          {isAudioOutput ? 'Mute This Phone' : '🔊 Listen on Phone'}
        </button>
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

      {/* Quick Add Songs to Jam Queue Button */}
      <button
        type="button"
        onClick={() => setSearchModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm hover:border-white/20"
      >
        <Plus className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)]" />
        <span>Add Song to Jam</span>
      </button>

      {/* Local Volume Slider or Remote Mode Note */}
      {isAudioOutput ? (
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
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-sky-400/80 font-mono">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Silent Controller • Tap "Listen on Phone" for sound</span>
        </div>
      )}
    </div>
  );
};
