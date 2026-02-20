import ping from 'ping';

export interface PingResult {
  alive: boolean;
  time: number | null;
  packetLoss: number;
  output: string;
}

export async function pingHost(
  host: string,
  timeout: number = 5000,
  count: number = 4
): Promise<PingResult> {
  try {
    const result = await ping.promise.probe(host, {
      timeout: Math.ceil(timeout / 1000),
      min_reply: count,
      extra: process.platform === 'win32' ? ['-n', String(count)] : ['-c', String(count)],
    });

    return {
      alive: result.alive,
      time: result.alive ? parseFloat(String(result.avg)) || null : null,
      packetLoss: parseFloat(String(result.packetLoss)) || 0,
      output: result.output,
    };
  } catch {
    return {
      alive: false,
      time: null,
      packetLoss: 100,
      output: 'Ping failed',
    };
  }
}
