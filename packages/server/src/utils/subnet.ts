export function parseCIDR(cidr: string): { network: string; prefix: number } {
  const [network, prefixStr] = cidr.split('/');
  return { network, prefix: parseInt(prefixStr, 10) };
}

export function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

export function getIPRange(cidr: string): string[] {
  const { network, prefix } = parseCIDR(cidr);
  const networkLong = ipToLong(network);
  const mask = (~0 << (32 - prefix)) >>> 0;
  const networkAddr = (networkLong & mask) >>> 0;
  const broadcastAddr = (networkAddr | ~mask) >>> 0;

  const ips: string[] = [];
  // Skip network address and broadcast address
  for (let i = networkAddr + 1; i < broadcastAddr; i++) {
    ips.push(longToIp(i));
  }
  return ips;
}
