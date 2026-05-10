import { useSyncExternalStore } from 'react';

// Spec: ≥1920=desktop(三栏) | 1440-1919=wide(图标侧栏) | 1024-1439=medium(底部抽屉) | <1024=narrow

export type LayoutBreakpoint = 'narrow' | 'medium' | 'wide' | 'desktop';

function resolve(): LayoutBreakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w >= 1920) return 'desktop';
  if (w >= 1440) return 'wide';
  if (w >= 1024) return 'medium';
  return 'narrow';
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
}

export function useBreakpoint(): LayoutBreakpoint {
  return useSyncExternalStore(subscribe, resolve, () => 'narrow');
}

export function useIsDesktop(): boolean {
  return useBreakpoint() === 'desktop';
}

export function useLeftIconOnly(): boolean {
  const bp = useBreakpoint();
  return bp === 'wide' || bp === 'medium' || bp === 'narrow';
}

export function useRightDrawer(): boolean {
  const bp = useBreakpoint();
  return bp === 'medium' || bp === 'narrow';
}
