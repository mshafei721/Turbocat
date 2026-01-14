/**
 * OAuth Service
 *
 * This service handles OAuth 2.0 authentication flows for multiple providers
 * (Google, GitHub, Microsoft). It provides methods to generate authorization
 * URLs, exchange authorization codes for tokens, and fetch user profiles.
 *
 * Security Features:
 * - State parameter for CSRF protection (UUID-based)
 * - Secure token exchange with provider validation
 * - Normalized user profiles across providers
 *
 * Supported Providers:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * - Microsoft OAuth 2.0 (Azure AD)
 *
 * @module services/oauth.service
 */

import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'github' | 'microsoft';

/**
 * OAuth tokens received from provider
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Normalized user profile from OAuth provider
 */
export interface OAuthUserProfile {
  /** Provider's unique user ID */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  name: string | null;
  /** User's avatar/profile picture URL */
  avatarUrl: string | null;
  /** OAuth provider */
  provider: OAuthProvider;
}

/**
 * Provider configuration
 */
interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

// =============================================================================
// PROVIDER CONFIGURATIONS
// =============================================================================

/**
 * Get provider configuration from environment
 */
const getProviderConfig = (provider: OAuthProvider): ProviderConfig => {
  const configs: Record<OAuthProvider, ProviderConfig> = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'profile', 'email'],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['read:user', 'user:email'],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: ['openid', 'profile', 'email'],
    },
  };

  return configs[provider];
};

/**
 * Validate provider configuration
 */
const validateProviderConfig = (provider: OAuthProvider): void => {
  const config = getProviderConfig(provider);

  if (!config.clientId || !config.clientSecret) {
    const envVars =
      provider === 'google'
        ? 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
        : provider === 'github'
          ? 'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET'
          : 'MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET';

    throw new ApiError(
      500,
      `OAuth ${provider} not configured: Missing ${envVars} environment variables`,
    );
  }
};

// =============================================================================
// OAUTH SERVICE
// =============================================================================

/**
 * Generate OAuth authorization URL
 *
 * Creates an OAuth 2.0 authorization URL with proper scopes and state parameter
 * for CSRF protection. The user should be redirected to this URL to start the
 * OAuth flow.
 *
 * @param provider - OAuth provider (google, github, microsoft)
 * @param redirectUri - Callback URL where provider will redirect after authorization
 * @returns Authorization URL with state parameter
 * @throws ApiError if provider is not configured
 *
 * Usage:
 * ```typescript
 * const authUrl = await OAuthService.generateAuthUrl(
 *   'google',
 *   'https://example.com/auth/callback/google'
 * );
 * // Redirect user to authUrl
 * ```
 */
export const generateAuthUrl = async (
  provider: OAuthProvider,
  redirectUri: string,
): Promise<{ url: string; state: string }> => {
  try {
    validateProviderConfig(provider);

    const config = getProviderConfig(provider);
    const state = uuidv4(); // CSRF protection state parameter

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      ...(provider === 'google' && { access_type: 'offline', prompt: 'consent' }),
      ...(provider === 'microsoft' && { response_mode: 'query' }),
    });

    const url = `${config.authUrl}?${params.toString()}`;

    logger.info(`[OAuth] Generated auth URL for ${provider}`, {
      provider,
      state,
      redirectUri,
    });

    return { url, state };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error(`[OAuth] Failed to generate auth URL for ${provider}`, {
      provider,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new ApiError(500, `Failed to generate OAuth URL for ${provider}`);
  }
};

/**
 * Exchange authorization code for access tokens
 *
 * Exchanges the authorization code received from the OAuth provider for
 * access and refresh tokens. This is step 2 of the OAuth flow, called
 * when the provider redirects back to your callback URL.
 *
 * @param provider - OAuth provider (google, github, microsoft)
 * @param code - Authorization code from provider
 * @param redirectUri - Same redirect URI used in generateAuthUrl
 * @returns OAuth tokens (access token, optional refresh token, expiry)
 * @throws ApiError if token exchange fails
 *
 * Usage:
 * ```typescript
 * const tokens = await OAuthService.handleCallback(
 *   'google',
 *   'authorization_code_from_query',
 *   'https://example.com/auth/callback/google'
 * );
 * ```
 */
