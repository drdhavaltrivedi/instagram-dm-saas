/**
 * Rate Limiting Utilities
 * Provides random delays to mimic human behavior and avoid Instagram detection
 */

/**
 * Get a random delay between 5-15 seconds
 * @returns Delay in milliseconds (5000-15000)
 */
export function getRandomDelay(): number {
  const minDelay = 5000; // 5 seconds
  const maxDelay = 15000; // 15 seconds
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

/**
 * Get a random delay with custom min/max
 * @param minSeconds - Minimum delay in seconds
 * @param maxSeconds - Maximum delay in seconds
 * @returns Delay in milliseconds
 */
export function getCustomRandomDelay(minSeconds: number, maxSeconds: number): number {
  const minMs = minSeconds * 1000;
  const maxMs = maxSeconds * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Sleep/wait for a random delay
 * @param minSeconds - Minimum delay in seconds (default: 5)
 * @param maxSeconds - Maximum delay in seconds (default: 15)
 * @returns Promise that resolves after the delay
 */
export async function randomDelay(minSeconds: number = 5, maxSeconds: number = 15): Promise<void> {
  const delay = getCustomRandomDelay(minSeconds, maxSeconds);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Format delay time for display
 * @param ms - Delay in milliseconds
 * @returns Formatted string (e.g., "8.5s")
 */
export function formatDelayTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
