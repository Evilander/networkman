import { create } from 'zustand';
import type { NetworkMetrics } from '@networkman/shared';

interface MetricsState {
  latestByDevice: Map<string, NetworkMetrics>;
  updateMetrics: (metrics: NetworkMetrics[]) => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  latestByDevice: new Map(),

  updateMetrics: (metrics) =>
    set((state) => {
      const next = new Map(state.latestByDevice);
      for (const m of metrics) {
        next.set(m.deviceId, m);
      }
      return { latestByDevice: next };
    }),
}));
