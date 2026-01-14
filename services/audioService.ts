
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, sweepFreq?: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (sweepFreq) {
      osc.frequency.exponentialRampToValueAtTime(sweepFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playJump() {
    this.playTone(150, 'square', 0.2, 0.05, 600);
  }

  playHit() {
    this.playTone(100, 'triangle', 0.1, 0.15);
  }

  playStomp() {
    this.playTone(200, 'square', 0.1, 0.1, 50);
  }

  playCorrect() {
    const now = this.ctx?.currentTime || 0;
    // Arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.1, 0.05), i * 100);
    });
  }

  playIncorrect() {
    const now = this.ctx?.currentTime || 0;
    // Falling dissonant notes
    [200, 150, 100].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.2, 0.05), i * 150);
    });
  }

  playSuccess() {
    // Fanfare
    [523.25, 392.00, 523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.15, 0.05), i * 150);
    });
  }
}

export const audioService = new AudioService();
