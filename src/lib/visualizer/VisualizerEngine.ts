import { audioEngine } from '../audio/AudioEngine';
import { AudioFeatures, SongPhase, VisualizerMode } from '../music/types';
import { ExtractedColors } from '../color/colorExtractor';

export class VisualizerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private mode: VisualizerMode = 'aurora';
  private colors: ExtractedColors;
  private isRunning = false;

  // Auto-Director State
  public currentPhase: SongPhase = 'INTRO';
  private phaseProgress = 0;
  private energyHistory: number[] = [];
  private particleField: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hueOffset: number }[] = [];
  private time = 0;

  constructor(canvas: HTMLCanvasElement, colors: ExtractedColors) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.colors = colors;

    this.initParticles(120);
  }

  private initParticles(count: number) {
    this.particleField = [];
    for (let i = 0; i < count; i++) {
      this.particleField.push({
        x: Math.random() * (this.canvas.width || 800),
        y: Math.random() * (this.canvas.height || 600),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        hueOffset: Math.random() * 40 - 20,
      });
    }
  }

  public setMode(mode: VisualizerMode) {
    this.mode = mode;
  }

  public setColors(colors: ExtractedColors) {
    this.colors = colors;
  }

  public resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    this.initParticles(Math.min(180, Math.floor(width / 7)));
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateAutoDirector(features: AudioFeatures, currentTime: number, duration: number) {
    // Track energy rolling average
    this.energyHistory.push(features.energy);
    if (this.energyHistory.length > 60) this.energyHistory.shift();
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Detect song phase based on time and audio energy
    if (duration > 0) {
      const pct = currentTime / duration;
      if (pct < 0.12) {
        this.currentPhase = 'INTRO';
      } else if (pct > 0.88) {
        this.currentPhase = 'OUTRO';
      } else if (features.energy > 0.55 || (avgEnergy > 0.45 && features.beat)) {
        this.currentPhase = 'PEAK';
      } else if (avgEnergy < 0.25) {
        this.currentPhase = 'BREAKDOWN';
      } else {
        this.currentPhase = 'BUILD';
      }
    } else {
      this.currentPhase = features.energy > 0.5 ? 'PEAK' : features.energy > 0.3 ? 'BUILD' : 'INTRO';
    }
  }

  private render = () => {
    if (!this.isRunning) return;

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const features = audioEngine.getAudioFeatures();
    const currentTime = audioEngine.getCurrentTime();
    const duration = audioEngine.getDuration();

    this.updateAutoDirector(features, currentTime, duration);
    this.time += 0.016;

    // Clear frame with soft fade for motion blur
    this.ctx.fillStyle = 'rgba(8, 9, 13, 0.28)';
    this.ctx.fillRect(0, 0, width, height);

    // Render selected visualizer mode
    switch (this.mode) {
      case 'aurora':
        this.renderAurora(width, height, features);
        break;
      case 'nebula':
        this.renderNebula(width, height, features);
        break;
      case 'solar':
        this.renderSolar(width, height, features);
        break;
      case 'liquid':
        this.renderLiquid(width, height, features);
        break;
      case 'pulse':
        this.renderPulse(width, height, features);
        break;
      case 'waveform':
        this.renderWaveform(width, height, features);
        break;
      case 'spectrum':
        this.renderSpectrum(width, height, features);
        break;
      case 'minimal':
      default:
        this.renderMinimal(width, height, features);
        break;
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * AURORA: Shifting atmospheric ribbons & ripples
   */
  private renderAurora(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const numRibbons = 4;
    const centerY = height * 0.55;

    ctx.save();
    for (let r = 0; r < numRibbons; r++) {
      ctx.beginPath();
      const waveOffset = r * 1.5;
      const speed = (r + 1) * 0.8;
      const amp = (height * 0.15) * (0.5 + f.bass * 1.2) * (r === 0 ? 1.2 : 0.8);

      ctx.moveTo(0, centerY);
      for (let x = 0; x <= width; x += 15) {
        const normX = x / width;
        const wave1 = Math.sin(normX * 4 + this.time * speed + waveOffset);
        const wave2 = Math.cos(normX * 8 - this.time * 0.5) * 0.5;
        const reactive = (f.spectrum[Math.floor(normX * 80)] || 0) / 255;
        const y = centerY + (wave1 + wave2) * amp - reactive * (height * 0.18);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, centerY - amp, width, height);
      if (r % 2 === 0) {
        grad.addColorStop(0, `${this.colors.primary}55`);
        grad.addColorStop(0.5, `${this.colors.secondary}33`);
        grad.addColorStop(1, 'rgba(8, 9, 13, 0)');
      } else {
        grad.addColorStop(0, `${this.colors.secondary}44`);
        grad.addColorStop(0.7, `${this.colors.primary}22`);
        grad.addColorStop(1, 'rgba(8, 9, 13, 0)');
      }

      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * NEBULA: Swirling cosmic stardust reacting to audio energy
   */
  private renderNebula(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const speedMult = 1 + f.energy * 2.5;

    // Glowing core
    const coreGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.max(120, width * 0.4));
    coreGrad.addColorStop(0, `${this.colors.primary}66`);
    coreGrad.addColorStop(0.4, `${this.colors.secondary}33`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    for (const p of this.particleField) {
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const dynamicSize = p.size * (1 + f.bass * 1.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2);
      ctx.fillStyle = p.hueOffset > 0 ? `${this.colors.primary}cc` : `${this.colors.secondary}cc`;
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * SOLAR: Radiant pulsating star with corona flares
   */
  private renderSolar(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const dynamicRadius = baseRadius + f.bass * 45;

    // Corona Rays
    const numRays = 72;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.time * 0.2);

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const binIndex = Math.floor((i / numRays) * 128);
      const val = (f.spectrum[binIndex] || 0) / 255;
      const rayLen = dynamicRadius + val * 90 + Math.sin(this.time * 4 + i) * 15;

      const x1 = Math.cos(angle) * dynamicRadius;
      const y1 = Math.sin(angle) * dynamicRadius;
      const x2 = Math.cos(angle) * rayLen;
      const y2 = Math.sin(angle) * rayLen;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = i % 2 === 0 ? `${this.colors.primary}aa` : `${this.colors.secondary}99`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Solar Center Sphere
    ctx.beginPath();
    ctx.arc(0, 0, dynamicRadius, 0, Math.PI * 2);
    const starGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, dynamicRadius);
    starGrad.addColorStop(0, '#ffffff');
    starGrad.addColorStop(0.3, this.colors.primary);
    starGrad.addColorStop(0.85, this.colors.secondary);
    starGrad.addColorStop(1, 'rgba(10, 10, 20, 0.4)');
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.restore();
  }

  /**
   * LIQUID: Organic undulating metaballs and fluid ribbons
   */
  private renderLiquid(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const points = 36;
    const baseRadius = Math.min(width, height) * 0.24;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const freqIndex = Math.floor((i / points) * 64);
      const freqVal = (f.spectrum[freqIndex] || 0) / 255;
      const wobble = Math.sin(angle * 6 + this.time * 3) * (20 + f.mids * 35);
      const r = baseRadius + wobble + freqVal * 55;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const fluidGrad = ctx.createRadialGradient(0, 0, baseRadius * 0.2, 0, 0, baseRadius * 1.5);
    fluidGrad.addColorStop(0, `${this.colors.primary}dd`);
    fluidGrad.addColorStop(0.7, `${this.colors.secondary}88`);
    fluidGrad.addColorStop(1, 'rgba(8, 9, 13, 0)');

    ctx.fillStyle = fluidGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * PULSE: Concentric geometric resonant rings
   */
  private renderPulse(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.48;
    const ringCount = 8;

    ctx.save();
    for (let i = 0; i < ringCount; i++) {
      const progress = (i / ringCount + this.time * 0.2) % 1;
      const radius = progress * maxRadius * (1 + f.bass * 0.3);
      const alpha = Math.max(0, 1 - progress);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 === 0 ? `${this.colors.primary}` : `${this.colors.secondary}`;
      ctx.globalAlpha = alpha * (0.4 + f.energy * 0.6);
      ctx.lineWidth = 2 + (1 - progress) * 4;
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * WAVEFORM: Precision glowing neon oscilloscope line
   */
  private renderWaveform(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerY = height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    const step = width / 128;
    for (let i = 0; i < 128; i++) {
      const val = (f.spectrum[i] || 0) / 255;
      const sign = i % 2 === 0 ? 1 : -1;
      const y = centerY + sign * val * (height * 0.35) * (0.6 + f.energy * 0.8);
      ctx.lineTo(i * step, y);
    }
    ctx.lineTo(width, centerY);

    ctx.shadowColor = this.colors.primary;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * SPECTRUM: Sleek modern columns with falling peak caps
   */
  private renderSpectrum(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const barCount = 48;
    const gap = 4;
    const barWidth = (width - (barCount - 1) * gap) / barCount;

    ctx.save();
    for (let i = 0; i < barCount; i++) {
      const val = (f.spectrum[i * 2] || 0) / 255;
      const barHeight = Math.max(4, val * (height * 0.65));
      const x = i * (barWidth + gap);
      const y = height - barHeight - 20;

      const grad = ctx.createLinearGradient(x, y, x, height - 20);
      grad.addColorStop(0, this.colors.primary);
      grad.addColorStop(1, `${this.colors.secondary}55`);

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Peak glow cap
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, barWidth, 2);
    }
    ctx.restore();
  }

  /**
   * MINIMAL: Quiet, understated luxury audio wave
   */
  private renderMinimal(width: number, height: number, f: AudioFeatures) {
    const ctx = this.ctx;
    const centerY = height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let x = 0; x <= width; x += 10) {
      const normX = x / width;
      const freqIndex = Math.floor(normX * 40);
      const val = (f.spectrum[freqIndex] || 0) / 255;
      const wave = Math.sin(normX * 8 + this.time * 2) * (10 + val * 30 * (0.5 + f.energy));
      ctx.lineTo(x, centerY + wave);
    }

    ctx.strokeStyle = `${this.colors.primary}bb`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}
