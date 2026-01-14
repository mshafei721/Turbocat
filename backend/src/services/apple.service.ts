/**
 * Apple App Store Connect Service
 *
 * This service handles interactions with Apple's App Store Connect API
 * for iOS app publishing. It provides methods to authenticate, validate
 * credentials, create app records, and upload builds.
 *
 * Security Features:
 * - ES256 JWT authentication with Apple's API
 * - Secure credential validation
 * - Proper error handling and logging
 *
 * Authentication:
 * - Uses App Store Connect API Key (.p8 private key)
 * - JWT tokens expire after 20 minutes
 * - Requires: Team ID, Key ID, Issuer ID, Private Key
 *
 * @module services/apple.service
 */

import axios, { AxiosError } from 'axios';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Apple Developer credentials required for App Store Connect API
 */
export interface AppleCredentials {
  /** Apple Developer Team ID */
  teamId: string;
  /** API Key ID (10-character alphanumeric) */
  keyId: string;
  /** Issuer ID (UUID format) */
  issuerId: string;
  /** Private key from .p8 file (PEM format) */
  privateKey: string;
}

/**
 * App metadata for creating app record in App Store Connect
 */
export interface AppMetadata {
  /** App name (display name) */
  name: string;
  /** Bundle identifier (e.g., com.company.appname) */
  bundleId: string;
  /** Primary locale (default: en-US) */
  primaryLocale?: string;
}

/**
 * Response from App Store Connect API
 */
interface AppStoreConnectResponse {
  data?: any;
  errors?: Array<{
    status: string;
    code: string;
    title: string;
    detail: string;
  }>;
}

// =============================================================================
// APPLE SERVICE
// =============================================================================

/**
 * Apple App Store Connect Service
 *
 * Handles all interactions with Apple's App Store Connect API including
 * JWT generation, credential validation, app creation, and build uploads.
 *
 * Base URL: https://api.appstoreconnect.apple.com
 * API Version: v1
 * Authentication: JWT with ES256 algorithm
 *
 * @example
 * ```typescript
 * const credentials = {
 *   teamId: 'ABC123DEF4',
 *   keyId: 'ABCD123456',
 *   issuerId: '12345678-1234-1234-1234-123456789012',
 *   privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
 * };
 *
 * const service = new AppleService();
 * const isValid = await service.validateCredentials(
 *   credentials.teamId,
 *   credentials.keyId,
 *   credentials.issuerId,
 *   credentials.privateKey
 * );
 * ```
 */
export class AppleService {
  private readonly baseUrl = 'https://api.appstoreconnect.apple.com';
  private readonly apiVersion = 'v1';

