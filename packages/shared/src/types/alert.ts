export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'device_down'
  | 'device_recovered'
  | 'high_latency'
  | 'packet_loss'
  | 'new_device_discovered'
  | 'threshold_breach';

export interface Alert {
  id: string;
  deviceId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface AlertAcknowledgeInput {
  alertId: string;
}
