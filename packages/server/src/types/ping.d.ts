declare module 'ping' {
  interface PingResponse {
    inputHost: string;
    host: string;
    alive: boolean;
    output: string;
    time: number | string;
    times: number[];
    min: string;
    max: string;
    avg: string;
    stddev: string;
    packetLoss: string | number;
    numeric_host: string;
  }

  interface PingConfig {
    timeout?: number;
    min_reply?: number;
    extra?: string[];
    deadline?: number;
  }

  const promise: {
    probe(host: string, config?: PingConfig): Promise<PingResponse>;
  };

  export { promise };
}
