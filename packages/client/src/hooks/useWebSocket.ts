import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@networkman/shared';
import { useDeviceStore } from '../stores/deviceStore';
import { useAlertStore } from '../stores/alertStore';
import { useMetricsStore } from '../stores/metricsStore';
import { useUIStore } from '../stores/uiStore';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useWebSocket() {
  const socketRef = useRef<TypedSocket | null>(null);

  const setDevices = useDeviceStore((s) => s.setDevices);
  const updateDevice = useDeviceStore((s) => s.updateDevice);
  const addDevice = useDeviceStore((s) => s.addDevice);
  const addAlert = useAlertStore((s) => s.addAlert);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);
  const updateMetrics = useMetricsStore((s) => s.updateMetrics);
  const setScanProgress = useUIStore((s) => s.setScanProgress);

  useEffect(() => {
    const socket: TypedSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('devices:request-list');
    });

    socket.on('devices:list', setDevices);
    socket.on('device:updated', updateDevice);
    socket.on('device:discovered', addDevice);
    socket.on('device:status-changed', (payload) => updateDevice(payload.device));
    socket.on('alert:new', addAlert);
    socket.on('alert:acknowledged', acknowledgeAlert);
    socket.on('metrics:update', updateMetrics);
    socket.on('scan:progress', (progress) => setScanProgress(progress));
    socket.on('scan:complete', () => setScanProgress(null));

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef;
}
