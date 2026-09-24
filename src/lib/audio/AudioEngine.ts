import { AudioFeatures, EQPreset, EQPresetName, Song } from '../music/types';

export const EQ_FREQUENCIES = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 12000, 16000];

export const EQ_PRESETS: Record<EQPresetName, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [5.5, 4.5, 3.5, 1.5, 0, 0, 0, 0, 0, 0],
  Pop: [-1, 1, 3, 4, 3, 1, -1, 1, 2, 3],
  Rock: [4, 3, 2, 0, -1, 1, 2, 3, 4, 4],
  Electronic: [4.5, 4, 1.5, 0, -1, 2, 1, 2, 4, 4.5],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  Classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 3.5],
  Vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

type TimeUpdateListener = (time: number, duration: number, buffered: number) => void;
type StateChangeListener = (isPlaying: boolean, isLoading: boolean) => void;
type TrackEndListener = () => void;

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampGain: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private compressor: DynamicsCompressorNode | null = null;
  private panner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isNightModeEnabled = false;

  private isWebAudioConnected = false;
  private isInitialized = false;

  private timeListeners = new Set<TimeUpdateListener>();
  private stateListeners = new Set<StateChangeListener>();
  private endListeners = new Set<TrackEndListener>();

  // Frequency analysis buffers
  private frequencyData: Uint8Array = new Uint8Array(256);
  private timeDomainData: Uint8Array = new Uint8Array(256);
  private lastEnergy = 0;
  private smoothIntensity = 0;

  // Crossfade config
  private crossfadeDuration = 2; // seconds

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      const current = this.audio.currentTime || 0;
      const duration = this.audio.duration || 0;
      let buffered = 0;
      if (this.audio.buffered.length > 0) {
        buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
      }
      this.timeListeners.forEach(listener => listener(current, duration, buffered));
    });

    this.audio.addEventListener('play', () => {
      this.stateListeners.forEach(l => l(true, false));
    });

    this.audio.addEventListener('pause', () => {
      this.stateListeners.forEach(l => l(false, false));
    });

    this.audio.addEventListener('waiting', () => {
      this.stateListeners.forEach(l => l(!this.audio.paused, true));
    });

    this.audio.addEventListener('playing', () => {
      this.stateListeners.forEach(l => l(true, false));
    });

    this.audio.addEventListener('ended', () => {
      this.endListeners.forEach(l => l());
    });

    this.audio.addEventListener('error', (err) => {
      console.warn('Audio playback error encountered:', err);
      this.stateListeners.forEach(l => l(false, false));
    });
  }

  /**
   * Initializes Web Audio nodes safely upon user interaction
   */
  public initWebAudio() {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.value = 1.0;

      // 10-band Equalizer filters
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Dynamics compressor for Night Mode / Loudness Normalization
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 6;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Stereo balance panner
      if (this.audioCtx.createStereoPanner) {
        this.panner = this.audioCtx.createStereoPanner();
        this.panner.pan.value = 0;
      }

      // Analyser for visualizer
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.82;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 1.0;

      // Try connecting MediaElement to Web Audio pipeline
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);

        // Chain: source -> preamp -> eq0 -> eq1 ... -> eq9 -> panner -> analyser -> masterGain -> destination
        let lastNode: AudioNode = this.sourceNode;
        lastNode.connect(this.preampGain);
        lastNode = this.preampGain;

        for (const filter of this.eqFilters) {
          lastNode.connect(filter);
          lastNode = filter;
        }

        if (this.panner) {
          lastNode.connect(this.panner);
          lastNode = this.panner;
        }

        lastNode.connect(this.analyser);
        this.analyser.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);

        this.isWebAudioConnected = true;
      } catch (corsErr) {
        console.warn('Web Audio source node connection failed, playing via direct HTML audio:', corsErr);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio context initialization error:', err);
    }
  }

  public async loadAndPlay(src: string, crossfade = false): Promise<void> {
    this.initWebAudio();

    if (crossfade && this.crossfadeDuration > 0 && !this.audio.paused) {
      const fadeDuration = Math.min(1.2, this.crossfadeDuration / 2);
      if (this.masterGain && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        const currentVol = this.masterGain.gain.value;
        // Fade out smoothly
        this.masterGain.gain.setValueAtTime(currentVol, now);
        this.masterGain.gain.linearRampToValueAtTime(0.01, now + fadeDuration);

        setTimeout(() => {
          this.audio.src = src;
          this.audio.load();
          this.audio.play().then(() => {
            if (this.masterGain && this.audioCtx) {
              const resumeNow = this.audioCtx.currentTime;
              this.masterGain.gain.setValueAtTime(0.01, resumeNow);
              this.masterGain.gain.linearRampToValueAtTime(currentVol, resumeNow + fadeDuration);
            }
          }).catch(e => console.warn('Play interrupted:', e));
        }, fadeDuration * 1000);
        return;
      }
    }

    this.audio.src = src;
    this.audio.load();
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Playback play() call waiting for user gesture or source load:', err);
    }
  }

  public play() {
    this.initWebAudio();
    return this.audio.play();
  }

  public pause() {
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 9999));
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.audio.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
  }

  public setPlaybackRate(rate: number) {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    this.audio.playbackRate = clamped;
  }

  public setEQBand(bandIndex: number, gainDb: number) {
    if (this.eqFilters[bandIndex] && this.audioCtx) {
      const clampedGain = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[bandIndex].gain.setValueAtTime(clampedGain, this.audioCtx.currentTime);
    }
  }

  public applyEQPreset(presetName: EQPresetName, customBands?: number[]) {
    const gains = customBands || EQ_PRESETS[presetName] || EQ_PRESETS.Flat;
    gains.forEach((gain, index) => {
      this.setEQBand(index, gain);
    });
  }

  public setNightMode(enabled: boolean) {
    this.isNightModeEnabled = enabled;
    if (!this.audioCtx || !this.compressor || !this.preampGain) return;

    if (enabled) {
      // Connect compressor
      try {
        this.preampGain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);
      } catch (e) {}
    } else {
      try {
        this.preampGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      } catch (e) {}
    }
  }

  public setBalance(pan: number) {
    if (this.panner && this.audioCtx) {
      const clamped = Math.max(-1, Math.min(1, pan));
      this.panner.pan.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
  }

  public setCrossfade(seconds: number) {
    this.crossfadeDuration = Math.max(0, Math.min(12, seconds));
  }

  public getCrossfade(): number {
    return this.crossfadeDuration;
  }

  /**
   * Extract real-time normalized audio features for the visualizer
   */
  public getAudioFeatures(): AudioFeatures {
    if (!this.analyser) {
      // Return synthetic gentle wave if WebAudio is inactive or paused
      const isPlaying = !this.audio.paused;
      const t = Date.now() / 1000;
      const energy = isPlaying ? 0.4 + Math.sin(t * 3) * 0.15 : 0;
      return {
        bass: isPlaying ? 0.5 + Math.sin(t * 4) * 0.2 : 0,
        mids: isPlaying ? 0.35 + Math.cos(t * 2) * 0.15 : 0,
        treble: isPlaying ? 0.3 + Math.sin(t * 5) * 0.1 : 0,
        energy,
        beat: isPlaying && Math.sin(t * 4) > 0.65,
        intensity: energy,
        spectrum: this.frequencyData,
      };
    }

    this.analyser.getByteFrequencyData(this.frequencyData as any);

    const length = this.frequencyData.length;
    let bassSum = 0;
    let midsSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    // Sub/bass: bins 0 to ~12 (~20Hz to ~250Hz)
    const bassEnd = Math.min(14, length);
    for (let i = 0; i < bassEnd; i++) {
      bassSum += this.frequencyData[i];
    }
    const bass = (bassSum / bassEnd) / 255;

    // Mids: bins 14 to ~80 (~250Hz to ~4kHz)
    const midsEnd = Math.min(80, length);
    for (let i = bassEnd; i < midsEnd; i++) {
      midsSum += this.frequencyData[i];
    }
    const mids = (midsSum / (midsEnd - bassEnd)) / 255;

    // Treble: bins 80 to 200 (~4kHz to ~16kHz)
    const trebleEnd = Math.min(200, length);
    for (let i = midsEnd; i < trebleEnd; i++) {
      trebleSum += this.frequencyData[i];
    }
    const treble = (trebleSum / (trebleEnd - midsEnd)) / 255;

    for (let i = 0; i < length; i++) {
      totalSum += this.frequencyData[i];
    }
    const energy = (totalSum / length) / 255;

    // Beat detection via transient energy differential
    const beat = energy - this.lastEnergy > 0.08 && bass > 0.45;
    this.lastEnergy = energy;

    // Exponential moving average for intensity
    this.smoothIntensity = this.smoothIntensity * 0.88 + energy * 0.12;

    return {
      bass,
      mids,
      treble,
      energy,
      beat,
      intensity: this.smoothIntensity,
      spectrum: this.frequencyData,
    };
  }

  // Subscribe to high-frequency audio clock
  public subscribeTime(listener: TimeUpdateListener): () => void {
    this.timeListeners.add(listener);
    return () => this.timeListeners.delete(listener);
  }

  // Subscribe to playback state changes
  public subscribeState(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Subscribe to track completion
  public subscribeEnded(listener: TrackEndListener): () => void {
    this.endListeners.add(listener);
    return () => this.endListeners.delete(listener);
  }

  public getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  public isPaused(): boolean {
    return this.audio.paused;
  }
}

export const audioEngine = new AudioEngine();
