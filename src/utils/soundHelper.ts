// Web Audio API Synthesizer for SnapJigsaw Sound Effects
// This ensures offline capability and requires no external asset downloads.

// Older Safari/iOS only exposes AudioContext under the vendor-prefixed name.
interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a clean electronic countdown beep sound.
 */
export function playBeep(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn('AudioContext beep failed to play:', err);
  }
}

/**
 * Plays a realistic camera shutter sound (white noise click + metal snap).
 */
export function playShutter(): void {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.25; // 250ms duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Populate with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = ctx.createGain();

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Volume Envelope (clicks and decays)
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05); // quick click
    noiseGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.08); // metal return
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); // slow decay

    // Add a high-pitch metallic transient
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.04);

    oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    noiseSource.start(ctx.currentTime);
    osc.start(ctx.currentTime);

    noiseSource.stop(ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    console.warn('AudioContext shutter failed to play:', err);
  }
}

/**
 * Plays a wooden/snap tile locking confirmation sound.
 */
export function playSnap(): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Combine a sine wave with rapid frequency drop to simulate a wooden snap/pop
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // start at A4
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05); // slide down

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (err) {
    console.warn('AudioContext snap failed to play:', err);
  }
}
