import dns from 'node:dns';

const REVERSE_LOOKUP_TIMEOUT_MS = 2000;

/**
 * Perform a reverse DNS lookup for the given IP address.
 * Returns the first hostname found, or null if the lookup
 * fails or exceeds the 2-second timeout.
 */
export async function resolveHostname(ip: string): Promise<string | null> {
  try {
    const result = await Promise.race([
      dns.promises.reverse(ip),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Reverse DNS lookup timed out')), REVERSE_LOOKUP_TIMEOUT_MS),
      ),
    ]);

    return result.length > 0 ? result[0] : null;
  } catch {
    return null;
  }
}
