/**
 * Utility functions for hashing and deterministic assignment
 */

/**
 * Create a deterministic hash from a string (simple implementation)
 * This ensures the same user gets the same variant across sessions
 */
export function createUserHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive number and then to hex
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(16).padStart(8, "0");
}

/**
 * Create a more robust hash using a simple implementation of djb2
 */
export function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Create a normalized hash value between 0 and 1
 */
export function normalizeHash(input: string): number {
  const hash = djb2Hash(input);
  return hash / 0xffffffff;
}
