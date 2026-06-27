let _muted = typeof window !== "undefined" && localStorage.getItem("geo_muted") === "true";
let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return _ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.3) {
  if (_muted || typeof window === "undefined") return;
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  } catch { /* ignore */ }
}

export const soundManager = {
  get muted() { return _muted; },

  setMuted(val: boolean) {
    _muted = val;
    if (typeof window !== "undefined") localStorage.setItem("geo_muted", String(val));
  },

  toggleMute() {
    soundManager.setMuted(!_muted);
    return _muted;
  },

  init() {},

  playBeep() {
    tone(880, 0.1, "square", 0.2);
  },

  playCorrect() {
    // ascending two-tone chime
    tone(523, 0.15, "sine", 0.35);
    setTimeout(() => tone(784, 0.2, "sine", 0.35), 120);
  },

  playWrong() {
    // descending buzzer
    tone(300, 0.1, "sawtooth", 0.25);
    setTimeout(() => tone(200, 0.15, "sawtooth", 0.25), 80);
  },
};
