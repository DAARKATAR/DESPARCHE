/**
 * Web Audio API procedural sound synthesizer for COD Zombies 2D
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.35; // Comfortable, pleasant default
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private initialized: boolean = false;
  private lowHealthOsc: OscillatorNode | null = null;
  private lowHealthGain: GainNode | null = null;

  constructor() {
    // Lazy init on first user gesture
  }

  private init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      // AudioContext not allowed or supported
    }
  }

  public ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Gunshots
  public playGunshot(type: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'lmg' | 'wonder', isPap: boolean = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    if (type === 'wonder') {
      // Ray Gun futuristic laser zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isPap ? 'sawtooth' : 'triangle';
      
      const startFreq = isPap ? 1200 : 900;
      const endFreq = isPap ? 90 : 120;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.22);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);

      // Add high frequency ring
      const ring = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(2400, t);
      ring.frequency.exponentialRampToValueAtTime(400, t + 0.15);
      ringGain.gain.setValueAtTime(0.15, t);
      ringGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      ring.connect(ringGain);
      ringGain.connect(this.sfxGain);
      ring.start(t);
      ring.stop(t + 0.16);
      return;
    }

    // Realistic gunshot noise + punch punch
    const bufferSize = this.ctx.sampleRate * (type === 'shotgun' ? 0.35 : type === 'rifle' ? 0.4 : 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'shotgun' ? 1800 : type === 'rifle' ? 3200 : 2400, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + (type === 'shotgun' ? 0.3 : 0.18));

    const noiseGain = this.ctx.createGain();
    const vol = type === 'shotgun' ? 0.65 : type === 'rifle' ? 0.6 : type === 'lmg' ? 0.5 : 0.35;
    noiseGain.gain.setValueAtTime(vol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + (type === 'shotgun' ? 0.32 : 0.17));

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    // Punchy low-end thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    const subFreq = type === 'shotgun' || type === 'lmg' ? 130 : 160;
    subOsc.frequency.setValueAtTime(subFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.14);

    // Pack-a-punch laser zap layer
    if (isPap) {
      const papOsc = this.ctx.createOscillator();
      const papGain = this.ctx.createGain();
      papOsc.type = 'sawtooth';
      papOsc.frequency.setValueAtTime(1400, t);
      papOsc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
      papGain.gain.setValueAtTime(0.2, t);
      papGain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      papOsc.connect(papGain);
      papGain.connect(this.sfxGain);
      papOsc.start(t);
      papOsc.stop(t + 0.17);
    }
  }

  // Reload sound
  public playReload() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Click 1 (mag drop)
    this.playClick(t, 600, 0.05);
    // Click 2 (mag insert)
    this.playClick(t + 0.4, 450, 0.07);
    // Click 3 (slide rack)
    this.playClick(t + 0.7, 850, 0.09);
  }

  private playClick(time: number, freq: number, dur: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + dur);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  // Knife swipe
  public playKnife() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Zombie groan / growl
  public playZombieGrowl() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const baseFreq = 80 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq - 15, t + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  // Zombie death squelch
  public playZombieHit(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHeadshot ? 450 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(isHeadshot ? 0.35 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);

    if (isHeadshot) {
      // Satisfying headshot crunch
      const pop = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      pop.type = 'square';
      pop.frequency.setValueAtTime(750, t);
      pop.frequency.exponentialRampToValueAtTime(150, t + 0.08);
      popGain.gain.setValueAtTime(0.2, t);
      popGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      pop.connect(popGain);
      popGain.connect(this.sfxGain);
      pop.start(t);
      pop.stop(t + 0.09);
    }
  }

  // Zombie attack swing
  public playZombieAttack() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.21);
  }

  // Round start spooky chord
  public playRoundStart() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Atmospheric bell chime (sine waves instead of harsh sawtooth)
    const notes = [261.63, 311.13, 392.00, 493.88]; // C4, Eb4, G4, B4
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.15);

      gain.gain.setValueAtTime(0.001, t + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.15 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.15 + 1.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.15);
      osc.stop(t + idx * 0.15 + 1.7);
    });

    // Gentle low gong
    const gong = this.ctx.createOscillator();
    const gongFilter = this.ctx.createBiquadFilter();
    const gongGain = this.ctx.createGain();
    
    gong.type = 'triangle';
    gong.frequency.setValueAtTime(110, t);
    gong.frequency.exponentialRampToValueAtTime(45, t + 2.0);

    gongFilter.type = 'lowpass';
    gongFilter.frequency.setValueAtTime(350, t);

    gongGain.gain.setValueAtTime(0.18, t);
    gongGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    gong.connect(gongFilter);
    gongFilter.connect(gongGain);
    gongGain.connect(this.sfxGain);
    gong.start(t);
    gong.stop(t + 2.3);
  }

  // Mystery Box jingle
  public playMysteryBoxSpin() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Fast ticking roulette sound
    for (let i = 0; i < 22; i++) {
      const tickTime = t + i * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 25, tickTime);
      gain.gain.setValueAtTime(0.15, tickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, tickTime + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(tickTime);
      osc.stop(tickTime + 0.06);
    }
  }

  public playMysteryBoxReady() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavenly chord
    [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 1.25);
    });
  }

  public playTeddyLaugh() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Demonic high pitched laugh "Hehehehe"
    for (let i = 0; i < 5; i++) {
      const laughTime = t + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700 - i * 40, laughTime);
      osc.frequency.linearRampToValueAtTime(500 - i * 40, laughTime + 0.1);
      gain.gain.setValueAtTime(0.25, laughTime);
      gain.gain.exponentialRampToValueAtTime(0.01, laughTime + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(laughTime);
      osc.stop(laughTime + 0.13);
    }
  }

  // Perk drinking
  public playPerkDrink() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Bottle cap open pop
    this.playClick(t, 1200, 0.05);

    // Gulp sounds
    for (let i = 1; i <= 3; i++) {
      const gulpTime = t + i * 0.2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, gulpTime);
      osc.frequency.exponentialRampToValueAtTime(180, gulpTime + 0.1);
      gain.gain.setValueAtTime(0.22, gulpTime);
      gain.gain.exponentialRampToValueAtTime(0.01, gulpTime + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(gulpTime);
      osc.stop(gulpTime + 0.13);
    }

    // Energizing chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(587.33, t + 0.8);
    chime.frequency.setValueAtTime(880, t + 1.0);
    chimeGain.gain.setValueAtTime(0.2, t + 0.8);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 1.4);
    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start(t + 0.8);
    chime.stop(t + 1.45);
  }

  // Power switch
  public playPowerOn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavy mechanical lever thunk
    const clank = this.ctx.createOscillator();
    const clankGain = this.ctx.createGain();
    clank.type = 'square';
    clank.frequency.setValueAtTime(250, t);
    clank.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    clankGain.gain.setValueAtTime(0.4, t);
    clankGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    clank.connect(clankGain);
    clankGain.connect(this.sfxGain);
    clank.start(t);
    clank.stop(t + 0.21);

    // Generator electric hum surge
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(60, t + 0.1);
    hum.frequency.exponentialRampToValueAtTime(220, t + 1.5);
    humGain.gain.setValueAtTime(0.01, t + 0.1);
    humGain.gain.linearRampToValueAtTime(0.3, t + 0.6);
    humGain.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
    hum.connect(humGain);
    humGain.connect(this.sfxGain);
    hum.start(t + 0.1);
    hum.stop(t + 2.1);
  }

  // Pack a punch machine upgrade
  public playPackAPunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Upward swirling synth arpeggio
    const freqs = [220, 277, 329, 440, 554, 659, 880];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      const time = t + idx * 0.1;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  // Nuke detonation
  public playNuke() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Huge explosion roar
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.8);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 2.1);
  }

  // Power up pickup
  public playPowerUp() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      const time = t + idx * 0.08;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(time);
      osc.stop(time + 0.26);
    });
  }

  // Points buy / pickup clink
  public playPointsClink() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Rebuilding barricade board
  public playHammerBoard() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Heartbeat when low health
  public updateHeartbeat(isLowHealth: boolean) {
    if (this.isMuted || !isLowHealth) {
      if (this.lowHealthOsc) {
        try {
          this.lowHealthOsc.stop();
          this.lowHealthOsc.disconnect();
        } catch {}
        this.lowHealthOsc = null;
        this.lowHealthGain = null;
      }
      return;
    }

    if (!this.lowHealthOsc && this.ctx && this.sfxGain) {
      const t = this.ctx.currentTime;
      this.lowHealthOsc = this.ctx.createOscillator();
      this.lowHealthGain = this.ctx.createGain();
      this.lowHealthOsc.type = 'sine';
      this.lowHealthOsc.frequency.setValueAtTime(55, t);
      this.lowHealthGain.gain.setValueAtTime(0.25, t);

      this.lowHealthOsc.connect(this.lowHealthGain);
      this.lowHealthGain.connect(this.sfxGain);
      this.lowHealthOsc.start(t);
    }
  }
}

export const soundEngine = new SoundEngine();
