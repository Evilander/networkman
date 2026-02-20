import { create } from 'zustand';
import type { Alert } from '@networkman/shared';

interface AlertState {
  alerts: Alert[];
  naviQueue: Alert[];
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  popNaviQueue: () => Alert | undefined;
  clearNaviQueue: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  naviQueue: [],

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 500),
      naviQueue: alert.severity === 'critical' || alert.severity === 'warning'
        ? [...state.naviQueue, alert]
        : state.naviQueue,
    })),

  acknowledgeAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alert.id ? alert : a)),
    })),

  setAlerts: (alerts) => set({ alerts }),

  popNaviQueue: () => {
    const queue = get().naviQueue;
    if (queue.length === 0) return undefined;
    const [first, ...rest] = queue;
    set({ naviQueue: rest });
    return first;
  },

  clearNaviQueue: () => set({ naviQueue: [] }),
}));
