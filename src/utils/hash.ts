/**
 * MurmurHash3 32-bit implementation.
 * Produces a 32-bit hash value from a string.
 *
 * @param key The string to hash.
 * @param seed An optional seed value.
 * @returns A 32-bit unsigned integer hash.
 */
function murmurhash3_32_gc(key: string, seed: number = 0): number {
  let remainder: number,
    bytes: number,
    h1: number,
    h1b: number,
    c1: number,
    c2: number,
    k1: number,
    i: number;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    // Get 4 bytes from the key
    k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    // Bitmagic operations
    k1 =
      ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 =
      ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b =
      ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
    h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
  }

  k1 = 0;

  // Handle the remaining bytes
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16; // fallthrough
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8; // fallthrough
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 =
        ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) &
        0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 =
        ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) &
        0xffffffff;
      h1 ^= k1;
  }

  // Finalization mix
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 =
    ((h1 & 0xffff) * 0x85ebca6b +
      ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) &
    0xffffffff;
  h1 ^= h1 >>> 13;
  h1 =
    ((h1 & 0xffff) * 0xc2b2ae35 +
      ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) &
    0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0; // Ensure unsigned 32-bit integer
}

/**
 * Create a deterministic numeric hash from a string using MurmurHash3.
 * This ensures the same user gets the same variant across sessions.
 * The output is an unsigned 32-bit integer.
 * @param input The string to hash (e.g., testId + userId).
 * @returns An unsigned 32-bit integer hash.
 */
export function createUserHash(input: string): number {
  const seed = 0; // You can use a fixed seed. Using 0 is common.
  return murmurhash3_32_gc(input, seed);
}
