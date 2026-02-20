import { create } from 'zustand';
import type { Device } from '@networkman/shared';

interface DeviceState {
  devices: Map<string, Device>;
  selectedDeviceId: string | null;
  setDevices: (devices: Device[]) => void;
  updateDevice: (device: Device) => void;
  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  selectDevice: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: new Map(),
  selectedDeviceId: null,

  setDevices: (devices) =>
    set({ devices: new Map(devices.map((d) => [d.id, d])) }),

  updateDevice: (device) =>
    set((state) => {
      const next = new Map(state.devices);
      next.set(device.id, device);
      return { devices: next };
    }),

  addDevice: (device) =>
    set((state) => {
      const next = new Map(state.devices);
      next.set(device.id, device);
      return { devices: next };
    }),

  removeDevice: (id) =>
    set((state) => {
      const next = new Map(state.devices);
      next.delete(id);
      return { devices: next, selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId };
    }),

  selectDevice: (id) => set({ selectedDeviceId: id }),
}));
