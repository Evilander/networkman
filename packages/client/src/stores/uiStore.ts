import { create } from 'zustand';

type SidebarPanel = 'inventory' | 'alerts' | 'settings' | 'detail';

interface ScanProgress {
  scanned: number;
  total: number;
  currentIp: string;
  found: number;
  elapsed: number;
  estimatedRemaining: number;
}

interface UIState {
  soundEnabled: boolean;
  sidebarPanel: SidebarPanel;
  sidebarOpen: boolean;
  scanProgress: ScanProgress | null;
  toggleSound: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleSidebar: () => void;
  setScanProgress: (progress: ScanProgress | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  sidebarPanel: 'inventory',
  sidebarOpen: true,
  scanProgress: null,

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel, sidebarOpen: true }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setScanProgress: (progress) => set({ scanProgress: progress }),
}));
