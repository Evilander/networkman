import type { Device, DeviceStatus } from './device.js';
import type { Alert } from './alert.js';
import type { NetworkMetrics } from './metrics.js';

export interface ServerToClientEvents {
  'devices:list': (devices: Device[]) => void;
  'device:updated': (device: Device) => void;
  'device:status-changed': (payload: {
    deviceId: string;
    previousStatus: DeviceStatus;
    newStatus: DeviceStatus;
    device: Device;
  }) => void;
  'device:discovered': (device: Device) => void;
  'alert:new': (alert: Alert) => void;
  'alert:acknowledged': (alert: Alert) => void;
  'metrics:update': (metrics: NetworkMetrics[]) => void;
  'scan:progress': (payload: {
    scanned: number;
    total: number;
    currentIp: string;
    found: number;
    elapsed: number;
    estimatedRemaining: number;
  }) => void;
  'scan:complete': (payload: {
    devicesFound: number;
    newDevices: number;
    duration: number;
  }) => void;
}

export interface ClientToServerEvents {
  'devices:request-list': () => void;
  'metrics:subscribe': (deviceId: string) => void;
  'metrics:unsubscribe': (deviceId: string) => void;
  'scan:trigger': () => void;
  'alert:acknowledge': (alertId: string) => void;
}
