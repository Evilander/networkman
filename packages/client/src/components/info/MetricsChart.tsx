import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { NetworkMetrics } from '@networkman/shared';
import { PixelText } from '../shared/PixelText';
import styles from './MetricsChart.module.css';

interface MetricsChartProps {
  deviceId: string;
}

type TimeRange = '1h' | '6h' | '24h';

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export function MetricsChart({ deviceId }: MetricsChartProps) {
  const [range, setRange] = useState<TimeRange>('1h');
  const [data, setData] = useState<NetworkMetrics[]>([]);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getTime() - RANGE_MS[range]);
    const url = `/api/metrics/${deviceId}?from=${from.toISOString()}&to=${now.toISOString()}`;

    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [deviceId, range]);

  const chartData = data.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: m.latency ?? 0,
    packetLoss: m.packetLoss,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.rangeSelector}>
        {(['1h', '6h', '24h'] as TimeRange[]).map((r) => (
          <button
            key={r}
            className={`${styles.rangeBtn} ${range === r ? styles.active : ''}`}
            onClick={() => setRange(r)}
          >
            <PixelText size="xs">{r}</PixelText>
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className={styles.empty}>
          <PixelText size="xs" color="secondary">No data yet...</PixelText>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 6, fill: '#bdb76b', fontFamily: 'Press Start 2P' }}
              interval="preserveStartEnd"
              stroke="#8b6914"
            />
            <YAxis
              tick={{ fontSize: 6, fill: '#bdb76b', fontFamily: 'Press Start 2P' }}
              width={35}
              stroke="#8b6914"
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '2px solid #8b6914',
                fontFamily: 'Press Start 2P',
                fontSize: '6px',
                color: '#f5f5dc',
              }}
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#7ec850"
              strokeWidth={2}
              dot={false}
              name="Latency (ms)"
            />
            <Line
              type="monotone"
              dataKey="packetLoss"
              stroke="#e53935"
              strokeWidth={1}
              dot={false}
              name="Packet Loss (%)"
              opacity={0.6}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
