import type { Device } from '@networkman/shared';

/**
 * Canonical device categories shared across views. The map view renders an
 * elaborate pixel-art icon per type; the detail view renders a flat status-tinted
 * icon. Both rely on the single classifier below so the matching rules never drift.
 */
export type DeviceType =
  | 'router'
  | 'switch'
  | 'server'
  | 'printer'
  | 'phone'
  | 'computer';

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  router: 'Router',
  switch: 'Switch',
  server: 'Server',
  printer: 'Printer',
  phone: 'Phone',
  computer: 'Computer',
};

export function deviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_LABELS[type];
}

/**
 * Classify a device from its hostname/name/IP. Returns `null` when nothing
 * matches, letting each view choose its own fallback (a generic hut on the map,
 * an "unknown" badge in the detail panel).
 */
export function classifyDevice(device: Pick<Device, 'hostname' | 'name' | 'ip'>): DeviceType | null {
  const combined = `${device.hostname ?? ''} ${device.name ?? ''}`.toLowerCase();
  const ip = device.ip ?? '';

  if (/router|gateway|gw/.test(combined) || /\.1$/.test(ip)) return 'router';
  if (/switch/.test(combined)) return 'switch';
  if (/server|srv|nas|dc\d/.test(combined)) return 'server';
  if (/printer|prn|print/.test(combined)) return 'printer';
  if (/phone|iphone|android|voip|mobile/.test(combined)) return 'phone';
  if (/pc|desktop|laptop|workstation/.test(combined)) return 'computer';
  return null;
}
