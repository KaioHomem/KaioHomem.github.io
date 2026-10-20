// One motion language for the whole site, like a shared preset in After Effects.
// Every tween reads its timing and easing from here.

export const duration = {
  fast: 0.3,
  base: 0.65,
  slow: 1.05,
  cinematic: 1.7,
} as const;

export const ease = {
  out: "expo.out",
  inOut: "expo.inOut",
  soft: "power3.out",
  exit: "power2.in",
  // A slight overshoot, like an AE "ease and wizz" back-out.
  punch: "back.out(1.6)",
} as const;

export const stagger = {
  letters: 0.028,
  lines: 0.09,
  items: 0.07,
} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Frames per second of the timecode in the HUD. */
export const FPS = 24;

/** 00:00:00:00 from a time in seconds. */
export function timecode(seconds: number) {
  const total = Math.max(0, Math.floor(seconds * FPS));
  const f = total % FPS;
  const s = Math.floor(total / FPS) % 60;
  const m = Math.floor(total / (FPS * 60)) % 60;
  const h = Math.floor(total / (FPS * 3600));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
}

/**
 * Font size that keeps the longest word of a display line inside its column.
 * `span` is the column width in vw (kept a little under the real width); wide Archivo
 * needs roughly 0.85-0.9em per character.
 */
export function fitSize(text: string | string[], max: string, span = 86) {
  const longest = Math.max(4, ...(Array.isArray(text) ? text : [text]).flatMap((t) => t.split(/\s+/)).map((w) => w.length));
  return `min(${max}, ${(span / (longest * 0.85)).toFixed(2)}vw)`;
}
