import { getState } from "./store";

// Interface sounds synthesized with Web Audio: no files to download.
// Nothing plays until the visitor turns sound on.
let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, length: number, gain: number, type: OscillatorType = "sine", slide = 0.6) {
  if (!getState().sound) return;
  const a = audio();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * slide, a.currentTime + length);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + length);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + length + 0.02);
}

export const sound = {
  /** Timeline scrub tick. */
  tick: () => tone(3200, 0.025, 0.01, "square", 0.9),
  /** Hover on something clickable. */
  hover: () => tone(1400, 0.05, 0.012, "triangle"),
  /** Click / confirm: two rising notes. */
  confirm: () => {
    tone(520, 0.1, 0.03, "sine", 1.2);
    setTimeout(() => tone(780, 0.14, 0.025, "sine", 1.1), 60);
  },
  /** Low swoosh for big transitions. */
  whoosh: () => tone(140, 0.55, 0.035, "sawtooth", 0.4),
};
