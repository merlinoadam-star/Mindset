/**
 * Ambient audio generator — produces calming soundscapes on the fly
 * using the Web Audio API. No audio files, no CDN, no network cost.
 *
 * Three modes:
 *   "off"    — silence
 *   "calm"   — soft brown noise + low sine drone (meditative)
 *   "ocean"  — filtered noise with slow LFO modulation (wave swells)
 *   "forest" — bright pink noise + airy overtones (outdoorsy)
 *
 * Usage:
 *   startAmbient("ocean");
 *   setAmbientVolume(0.6);
 *   stopAmbient();  // fades out, then disposes
 *
 * Designed as a module-level singleton so at most one soundscape plays
 * at a time, even if multiple components try to drive it.
 */

export type AmbientMode = "off" | "calm" | "ocean" | "forest";

const AMBIENT_MODES: AmbientMode[] = ["off", "calm", "ocean", "forest"];

export function nextAmbientMode(current: AmbientMode): AmbientMode {
  const idx = AMBIENT_MODES.indexOf(current);
  return AMBIENT_MODES[(idx + 1) % AMBIENT_MODES.length];
}

export const AMBIENT_LABELS: Record<AmbientMode, string> = {
  off: "Silent",
  calm: "Calm",
  ocean: "Ocean",
  forest: "Forest",
};

export const AMBIENT_EMOJI: Record<AmbientMode, string> = {
  off: "🔇",
  calm: "🌙",
  ocean: "🌊",
  forest: "🌲",
};

interface AmbientHandle {
  mode: AmbientMode;
  ctx: AudioContext;
  master: GainNode;
  nodes: AudioNode[];
  sources: Array<{ start: () => void; stop: () => void }>;
}

let current: AmbientHandle | null = null;
let currentVolume = 0.5;

/** Generate a short noise buffer that we loop via an AudioBufferSourceNode. */
function makeNoiseBuffer(
  ctx: AudioContext,
  durationSec: number,
  color: "white" | "brown" | "pink"
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (color === "brown") {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    // pink noise via Paul Kellet's approximation
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

function fadeTo(
  gain: GainNode,
  target: number,
  ctx: AudioContext,
  durationSec = 0.8
) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(target, now + durationSec);
}

function buildCalm(ctx: AudioContext, master: GainNode): AmbientHandle {
  const noiseBuf = makeNoiseBuffer(ctx, 2, "brown");
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 400;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.35;

  noise.connect(lowpass).connect(noiseGain).connect(master);

  // Low drone — a soft sine at ~110 Hz
  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 110;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.06;
  drone.connect(droneGain).connect(master);

  return {
    mode: "calm",
    ctx,
    master,
    nodes: [lowpass, noiseGain, droneGain],
    sources: [
      { start: () => noise.start(), stop: () => noise.stop() },
      { start: () => drone.start(), stop: () => drone.stop() },
    ],
  };
}

function buildOcean(ctx: AudioContext, master: GainNode): AmbientHandle {
  const noiseBuf = makeNoiseBuffer(ctx, 4, "pink");
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.0;

  // LFO modulates noiseGain for the "wave swell" effect (~10 sec period)
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  lfo.type = "sine";
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.2;
  lfo.connect(lfoGain).connect(noiseGain.gain);
  noiseGain.gain.value = 0.28;

  noise.connect(lowpass).connect(noiseGain).connect(master);

  return {
    mode: "ocean",
    ctx,
    master,
    nodes: [lowpass, noiseGain, lfoGain],
    sources: [
      { start: () => noise.start(), stop: () => noise.stop() },
      { start: () => lfo.start(), stop: () => lfo.stop() },
    ],
  };
}

function buildForest(ctx: AudioContext, master: GainNode): AmbientHandle {
  const noiseBuf = makeNoiseBuffer(ctx, 2, "pink");
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 800;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 4500;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.2;

  noise
    .connect(highpass)
    .connect(lowpass)
    .connect(noiseGain)
    .connect(master);

  // Shimmer — a very quiet mid-high sine
  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 2200;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.01;
  shimmer.connect(shimmerGain).connect(master);

  return {
    mode: "forest",
    ctx,
    master,
    nodes: [highpass, lowpass, noiseGain, shimmerGain],
    sources: [
      { start: () => noise.start(), stop: () => noise.stop() },
      { start: () => shimmer.start(), stop: () => shimmer.stop() },
    ],
  };
}

/** Start (or switch to) an ambient soundscape. No-op for "off". */
export async function startAmbient(mode: AmbientMode): Promise<void> {
  if (typeof window === "undefined") return;
  if (mode === "off") {
    await stopAmbient();
    return;
  }

  // If already playing this mode, leave it alone.
  if (current && current.mode === mode) return;

  await stopAmbient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC: typeof AudioContext =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    // Some browsers start suspended until a user gesture — caller should
    // invoke this from inside a click handler.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    let handle: AmbientHandle;
    if (mode === "calm") handle = buildCalm(ctx, master);
    else if (mode === "ocean") handle = buildOcean(ctx, master);
    else handle = buildForest(ctx, master);

    for (const s of handle.sources) s.start();

    current = handle;
    fadeTo(master, currentVolume, ctx, 1.2);
  } catch (err) {
    console.warn("ambient audio failed to start", err);
  }
}

/** Stop the current soundscape with a short fade. */
export async function stopAmbient(): Promise<void> {
  if (!current) return;
  const handle = current;
  current = null;
  const fadeSec = 0.6;
  fadeTo(handle.master, 0, handle.ctx, fadeSec);
  await new Promise((r) => setTimeout(r, fadeSec * 1000));
  try {
    for (const s of handle.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    await handle.ctx.close();
  } catch {
    /* ignore */
  }
}

export function setAmbientVolume(volume: number): void {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (current) {
    fadeTo(current.master, currentVolume, current.ctx, 0.3);
  }
}

export function getCurrentMode(): AmbientMode {
  return current?.mode ?? "off";
}
