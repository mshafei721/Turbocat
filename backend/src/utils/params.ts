/**
 * Request Parameter Utilities
 *
 * Helper functions for extracting and validating request parameters
 * with proper TypeScript type handling for Express 5.x compatibility.
 *
 * @module utils/params
 */

/**
 * Safely extracts a string parameter from Express request params or query.
 * Handles the Express 5.x type where params can be string | string[] | ParsedQs.
 *
 * @param value - The param value from req.params or req.query
 * @returns The string value, or undefined if not a valid string
 */
export function getStringParam(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

/**
 * Safely extracts a required string parameter.
 * Throws if the value is not a valid string.
 *
 * @param value - The param value from req.params or req.query
 * @param paramName - Name of the parameter for error messages
 * @returns The string value
 * @throws Error if value is not a valid string
 */
export function requireStringParam(value: unknown, paramName: string): string {
  const result = getStringParam(value);
  if (result === undefined) {
    throw new Error(`Invalid or missing parameter: ${paramName}`);
  }
  return result;
}
