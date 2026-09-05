/**
 * Every sound in the room is synthesised on the fly — no audio files, so the
 * page stays small and nothing has to load before you can walk around.
 *
 * The AudioContext is created on the first sound, which is always downstream of
 * a key press or a tap, so browsers let it start.
 */

export type Surface = "floor" | "rug";

type Options = { volume: number; enabled: boolean };

export type RoomAudio = {
  setOptions: (options: Options) => void;
  step: (surface: Surface) => void;
  bump: (strength: number) => void;
  catchBug: () => void;
  pour: () => void;
  sip: () => void;
  /** Running water for as long as the cup is being filled. Returns a stopper. */
  startStream: () => () => void;
  confirm: () => void;
  toggleSwitch: (on: boolean) => void;
  dispose: () => void;
};

export function createAudio(initial: Options): RoomAudio {
  let options = initial;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  /** Alternates so left and right footfalls are not identical. */
  let stepParity = 0;

  function ensure(): AudioContext | null {
    if (!options.enabled || options.volume <= 0) return null;
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = options.volume;
      master.connect(ctx.destination);

      // One second of white noise, reused by every noise-based sound.
      const frames = ctx.sampleRate;
      noise = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    }
    // Autoplay policy can still refuse; a silent room is better than a throw.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function noiseBurst(
    at: AudioContext,
    when: number,
    duration: number,
    filter: { type: BiquadFilterType; frequency: number; q: number },
    peak: number,
  ) {
    if (!noise || !master) return;
    const src = at.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    // A random offset keeps repeated footsteps from sounding like a loop.
    const offset = Math.random() * 0.9;

    const band = at.createBiquadFilter();
    band.type = filter.type;
    band.frequency.value = filter.frequency;
    band.Q.value = filter.q;

    const gain = at.createGain();
    const attack = Math.min(0.005, duration * 0.3);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    src.connect(band).connect(gain).connect(master);
    src.start(when, offset, duration + 0.05);
    src.stop(when + duration + 0.05);
  }

  function tone(
    at: AudioContext,
    when: number,
    from: number,
    to: number,
    duration: number,
    peak: number,
    type: OscillatorType = "sine",
  ) {
    if (!master) return;
    const osc = at.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, when + duration);

    const gain = at.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(gain).connect(master);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  return {
    setOptions(next) {
      options = next;
      if (master) master.gain.value = next.enabled ? next.volume : 0;
      if (!next.enabled && ctx && ctx.state === "running") ctx.suspend().catch(() => {});
    },

    // Footsteps repeat far more than anything else here, so they sit a few dB
    // under the one-off sounds to stay in the background.
    step(surface) {
      const at = ensure();
      if (!at) return;
      const when = at.currentTime;
      stepParity ^= 1;
      const detune = stepParity ? 1 : 0.86;

      if (surface === "rug") {
        // Muffled: no click, just a soft low thud.
        noiseBurst(at, when, 0.1, { type: "lowpass", frequency: 520 * detune, q: 0.9 }, 0.065);
        tone(at, when, 96 * detune, 62, 0.08, 0.026);
      } else {
        // Hard floor. A narrow bandpass up at 1.75kHz rang like a tick and got
        // tiring within a few paces, so this is a broad, low tap instead: the
        // bulk of the energy under 1kHz with no resonance to ring, a very quiet
        // sliver of grit on top for the hard surface, and a short body knock.
        // Each footfall is jittered so a walk never sounds looped.
        const vary = 0.88 + Math.random() * 0.24;
        noiseBurst(at, when, 0.042, { type: "lowpass", frequency: 880 * detune * vary, q: 0.6 }, 0.048);
        noiseBurst(at, when, 0.011, { type: "highpass", frequency: 3400, q: 0.4 }, 0.01);
        tone(at, when, 124 * detune * vary, 72, 0.032, 0.021, "triangle");
      }
    },

    bump(strength) {
      const at = ensure();
      if (!at) return;
      const peak = Math.min(0.14, 0.03 + strength * 0.1);
      tone(at, at.currentTime, 210, 110, 0.1, peak, "triangle");
      noiseBurst(
        at,
        at.currentTime,
        0.05,
        { type: "lowpass", frequency: 900, q: 0.7 },
        peak * 0.5,
      );
    },

    catchBug() {
      const at = ensure();
      if (!at) return;
      const t0 = at.currentTime;
      tone(at, t0, 620, 880, 0.08, 0.07, "triangle");
      tone(at, t0 + 0.07, 900, 1320, 0.12, 0.06, "triangle");
    },

    pour() {
      const at = ensure();
      if (!at) return;
      const t0 = at.currentTime;
      noiseBurst(at, t0, 0.42, { type: "bandpass", frequency: 1200, q: 0.7 }, 0.06);
      tone(at, t0 + 0.05, 420, 700, 0.34, 0.03, "sine");
    },

    startStream() {
      const at = ensure();
      if (!at || !noise || !master) return () => {};
      const src = at.createBufferSource();
      src.buffer = noise;
      src.loop = true;

      const band = at.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1100;
      band.Q.value = 0.8;

      const gain = at.createGain();
      const t0 = at.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.12);

      // A slow wobble so it reads as pouring rather than as static.
      const lfo = at.createOscillator();
      lfo.frequency.value = 5.5;
      const lfoGain = at.createGain();
      lfoGain.gain.value = 240;
      lfo.connect(lfoGain).connect(band.frequency);

      src.connect(band).connect(gain).connect(master);
      src.start();
      lfo.start();

      let stopped = false;
      return () => {
        if (stopped) return;
        stopped = true;
        const now = at.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        src.stop(now + 0.16);
        lfo.stop(now + 0.16);
      };
    },

    confirm() {
      const at = ensure();
      if (!at) return;
      const t0 = at.currentTime;
      tone(at, t0, 520, 780, 0.1, 0.05, "sine");
      tone(at, t0 + 0.09, 780, 1040, 0.14, 0.04, "sine");
    },

    toggleSwitch(on) {
      const at = ensure();
      if (!at) return;
      const t0 = at.currentTime;
      // A rocker makes two transients a few milliseconds apart: the spring
      // snapping over, then the rocker landing against the housing. Flicking
      // off is the duller of the two.
      const snap = on ? 3600 : 3000;
      noiseBurst(at, t0, 0.011, { type: "bandpass", frequency: snap, q: 1.8 }, 0.2);
      noiseBurst(at, t0 + 0.015, 0.022, { type: "bandpass", frequency: snap * 0.5, q: 1.2 }, 0.12);
      // Hollow plastic body under the click, short enough to read as a knock.
      tone(at, t0 + 0.01, on ? 220 : 175, on ? 118 : 92, 0.032, 0.07, "triangle");
    },

    sip() {
      const at = ensure();
      if (!at) return;
      const t0 = at.currentTime;
      // Three swallows, each a little lower than the last.
      for (let i = 0; i < 3; i++) {
        const when = t0 + i * 0.19;
        noiseBurst(at, when, 0.07, { type: "lowpass", frequency: 720 - i * 90, q: 0.9 }, 0.05);
        tone(at, when, 195 - i * 24, 118 - i * 14, 0.09, 0.05, "sine");
      }
    },

    dispose() {
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
      master = null;
      noise = null;
    },
  };
}