export const handleCallback = async (
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<OAuthTokens> => {
  try {
    validateProviderConfig(provider);

    const config = getProviderConfig(provider);

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    logger.info(`[OAuth] Exchanging code for tokens: ${provider}`, {
      provider,
      redirectUri,
    });

    const response = await axios.post(config.tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Normalize response format across providers
    const data = response.data;
    const tokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
      tokenType: data.token_type,
    };

    logger.info(`[OAuth] Successfully exchanged code for tokens: ${provider}`, {
      provider,
      hasRefreshToken: !!tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });

    return tokens;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const axiosError = error as AxiosError;
    const errorMessage =
      axiosError.response?.data ||
      axiosError.message ||
      'Unknown error during token exchange';

    logger.error(`[OAuth] Failed to exchange code for tokens: ${provider}`, {
      provider,
      error: errorMessage,
      status: axiosError.response?.status,
    });

    throw new ApiError(
      400,
      `Failed to exchange authorization code for ${provider}: ${
        typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      }`,
    );
  }
};

/**
 * Fetch user profile from OAuth provider
 *
 * Fetches the user's profile information from the OAuth provider using
 * the access token. Returns a normalized profile structure that's consistent
 * across all providers.
 *
 * @param provider - OAuth provider (google, github, microsoft)
 * @param accessToken - Access token from handleCallback
 * @returns Normalized user profile
 * @throws ApiError if profile fetch fails
 *
 * Usage:
 * ```typescript
 * const profile = await OAuthService.getUserProfile('google', tokens.accessToken);
 * console.log(profile.email, profile.name, profile.avatarUrl);
 * ```
 */
export const getUserProfile = async (
  provider: OAuthProvider,
  accessToken: string,
): Promise<OAuthUserProfile> => {
  try {
    const config = getProviderConfig(provider);

    logger.info(`[OAuth] Fetching user profile: ${provider}`, { provider });

    const response = await axios.get(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    const data = response.data;
    let profile: OAuthUserProfile;

    // Normalize profile across providers
    switch (provider) {
      case 'google':
        profile = {
          id: data.id,
          email: data.email,
          name: data.name || null,
          avatarUrl: data.picture || null,
          provider: 'google',
        };
        break;

      case 'github':
        // GitHub requires separate call for email if not public
        let email = data.email;
        if (!email) {
          try {
            const emailResponse = await axios.get('https://api.github.com/user/emails', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
              timeout: 10000,
            });
            const emails = emailResponse.data;
            const primaryEmail = emails.find((e: any) => e.primary && e.verified);
            email = primaryEmail?.email || emails[0]?.email || '';
          } catch (emailError) {
            logger.warn(`[OAuth] Failed to fetch GitHub email`, {
              error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
            email = '';
          }
        }

        profile = {
          id: data.id.toString(),
          email,
          name: data.name || data.login || null,
          avatarUrl: data.avatar_url || null,
          provider: 'github',
        };
        break;

      case 'microsoft':
        profile = {
          id: data.id,
          email: data.mail || data.userPrincipalName || '',
          name: data.displayName || null,
          avatarUrl: null, // Microsoft Graph doesn't include avatar in /me endpoint
          provider: 'microsoft',
        };
        break;

      default:
        throw new ApiError(400, `Unsupported provider: ${provider}`);
    }

    logger.info(`[OAuth] Successfully fetched user profile: ${provider}`, {
      provider,
      userId: profile.id,
      hasEmail: !!profile.email,
    });

    return profile;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const axiosError = error as AxiosError;
    const errorMessage =
      axiosError.response?.data || axiosError.message || 'Unknown error fetching profile';

    logger.error(`[OAuth] Failed to fetch user profile: ${provider}`, {
      provider,
      error: errorMessage,
      status: axiosError.response?.status,
    });

    throw new ApiError(
      400,
      `Failed to fetch user profile from ${provider}: ${
        typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      }`,
    );
  }
};

/**
 * Check if OAuth is configured for a provider
 *
 * @param provider - OAuth provider to check
 * @returns True if provider is configured with client ID and secret
 */
export const isProviderConfigured = (provider: OAuthProvider): boolean => {
  try {
    validateProviderConfig(provider);
    return true;
  } catch {
    return false;
  }
};

// Export service methods
export const OAuthService = {
  generateAuthUrl,
  handleCallback,
  getUserProfile,
  isProviderConfigured,
};

export default OAuthService;