  /**
   * Generate JWT token for Apple App Store Connect API authentication
   *
   * Creates a JWT token using ES256 algorithm (ECDSA with SHA-256) signed
   * with the provided private key. The token is valid for 20 minutes as per
   * Apple's requirements.
   *
   * JWT Structure:
   * - Header: { alg: 'ES256', kid: keyId, typ: 'JWT' }
   * - Payload: { iss: issuerId, iat: now, exp: now + 20min, aud: 'appstoreconnect-v1' }
   * - Signature: ES256(header + payload, privateKey)
   *
   * @param keyId - API Key ID from App Store Connect (10-char alphanumeric)
   * @param issuerId - Issuer ID from App Store Connect (UUID format)
   * @param privateKey - Private key content from .p8 file (PEM format)
   * @returns Signed JWT token string
   * @throws ApiError if JWT generation fails
   *
   * @example
   * ```typescript
   * const token = service.generateJWT(
   *   'ABCD123456',
   *   '12345678-1234-1234-1234-123456789012',
   *   '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
   * );
   * // Returns: 'eyJhbGc...'
   * ```
   */
  generateJWT(keyId: string, issuerId: string, privateKey: string): string {
    try {
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = now + 20 * 60; // 20 minutes from now

      const token = jwt.sign(
        {
          iss: issuerId,
          iat: now,
          exp: expirationTime,
          aud: 'appstoreconnect-v1',
        },
        privateKey,
        {
          algorithm: 'ES256',
          header: {
            alg: 'ES256',
            kid: keyId,
            typ: 'JWT',
          },
        },
      );

      logger.debug('[AppleService] JWT generated successfully', {
        keyId,
        issuerId: issuerId.substring(0, 8) + '...',
        expiresIn: '20m',
      });

      return token;
    } catch (error) {
      logger.error('[AppleService] JWT generation failed', {
        keyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new ApiError(
        500,
        'Failed to generate Apple API authentication token',
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
      );
    }
  }

  /**
   * Validate Apple Developer credentials
   *
   * Tests the provided credentials by attempting to authenticate with
   * Apple's App Store Connect API and fetch the apps list. This is a
   * non-destructive operation that only requires read access.
   *
   * The validation succeeds if:
   * - JWT generation succeeds with the provided credentials
   * - Apple's API accepts the JWT and returns HTTP 200
   *
   * @param teamId - Apple Developer Team ID
   * @param keyId - API Key ID
   * @param issuerId - Issuer ID
   * @param privateKey - Private key from .p8 file
   * @returns true if credentials are valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = await service.validateCredentials(
   *   'ABC123DEF4',
   *   'ABCD123456',
   *   '12345678-1234-1234-1234-123456789012',
   *   '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
   * );
   *
   * if (isValid) {
   *   console.log('Credentials are valid!');
   * } else {
   *   console.log('Invalid credentials');
   * }
   * ```
   */
  async validateCredentials(
    teamId: string,
    keyId: string,
    issuerId: string,
    privateKey: string,
  ): Promise<boolean> {
    try {
      logger.info('[AppleService] Validating Apple credentials', {
        teamId,
        keyId,
        issuerId: issuerId.substring(0, 8) + '...',
      });

      // Generate JWT token
      const token = this.generateJWT(keyId, issuerId, privateKey);

      // Test credentials by fetching apps list
      const response = await axios.get(`${this.baseUrl}/${this.apiVersion}/apps`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      const isValid = response.status === 200;

      logger.info('[AppleService] Credential validation result', {
        teamId,
        isValid,
        status: response.status,
      });

      return isValid;
    } catch (error) {
      const axiosError = error as AxiosError;

      logger.error('[AppleService] Credential validation failed', {
        teamId,
        error: axiosError.message,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data,
      });

      return false;
    }
  }

  /**
   * Create app record in App Store Connect
   *
   * Registers a new app in Apple's App Store Connect system. This creates
   * the app record that can later receive build uploads and app metadata.
   *
   * Prerequisites:
   * - Bundle ID must be registered in Apple Developer portal
   * - Credentials must have app creation permissions
   * - App name must not conflict with existing apps
   *
   * @param metadata - App metadata (name, bundleId, locale)
   * @param credentials - Apple Developer credentials
   * @returns App Store Connect response data
   * @throws ApiError if app creation fails
   *
   * @example
   * ```typescript
   * const appData = await service.createApp(
   *   {
   *     name: 'My Awesome App',
   *     bundleId: 'com.company.myapp',
   *     primaryLocale: 'en-US'
   *   },
   *   credentials
   * );
   *
   * console.log('App created:', appData.data.id);
   * ```
   */
  async createApp(
    metadata: AppMetadata,
    credentials: AppleCredentials,
  ): Promise<AppStoreConnectResponse> {
    try {
      logger.info('[AppleService] Creating app in App Store Connect', {
        appName: metadata.name,
        bundleId: metadata.bundleId,
        teamId: credentials.teamId,
      });

      // Generate JWT token
      const token = this.generateJWT(credentials.keyId, credentials.issuerId, credentials.privateKey);

      // Create app via App Store Connect API
      const response = await axios.post<AppStoreConnectResponse>(
        `${this.baseUrl}/${this.apiVersion}/apps`,
        {
          data: {
            type: 'apps',
            attributes: {
              name: metadata.name,
              bundleId: metadata.bundleId,
              primaryLocale: metadata.primaryLocale || 'en-US',
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000, // 15 second timeout
        },
      );

      logger.info('[AppleService] App created successfully', {
        appName: metadata.name,
        bundleId: metadata.bundleId,
        appId: response.data.data?.id,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AppStoreConnectResponse>;
      const errorResponse = axiosError.response?.data;

      // Extract Apple API error details
      const appleErrors = errorResponse?.errors || [];
      const errorMessage =
        appleErrors.length > 0 && appleErrors[0]
          ? `${appleErrors[0].title}: ${appleErrors[0].detail}`
          : axiosError.message || 'Unknown error creating app';

      logger.error('[AppleService] App creation failed', {
        appName: metadata.name,
        bundleId: metadata.bundleId,
        error: errorMessage,
        status: axiosError.response?.status,
        appleErrors,
      });

      throw new ApiError(
        axiosError.response?.status || 500,
        `Failed to create app in App Store Connect: ${errorMessage}`,
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
      );
    }
  }

  /**
   * Upload build to App Store Connect
   *
   * Submits an IPA file to Apple for TestFlight and App Store distribution.
   *
   * **IMPORTANT:** This is currently a stub implementation. Full implementation
   * requires using Apple's Transporter API or `altool` command-line tool, which
   * requires a macOS environment and additional setup.
   *
   * Recommended implementation approach:
   * 1. Use `xcrun altool --upload-app` command (requires macOS)
   * 2. OR use Apple's Transporter REST API (requires additional auth setup)
   * 3. OR integrate with fastlane (requires Ruby + fastlane installation)
   *
   * Command reference:
   * ```bash
   * xcrun altool --upload-app \
   *   -f /path/to/app.ipa \
   *   -t ios \
   *   --apiKey <keyId> \
   *   --apiIssuer <issuerId>
   * ```
   *
   * @param ipaPath - Absolute path to the .ipa file
   * @param credentials - Apple Developer credentials
   * @returns Upload result (not implemented)
   * @throws ApiError (always throws - not implemented)
   *
   * @example
   * ```typescript
   * // This will throw an error until fully implemented
   * await service.uploadBuild('/tmp/MyApp.ipa', credentials);
   * ```
   *
   * @todo Implement full build upload functionality using altool or Transporter API
   */
  async uploadBuild(ipaPath: string, credentials: AppleCredentials): Promise<void> {
    logger.warn('[AppleService] uploadBuild() called but not fully implemented', {
      ipaPath,
      teamId: credentials.teamId,
    });

    // TODO: Implement build upload using one of these approaches:
    // 1. xcrun altool --upload-app (requires macOS)
    // 2. Apple Transporter API (requires additional auth setup)
    // 3. fastlane integration (requires Ruby + fastlane)
    //
    // Example altool command:
    // xcrun altool --upload-app -f ${ipaPath} -t ios \
    //   --apiKey ${credentials.keyId} \
    //   --apiIssuer ${credentials.issuerId}

    throw new ApiError(
      501,
      'Build upload not implemented yet. Please use Xcode Organizer or Transporter app to upload builds manually.',
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
    );
  }
}

// Export singleton instance
export const appleService = new AppleService();

export default appleService;
