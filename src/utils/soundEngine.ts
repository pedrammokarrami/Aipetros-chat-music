import type { AudioSynthPreset } from '../types';

class ManuscriptSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  // Ambient stream player state
  private streamInterval: number | null = null;
  private streamMasterGain: GainNode | null = null;
  private streamStep = 0;
  private streamPlaying = false;
  private streamPreset: AudioSynthPreset = 'santur';
  private streamRate = 1;
  private streamVolume = 0.6;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = window.localStorage.getItem('nava_negar_muted') === 'true';
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nava_negar_muted', String(next));
    }
    if (this.streamMasterGain && this.ctx) {
      this.streamMasterGain.gain.setTargetAtTime(
        next ? 0 : this.streamVolume * 0.22,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  /** Subtle reed-quill scratching on parchment for navigation & tab switches */
  public playQuillScratch(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const duration = 0.085;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      const env = Math.sin((i / sampleCount) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2750, ctx.currentTime + duration);
    filter.Q.value = 3.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  /** Soft low-frequency ink-pen click / warm chime for likes, shares, sending */
  public playInkClick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const oscHarm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(215, now + 0.095);

    oscHarm.type = 'triangle';
    oscHarm.frequency.setValueAtTime(680, now);
    oscHarm.frequency.exponentialRampToValueAtTime(430, now + 0.075);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.04, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);

    osc.connect(gain);
    oscHarm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    oscHarm.start(now);
    osc.stop(now + 0.13);
    oscHarm.stop(now + 0.1);
  }

  /** Resonant wax-seal press sound for unlocking modals & primary confirmations */
  public playSealPress(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Deep wax thump
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(145, now);
    thump.frequency.exponentialRampToValueAtTime(52, now + 0.16);
    thumpGain.gain.setValueAtTime(0.24, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.2);

    // Warm antique brass shimmer overtone
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(440, now + 0.03);
    bell.frequency.exponentialRampToValueAtTime(436, now + 0.34);
    bellGain.gain.setValueAtTime(0.001, now + 0.02);
    bellGain.gain.linearRampToValueAtTime(0.075, now + 0.05);
    bellGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);
    bell.connect(bellGain);
    bellGain.connect(ctx.destination);
    bell.start(now + 0.02);
    bell.stop(now + 0.38);
  }

  /** Soft paper-leaf turn sound when opening dossiers or drawers */
  public playPageTurn(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const duration = 0.14;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / sampleCount;
      const env = Math.pow(Math.sin(t * Math.PI), 1.4);
      data[i] = (Math.random() * 2 - 1) * env * 0.28;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + duration);
    filter.Q.value = 1.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.11, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  }

  /** Playable synthesized acoustic accompaniment for the Theater & Inline Stream Player */
  public startAmbientStream(preset: AudioSynthPreset, volume = 0.6, rate = 1): void {
    this.stopAmbientStream();
    this.streamPreset = preset;
    this.streamVolume = volume;
    this.streamRate = rate;
    this.streamPlaying = true;

    const ctx = this.ensureContext();
    if (!ctx) return;

    this.streamMasterGain = ctx.createGain();
    this.streamMasterGain.gain.value = this.muted ? 0 : volume * 0.22;
    this.streamMasterGain.connect(ctx.destination);

    this.playNextAmbientPhrase();
    const intervalMs = Math.max(320, Math.round(620 / this.streamRate));
    this.streamInterval = window.setInterval(() => {
      if (!this.streamPlaying) return;
      this.playNextAmbientPhrase();
    }, intervalMs);
  }

  public updateAmbientStream(volume: number, rate: number): void {
    this.streamVolume = volume;
    const rateChanged = rate !== this.streamRate;
    this.streamRate = rate;
    if (this.streamMasterGain && this.ctx) {
      this.streamMasterGain.gain.setTargetAtTime(
        this.muted ? 0 : volume * 0.22,
        this.ctx.currentTime,
        0.04
      );
    }
    if (rateChanged && this.streamPlaying) {
      this.startAmbientStream(this.streamPreset, this.streamVolume, this.streamRate);
    }
  }

  public stopAmbientStream(): void {
    this.streamPlaying = false;
    if (this.streamInterval !== null) {
      window.clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    if (this.streamMasterGain) {
      try {
        this.streamMasterGain.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.streamMasterGain = null;
    }
  }

  private playNextAmbientPhrase(): void {
    if (!this.ctx || !this.streamMasterGain || this.muted) return;
    const now = this.ctx.currentTime;

    // Curated musical scales per genre preset
    const scales: Record<AudioSynthPreset, number[]> = {
      // Persian Hijaz / Homayoun evocative intervals
      santur: [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33],
      // Warm Minor 9th late-night jazz voicings
      jazz: [220.0, 261.63, 329.63, 392.0, 493.88, 349.23, 293.66, 440.0],
      // Gentle mellow spoken-word / studio bed chords
      podcast: [196.0, 246.94, 293.66, 329.63, 246.94, 220.0, 293.66, 196.0],
      // Classic analog warm arpeggio
      guitar: [164.81, 246.94, 329.63, 392.0, 493.88, 392.0, 329.63, 293.66],
    };

    const notes = scales[this.streamPreset];
    const pattern = [0, 2, 4, 3, 5, 4, 2, 1];
    const idx = pattern[this.streamStep % pattern.length];
    const freq = notes[idx % notes.length];
    this.streamStep += 1;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type =
      this.streamPreset === 'santur'
        ? 'triangle'
        : this.streamPreset === 'guitar'
          ? 'sawtooth'
          : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      this.streamPreset === 'santur' ? 2400 : this.streamPreset === 'guitar' ? 1100 : 950,
      now
    );

    const decay = this.streamPreset === 'podcast' ? 0.55 : 0.72;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(this.streamPreset === 'podcast' ? 0.16 : 0.34, now + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.streamMasterGain);

    osc.start(now);
    osc.stop(now + decay + 0.04);
  }
}

export const soundEngine = new ManuscriptSoundEngine();
