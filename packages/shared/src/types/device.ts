export type DeviceStatus = 'online' | 'degraded' | 'offline' | 'unknown';

export interface DeviceMapPosition {
  x: number;
  y: number;
  region?: string;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
  hostname: string | null;
  status: DeviceStatus;
  latency: number | null;
  packetLoss: number | null;
  lastSeen: string | null;
  firstDiscovered: string;
  mapPosition: DeviceMapPosition | null;
  heartCount: number;
  tags: string[];
  isManual: boolean;
}

export interface DeviceCreateInput {
  name: string;
  ip: string;
  mac?: string | null;
  hostname?: string | null;
  mapPosition?: DeviceMapPosition | null;
  tags?: string[];
}

export interface DeviceUpdateInput {
  name?: string;
  mapPosition?: DeviceMapPosition | null;
  tags?: string[];
  isManual?: boolean;
}
