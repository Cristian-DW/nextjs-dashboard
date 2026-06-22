'use client';

import { useCallback, useRef } from 'react';

type ToneType = 'scan' | 'error' | 'checkout' | 'keypress';

/**
 * usePOSAudio
 *
 * Synthesises POS sounds using the Web Audio API.
 * No audio files needed — all tones are generated in real-time.
 * - 'scan'     → short high beep (product added / scanner recognised)
 * - 'error'    → two low descending beeps (product not found / out of stock)
 * - 'checkout' → upward cha-ching melody (sale completed)
 * - 'keypress' → tiny soft click (optional tactile feedback)
 */
export function usePOSAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(
    (
      frequency: number,
      duration: number,
      delay = 0,
      type: OscillatorType = 'sine',
      gain = 0.4
    ) => {
      const ctx = getCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

      // Smooth envelope to avoid clicking artifacts
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    },
    [getCtx]
  );

  const play = useCallback(
    (type: ToneType) => {
      switch (type) {
        case 'scan':
          // Single bright beep — product scanned
          beep(1320, 0.08, 0, 'square', 0.3);
          break;

        case 'error':
          // Double descending beep — error / not found
          beep(400, 0.15, 0, 'sawtooth', 0.35);
          beep(280, 0.2, 0.2, 'sawtooth', 0.35);
          break;

        case 'checkout':
          // Upward 3-note cha-ching melody — sale completed
          beep(880, 0.12, 0, 'sine', 0.4);
          beep(1100, 0.12, 0.13, 'sine', 0.4);
          beep(1320, 0.25, 0.26, 'sine', 0.5);
          break;

        case 'keypress':
          // Subtle soft tick — optional button feedback
          beep(800, 0.03, 0, 'sine', 0.1);
          break;
      }
    },
    [beep]
  );

  return { play };
}
