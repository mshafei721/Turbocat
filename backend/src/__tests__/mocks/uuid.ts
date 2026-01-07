/**
 * Mock for uuid package
 *
 * This mock replaces the uuid package to avoid ESM issues in Jest tests.
 * Uses Node.js built-in crypto.randomUUID() which is fully compatible.
 *
 * @module __tests__/mocks/uuid
 */

import crypto from 'crypto';

/**
 * Generate a v4 UUID using Node.js crypto
 */
export const v4 = (): string => crypto.randomUUID();

/**
 * Validate if a string is a valid UUID v4
 */
export const validate = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Get the version of a UUID
 */
export const version = (uuid: string): number | null => {
  if (!validate(uuid)) {
    return null;
  }
  return parseInt(uuid.charAt(14), 16);
};

/**
 * Parse a UUID string to bytes
 */
export const parse = (uuid: string): Uint8Array => {
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

/**
 * Convert bytes to UUID string
 */
export const stringify = (bytes: Uint8Array): string => {
  const hex: string[] = [];
  for (let i = 0; i < 16; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      hex.push(byte.toString(16).padStart(2, '0'));
    }
  }
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
};

// Named exports
export default {
  v4,
  validate,
  version,
  parse,
  stringify,
};
