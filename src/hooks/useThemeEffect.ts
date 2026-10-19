import { useEffect } from 'react';
import { useStore } from '../state/store';

export function useThemeEffect() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070b14' : '#f4f6fb');
  }, [theme]);
}
