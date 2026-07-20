'use client';

import { useEffect } from 'react';

export default function HapticProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 建立 Web Audio API 用於極輕微的實體按鈕點擊音效 (微頻聲響，猶如硬體開關按壓)
    let audioCtx: AudioContext | null = null;

    const playClickSound = () => {
      try {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        }
        if (audioCtx && audioCtx.state === 'running') {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);

          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.03);
        }
      } catch (e) {
        // 忽略 AudioContext 限制
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 檢查點擊的目標是否為按鈕、連結或可點擊元素
      const clickable = target.closest('button, a, input[type="submit"], input[type="button"], [role="button"], label');

      if (clickable) {
        // 1. 觸發手機硬體震動回饋 (Haptic Vibration)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12); // 輕微的 12ms 硬體開關切換震動
          } catch (err) {}
        }

        // 2. 觸發微小的觸感點擊音效
        playClickSound();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, []);

  return <>{children}</>;
}
