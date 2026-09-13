// Native Web Audio API Racing Engine & Gear Shift Sound Synthesizer
// Zero external assets or network latency.

class RacingAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private audioBuffer: AudioBuffer | null = null;
  private isLoadingBuffer: boolean = false;

  constructor() {
    // Check localStorage preference
    const saved = localStorage.getItem("treadtrace_sfx");
    if (saved !== null) {
      this.isEnabled = saved === "true";
    }
    // Eagerly preload the F1 engine exhaust asset on initial load
    if (typeof window !== "undefined") {
      this.preloadBuffer();
    }
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem("treadtrace_sfx", String(this.isEnabled));
    if (this.isEnabled) {
      this.playShift();
    }
    return this.isEnabled;
  }

  public setEnabled(val: boolean): void {
    this.isEnabled = val;
    localStorage.setItem("treadtrace_sfx", String(val));
  }

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Eagerly preloads and decodes the 2JZ-GTE exhaust rev audio recording into memory.
   */
  private async preloadBuffer(): Promise<void> {
    if (this.audioBuffer || this.isLoadingBuffer) return;
    this.isLoadingBuffer = true;
    try {
      let res = await fetch("/sounds/2jz_exhaust_rev.wav");
      if (!res.ok) {
        res = await fetch("/sounds/f1_exhaust_rev.wav");
      }
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const ctx = this.initContext();
        if (ctx) {
          this.audioBuffer = await ctx.decodeAudioData(arrayBuf);
        }
      }
    } catch {
      // Procedural fallback will be used if fetch is delayed
    } finally {
      this.isLoadingBuffer = false;
    }
  }

  private distortionCurve: Float32Array | null = null;

  private getDistortionCurve(): Float32Array {
    if (!this.distortionCurve) {
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      const amount = 24;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      }
      this.distortionCurve = curve;
    }
    return this.distortionCurve;
  }

  private activeGain: GainNode | null = null;

  /**
   * Plays a LOUD, aggressive, authentic 2JZ-GTE / motorsport engine exhaust rev note (~5.0 seconds)
   */
  public playShift(direction: "UP" | "DOWN" = "UP"): void {
    if (!this.isEnabled) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Smoothly crossfade any in-flight engine rev to prevent clipping on rapid clicks
      if (this.activeGain) {
        try {
          this.activeGain.gain.cancelScheduledValues(now);
          this.activeGain.gain.setValueAtTime(this.activeGain.gain.value, now);
          this.activeGain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        } catch {
          // ignore
        }
      }

      // 1. Primary: Play the high-energy physical 2JZ-GTE exhaust note buffer
      if (this.audioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = this.audioBuffer;

        // Subtle mechanical pitch difference between upshift roar and downshift blip
        source.playbackRate.setValueAtTime(direction === "UP" ? 1.0 : 1.04, now);

        const gainNode = ctx.createGain();
        // Loud, powerful, visceral engine presence
        gainNode.gain.setValueAtTime(0.95, now);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        this.activeGain = gainNode;
        source.onended = () => {
          if (this.activeGain === gainNode) {
            this.activeGain = null;
          }
        };

        source.start(now);
        return;
      } else {
        // Trigger preload if not yet completed
        void this.preloadBuffer();
      }

      // 2. High-volume procedural F1 combustion fallback (if audio buffer decode is in flight)
      const duration = 1.50;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.55, now); // Loud motorsport presence

      const waveshaper = ctx.createWaveShaper();
      waveshaper.curve = this.getDistortionCurve() as Float32Array<ArrayBuffer>;
      waveshaper.oversample = "2x";

      waveshaper.connect(masterGain);
      masterGain.connect(ctx.destination);

      // =========================================================================
      // 1. ENGINE COMBUSTION MULTI-OSCILLATOR HARMONIC BANK (F1 High-Rev Exhaust)
      // =========================================================================
      // Osc 1: Primary firing frequency (Sawtooth)
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";

      // Osc 2: 2nd harmonic / detuned screamer pipe (+7 cents for rich acoustic chorus)
      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.detune.setValueAtTime(7, now);

      // Osc 3: Sub-harmonic cylinder rumble (Triangle) for mechanical punch
      const oscSub = ctx.createOscillator();
      oscSub.type = "triangle";

      // Pitch contours over the 1.5 second event
      if (direction === "UP") {
        // Crisp acceleration flare: 260Hz -> 680Hz -> 740Hz peak -> 320Hz decel
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(360, now + 0.15); // 0.00-0.15s: ignition / pickup
        osc1.frequency.exponentialRampToValueAtTime(680, now + 0.70); // 0.15-0.70s: strong rising exhaust note
        osc1.frequency.linearRampToValueAtTime(730, now + 1.10);      // 0.70-1.10s: high-RPM peak
        osc1.frequency.exponentialRampToValueAtTime(290, now + 1.48); // 1.10-1.50s: exhaust decel & fade

        osc2.frequency.setValueAtTime(520, now);
        osc2.frequency.exponentialRampToValueAtTime(720, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1360, now + 0.70);
        osc2.frequency.linearRampToValueAtTime(1460, now + 1.10);
        osc2.frequency.exponentialRampToValueAtTime(580, now + 1.48);

        oscSub.frequency.setValueAtTime(130, now);
        oscSub.frequency.exponentialRampToValueAtTime(180, now + 0.15);
        oscSub.frequency.exponentialRampToValueAtTime(340, now + 0.70);
        oscSub.frequency.linearRampToValueAtTime(365, now + 1.10);
        oscSub.frequency.exponentialRampToValueAtTime(145, now + 1.48);
      } else {
        // Downshift rev blip: sharp aggressive rise to high revs then deep decel
        osc1.frequency.setValueAtTime(340, now);
        osc1.frequency.exponentialRampToValueAtTime(780, now + 0.18); // Fast blip
        osc1.frequency.exponentialRampToValueAtTime(560, now + 0.70);
        osc1.frequency.linearRampToValueAtTime(520, now + 1.10);
        osc1.frequency.exponentialRampToValueAtTime(240, now + 1.48);

        osc2.frequency.setValueAtTime(680, now);
        osc2.frequency.exponentialRampToValueAtTime(1560, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(1120, now + 0.70);
        osc2.frequency.linearRampToValueAtTime(1040, now + 1.10);
        osc2.frequency.exponentialRampToValueAtTime(480, now + 1.48);

        oscSub.frequency.setValueAtTime(170, now);
        oscSub.frequency.exponentialRampToValueAtTime(390, now + 0.18);
        oscSub.frequency.exponentialRampToValueAtTime(280, now + 0.70);
        oscSub.frequency.linearRampToValueAtTime(260, now + 1.10);
        oscSub.frequency.exponentialRampToValueAtTime(120, now + 1.48);
      }

      // Exhaust Tailpipe & Manifold Resonant Filter
      const exhaustFilter = ctx.createBiquadFilter();
      exhaustFilter.type = "lowpass";
      exhaustFilter.Q.setValueAtTime(3.8, now); // Metallic F1 pipe resonance

      exhaustFilter.frequency.setValueAtTime(1400, now);
      exhaustFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
      exhaustFilter.frequency.exponentialRampToValueAtTime(4600, now + 0.70); // Screaming open throttle
      exhaustFilter.frequency.linearRampToValueAtTime(4200, now + 1.10);
      exhaustFilter.frequency.exponentialRampToValueAtTime(800, now + 1.48);

      // Acoustic Peaking Filter for metallic exhaust bite
      const peakFilter = ctx.createBiquadFilter();
      peakFilter.type = "peaking";
      peakFilter.frequency.setValueAtTime(2600, now);
      peakFilter.Q.setValueAtTime(2.2, now);
      peakFilter.gain.setValueAtTime(4.0, now);

      // Engine combustion volume envelope (~1.5s lifecycle)
      const engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0.001, now);
      engineGain.gain.exponentialRampToValueAtTime(0.09, now + 0.08); // 0.00-0.15s: ignition attack
      engineGain.gain.exponentialRampToValueAtTime(0.14, now + 0.70); // 0.15-0.70s: rising roar
      engineGain.gain.setValueAtTime(0.13, now + 1.10);              // 0.70-1.10s: high-RPM peak
      engineGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48); // 1.10-1.50s: rapid exhaust decay

      // Connect combustion graph
      osc1.connect(exhaustFilter);
      osc2.connect(exhaustFilter);
      oscSub.connect(exhaustFilter);
      exhaustFilter.connect(peakFilter);
      peakFilter.connect(engineGain);
      engineGain.connect(waveshaper);

      osc1.start(now);
      osc2.start(now);
      oscSub.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      oscSub.stop(now + duration);

      // =========================================================================
      // 2. TURBOCHARGER SPOOL & INDUCTION WHINE (High-Frequency Mechanical Layer)
      // =========================================================================
      const turboOsc = ctx.createOscillator();
      turboOsc.type = "sine";
      turboOsc.frequency.setValueAtTime(2400, now);
      turboOsc.frequency.exponentialRampToValueAtTime(4800, now + 0.70);
      turboOsc.frequency.linearRampToValueAtTime(5200, now + 1.10);
      turboOsc.frequency.exponentialRampToValueAtTime(1800, now + 1.40);

      const turboFilter = ctx.createBiquadFilter();
      turboFilter.type = "bandpass";
      turboFilter.frequency.setValueAtTime(4200, now);
      turboFilter.Q.setValueAtTime(3.5, now);

      const turboGain = ctx.createGain();
      turboGain.gain.setValueAtTime(0.0001, now);
      turboGain.gain.exponentialRampToValueAtTime(0.022, now + 0.70);
      turboGain.gain.setValueAtTime(0.020, now + 1.10);
      turboGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.42);

      turboOsc.connect(turboFilter);
      turboFilter.connect(turboGain);
      turboGain.connect(masterGain);

      turboOsc.start(now);
      turboOsc.stop(now + duration);

      // =========================================================================
      // 3. EXHAUST GAS OVERRUN CRACKLE & REVERB TAIL (Shaped Gas Pulse Turbulence)
      // =========================================================================
      const sampleRate = ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);

      for (let i = 0; i < noiseData.length; i++) {
        const t = i / sampleRate;
        // Exponential decay envelope modulated with subtle exhaust overrun pops around 1.08-1.28s
        const crackle = (t > 1.05 && t < 1.30)
          ? Math.sin(t * 180) * (Math.random() > 0.65 ? 1.6 : 0.4)
          : 0.5;
        noiseData[i] = (Math.random() * 2 - 1) * crackle;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1900, now);
      noiseFilter.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.025, now + 0.12); // Initial exhaust gas rush
      noiseGain.gain.linearRampToValueAtTime(0.015, now + 0.70);
      noiseGain.gain.linearRampToValueAtTime(0.038, now + 1.10);      // Overrun crackle peak on throttle lift
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.48); // Reverb tail fade out

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + duration);
    } catch {
      // AudioContext might be suspended or blocked before user gesture
    }
  }
}

export const racingAudio = new RacingAudioEngine();
