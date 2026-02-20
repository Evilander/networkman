export interface NetworkMetrics {
  id: string;
  deviceId: string;
  timestamp: string;
  latency: number | null;
  packetLoss: number;
  bandwidth: number | null;
  pingSuccessCount: number;
  pingTotalCount: number;
}

export interface MetricsQuery {
  deviceId: string;
  from: string;
  to: string;
  interval?: number;
}

export interface MetricsAggregated {
  deviceId: string;
  timestamp: string;
  avgLatency: number | null;
  maxLatency: number | null;
  minLatency: number | null;
  avgPacketLoss: number;
  avgBandwidth: number | null;
}
