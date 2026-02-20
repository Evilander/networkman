import { useCallback, useRef, useState } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { useDayNight } from '../../hooks/useDayNight';
import { MapDevice } from './MapDevice';
import { MapLegend } from './MapLegend';
import { PixelText } from '../shared/PixelText';
import styles from './HyruleMap.module.css';

/** SVG decorations for the Hyrule overworld map */
function MapDecorations() {
  return (
    <svg className={styles.decorations} viewBox="0 0 1000 600" preserveAspectRatio="none">
      {/* Death Mountain */}
      <polygon
        points="700,20 780,120 740,110 760,140 720,130 750,160 680,140 650,100 670,80"
        fill="rgba(139, 69, 20, 0.12)"
        stroke="rgba(139, 69, 20, 0.2)"
        strokeWidth="1"
      />
      {/* Mountain peak fire */}
      <circle cx="700" cy="30" r="8" fill="rgba(255, 80, 30, 0.15)" />

      {/* Hyrule Castle silhouette */}
      <g opacity="0.1" fill="var(--oot-gold-dark)">
        <rect x="440" y="40" width="8" height="30" />
        <rect x="455" y="30" width="12" height="40" />
        <rect x="475" y="35" width="8" height="35" />
        <rect x="490" y="25" width="14" height="45" />
        <rect x="510" y="35" width="8" height="35" />
        <rect x="525" y="30" width="12" height="40" />
        <rect x="545" y="40" width="8" height="30" />
        <rect x="435" y="65" width="125" height="12" />
      </g>

      {/* Zora's River flowing from top-right to Lake Hylia */}
      <path
        d="M750,180 Q700,200 650,220 Q580,260 500,320 Q400,400 300,480 Q250,510 200,530"
        fill="none"
        stroke="rgba(66, 165, 245, 0.12)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Lake Hylia */}
      <ellipse cx="200" cy="530" rx="80" ry="40" fill="rgba(66, 165, 245, 0.08)" stroke="rgba(66, 165, 245, 0.12)" strokeWidth="1" />

      {/* Kokiri Forest trees */}
      <g opacity="0.08" fill="var(--oot-green-medium)">
        <circle cx="120" cy="80" r="15" />
        <circle cx="145" cy="65" r="12" />
        <circle cx="100" cy="100" r="18" />
        <circle cx="160" cy="90" r="10" />
        <circle cx="80" cy="85" r="14" />
        <circle cx="130" cy="110" r="11" />
      </g>

      {/* Gerudo Valley canyon lines */}
      <path
        d="M800,480 L820,520 L780,540 L810,570 L790,590"
        fill="none"
        stroke="rgba(139, 69, 20, 0.15)"
        strokeWidth="3"
      />
      <path
        d="M830,480 L850,520 L810,540 L840,570 L820,590"
        fill="none"
        stroke="rgba(139, 69, 20, 0.1)"
        strokeWidth="2"
      />

      {/* Lost Woods path markers */}
      <circle cx="140" cy="140" r="3" fill="rgba(126, 200, 80, 0.2)" />
      <circle cx="155" cy="160" r="3" fill="rgba(126, 200, 80, 0.2)" />
      <circle cx="170" cy="175" r="3" fill="rgba(126, 200, 80, 0.2)" />

      {/* Lon Lon Ranch fence */}
      <rect x="420" y="280" width="100" height="60" rx="20" fill="none" stroke="rgba(161, 136, 127, 0.12)" strokeWidth="2" strokeDasharray="8 4" />
    </svg>
  );
}

export function HyruleMap() {
  const devices = useDeviceStore((s) => s.devices);
  const deviceList = Array.from(devices.values());
  const mapRef = useRef<HTMLDivElement>(null);
  const [placingDevice, setPlacingDevice] = useState<string | null>(null);
  const { tint, timeOfDay } = useDayNight();

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingDevice || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Update device position via API
    fetch(`/api/devices/${placingDevice}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapPosition: { x, y } }),
    });
    setPlacingDevice(null);
  }, [placingDevice]);

  // Auto-assign positions for devices without map positions
  const positionedDevices = deviceList.map((device, i) => {
    if (device.mapPosition) return device;
    // Auto-layout in a grid pattern
    const cols = Math.ceil(Math.sqrt(deviceList.length));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = 10 + (col / Math.max(cols - 1, 1)) * 80;
    const y = 15 + (row / Math.max(Math.ceil(deviceList.length / cols) - 1, 1)) * 70;
    return { ...device, mapPosition: { x, y } };
  });

  return (
    <div className={styles.mapContainer}>
      {/* Map title */}
      <div className={styles.title}>
        <PixelText size="xs" color="secondary">
          &#9670; Hyrule Field Network Map &#9670;
        </PixelText>
      </div>

      {/* Map area */}
      <div
        ref={mapRef}
        className={`${styles.map} ${placingDevice ? styles.placing : ''} ${styles[timeOfDay] ?? ''}`}
        onClick={handleMapClick}
      >
        {/* Day/Night overlay tint */}
        <div className={styles.dayNightOverlay} style={{ background: tint }} />

        {/* Background grid */}
        <div className={styles.grid} />

        {/* SVG Map decorations */}
        <MapDecorations />

        {/* Region labels */}
        <div className={styles.regionLabel} style={{ left: '12%', top: '10%' }}>
          <PixelText size="xs" color="secondary">Kokiri Forest</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '75%', top: '8%' }}>
          <PixelText size="xs" color="secondary">Death Mountain</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '48%', top: '5%' }}>
          <PixelText size="xs" color="secondary">Hyrule Castle</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '18%', top: '88%' }}>
          <PixelText size="xs" color="secondary">Lake Hylia</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '78%', top: '88%' }}>
          <PixelText size="xs" color="secondary">Gerudo Valley</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '45%', top: '48%' }}>
          <PixelText size="xs" color="secondary">Lon Lon Ranch</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '80%', top: '35%' }}>
          <PixelText size="xs" color="secondary">Zora's Domain</PixelText>
        </div>
        <div className={styles.regionLabel} style={{ left: '15%', top: '30%' }}>
          <PixelText size="xs" color="secondary">Lost Woods</PixelText>
        </div>

        {/* Device markers */}
        {positionedDevices.map((device) => (
          <MapDevice key={device.id} device={device} />
        ))}

        {/* Empty state */}
        {deviceList.length === 0 && (
          <div className={styles.empty}>
            <PixelText size="md" color="secondary">
              No devices discovered yet...
            </PixelText>
            <PixelText size="xs" color="secondary">
              The network scan is running. Devices will appear here.
            </PixelText>
          </div>
        )}
      </div>

      <MapLegend />
    </div>
  );
}
