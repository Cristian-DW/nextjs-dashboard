'use client';

import { useEffect, useCallback, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

/**
 * useBarcodeScanner
 *
 * Detects physical barcode scanner input (USB/Bluetooth HID).
 * Scanners work like a keyboard that types very fast (< 30ms between keystrokes)
 * and sends an Enter at the end. This hook intercepts that pattern globally
 * so the cashier never needs to click anything — just scan and the product
 * is added to the cart automatically.
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxIntervalMs = 50,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = '';
    if (code.length >= minLength) {
      onScan(code);
    }
  }, [minLength, onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is inside a regular input (typing normally)
      const target = e.target as HTMLElement;
      const isTypingInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow barcode scanner to override even inside inputs — scanners are
      // characterised by inter-key interval < maxIntervalMs
      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      const isFastTyping = interval < maxIntervalMs;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          // Cancel any pending flush timer
          if (timerRef.current) clearTimeout(timerRef.current);
          flush();
          // Prevent the Enter from submitting forms
          if (isFastTyping) e.preventDefault();
        }
        return;
      }

      // Only accumulate printable single characters from fast typing
      if (e.key.length === 1 && (isFastTyping || bufferRef.current.length > 0)) {
        bufferRef.current += e.key;

        // Safety: auto-flush after 100ms of silence (handles scanners that don't send Enter)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          flush();
        }, 100);
      } else if (!isFastTyping) {
        // User is typing manually → reset buffer
        bufferRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, flush, maxIntervalMs, minLength]);
}
