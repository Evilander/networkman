import { useCallback, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';

const SOUNDS = {
  naviHey: '/audio/navi-hey-listen.mp3',
  naviWatchOut: '/audio/navi-watch-out.mp3',
  menuSelect: '/audio/menu-select.mp3',
  heartWarning: '/audio/heart-warning.mp3',
  itemGet: '/audio/item-get.mp3',
  secretFound: '/audio/secret-found.mp3',
} as const;

type SoundName = keyof typeof SOUNDS;

export function useSound() {
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = useCallback((name: SoundName) => {
    if (!soundEnabled) return;

    const src = SOUNDS[name];
    let audio = audioCache.current.get(src);

    if (!audio) {
      audio = new Audio(src);
      audioCache.current.set(src, audio);
    }

    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silently fail if autoplay blocked
    });
  }, [soundEnabled]);

  return { play, sounds: SOUNDS };
}
