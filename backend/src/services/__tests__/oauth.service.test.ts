/**
 * OAuth Service Integration Tests
 *
 * Tests for OAuth service methods:
 * - generateAuthUrl: OAuth URL generation with state parameter
 * - handleCallback: Authorization code exchange for tokens
 * - getUserProfile: User profile fetching from providers
 * - isProviderConfigured: Provider configuration validation
 *
 * These tests use mocked axios to avoid external API calls during testing.
 *
 * @module services/__tests__/oauth.service.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import * as OAuthService from '../oauth.service';
import type { OAuthProvider } from '../oauth.service';

// Mock axios for external API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger to avoid console output during tests
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

/**
 * Reset all mocks before each test
 */
const resetMocks = () => {
  jest.clearAllMocks();
};

describe('OAuth Service', () => {
  beforeEach(() => {
    resetMocks();
    // Set test environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
    process.env.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret';
  });

  // ==========================================================================
  // generateAuthUrl Tests
  // ==========================================================================
  describe('generateAuthUrl', () => {
    const redirectUri = 'http://localhost:3001/api/v1/auth/oauth/google/callback';

    it('should generate valid Google OAuth URL', async () => {
      const result = await OAuthService.generateAuthUrl('google', redirectUri);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.state).toBeTruthy();
      expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(result.url).toContain('client_id=test-google-client-id');
      expect(result.url).toContain('redirect_uri=');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('scope=openid%20profile%20email');
      expect(result.url).toContain(`state=${result.state}`);
      expect(result.url).toContain('access_type=offline');
      expect(result.url).toContain('prompt=consent');
    });

    it('should generate valid GitHub OAuth URL', async () => {
      const result = await OAuthService.generateAuthUrl('github', redirectUri);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('client_id=test-github-client-id');
      expect(result.url).toContain('scope=read%3Auser%20user%3Aemail');
      expect(result.url).toContain(`state=${result.state}`);
    });

    it('should generate valid Microsoft OAuth URL', async () => {
      const result = await OAuthService.generateAuthUrl('microsoft', redirectUri);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('state');
      expect(result.url).toContain(
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      );
      expect(result.url).toContain('client_id=test-microsoft-client-id');
      expect(result.url).toContain('scope=openid%20profile%20email');
      expect(result.url).toContain('response_mode=query');
      expect(result.url).toContain(`state=${result.state}`);
    });

    it('should include state parameter in URL', async () => {
      const result = await OAuthService.generateAuthUrl('google', redirectUri);

      expect(result.state).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.url).toContain(`state=${result.state}`);
    });

    it('should include redirect_uri in URL', async () => {
      const result = await OAuthService.generateAuthUrl('google', redirectUri);

      expect(result.url).toContain(
        `redirect_uri=${encodeURIComponent(redirectUri)}`,
      );
    });

    it('should throw error for invalid provider', async () => {
      // Test with invalid provider by bypassing TypeScript
      await expect(
        OAuthService.generateAuthUrl('invalid' as OAuthProvider, redirectUri),
      ).rejects.toThrow();
    });

    it('should throw error when GOOGLE_CLIENT_ID is missing', async () => {
      delete process.env.GOOGLE_CLIENT_ID;

      await expect(
        OAuthService.generateAuthUrl('google', redirectUri),
      ).rejects.toThrow(/GOOGLE_CLIENT_ID/);
    });

    it('should throw error when GOOGLE_CLIENT_SECRET is missing', async () => {
      delete process.env.GOOGLE_CLIENT_SECRET;

      await expect(
        OAuthService.generateAuthUrl('google', redirectUri),
      ).rejects.toThrow(/GOOGLE_CLIENT_SECRET/);
    });

    it('should throw error when GITHUB_CLIENT_ID is missing', async () => {
      delete process.env.GITHUB_CLIENT_ID;

      await expect(
        OAuthService.generateAuthUrl('github', redirectUri),
      ).rejects.toThrow(/GITHUB_CLIENT_ID/);
    });

    it('should throw error when MICROSOFT_CLIENT_ID is missing', async () => {
      delete process.env.MICROSOFT_CLIENT_ID;

      await expect(
        OAuthService.generateAuthUrl('microsoft', redirectUri),
      ).rejects.toThrow(/MICROSOFT_CLIENT_ID/);
    });
  });

  // ==========================================================================
  // handleCallback Tests
  // ==========================================================================
  describe('handleCallback', () => {
    const code = 'test-authorization-code';
    const redirectUri = 'http://localhost:3001/api/v1/auth/oauth/google/callback';

    beforeEach(() => {
      // Mock successful token exchange
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid profile email',
        },
      });
    });

    it('should exchange code for tokens (Google)', async () => {
      const tokens = await OAuthService.handleCallback('google', code, redirectUri);

      expect(tokens).toHaveProperty('accessToken', 'test-access-token');
      expect(tokens).toHaveProperty('refreshToken', 'test-refresh-token');
      expect(tokens).toHaveProperty('expiresIn', 3600);
      expect(tokens).toHaveProperty('tokenType', 'Bearer');
      expect(tokens).toHaveProperty('scope', 'openid profile email');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }),
      );
    });

    it('should exchange code for tokens (GitHub)', async () => {
      const tokens = await OAuthService.handleCallback('github', code, redirectUri);

      expect(tokens).toHaveProperty('accessToken', 'test-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should exchange code for tokens (Microsoft)', async () => {
      const tokens = await OAuthService.handleCallback('microsoft', code, redirectUri);

      expect(tokens).toHaveProperty('accessToken', 'test-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should throw error for invalid code', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'invalid_grant' },
        },
        message: 'Invalid authorization code',
      });

      await expect(
        OAuthService.handleCallback('google', 'invalid-code', redirectUri),
      ).rejects.toThrow();
    });

    it('should throw error for expired code', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'authorization_pending' },
        },
        message: 'Authorization code expired',
      });

      await expect(
        OAuthService.handleCallback('google', 'expired-code', redirectUri),
      ).rejects.toThrow();
    });

    it('should handle missing refresh token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          // No refresh_token
          expires_in: 3600,
        },
      });

      const tokens = await OAuthService.handleCallback('google', code, redirectUri);

      expect(tokens).toHaveProperty('accessToken', 'test-access-token');
      expect(tokens.refreshToken).toBeUndefined();
    });

    it('should default expiresIn to 3600 if missing', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token',
          // No expires_in
        },
      });

      const tokens = await OAuthService.handleCallback('google', code, redirectUri);

      expect(tokens).toHaveProperty('expiresIn', 3600);
    });
  });

  // ==========================================================================
  // getUserProfile Tests
  // ==========================================================================
  describe('getUserProfile', () => {
    const accessToken = 'test-access-token';

    describe('Google provider', () => {
      beforeEach(() => {
        mockedAxios.get.mockResolvedValue({
          data: {
            id: 'google-user-123',
            email: 'test@gmail.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          },
        });
      });

      it('should fetch user profile from Google', async () => {
        const profile = await OAuthService.getUserProfile('google', accessToken);

        expect(profile).toEqual({
          id: 'google-user-123',
          email: 'test@gmail.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          provider: 'google',
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }),
        );
      });

      it('should handle missing name', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            id: 'google-user-123',
            email: 'test@gmail.com',
            // No name
          },
        });

        const profile = await OAuthService.getUserProfile('google', accessToken);

        expect(profile.name).toBeNull();
      });

      it('should handle missing picture', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            id: 'google-user-123',
            email: 'test@gmail.com',
            name: 'Test User',
            // No picture
          },
        });

        const profile = await OAuthService.getUserProfile('google', accessToken);

        expect(profile.avatarUrl).toBeNull();
      });
    });

    describe('GitHub provider', () => {
      beforeEach(() => {
        // Mock user profile response
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@github.com',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        });
      });

      it('should fetch user profile from GitHub', async () => {
        const profile = await OAuthService.getUserProfile('github', accessToken);

        expect(profile).toEqual({
          id: '12345',
          email: 'test@github.com',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          provider: 'github',
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.github.com/user',
          expect.any(Object),
        );
      });

      it('should fetch email separately if not included', async () => {
        // Mock user profile without email
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            // No email
            avatar_url: 'https://example.com/avatar.jpg',
          },
        });

        // Mock email endpoint
        mockedAxios.get.mockResolvedValueOnce({
          data: [
            { email: 'test@github.com', primary: true, verified: true },
            { email: 'other@example.com', primary: false, verified: true },
          ],
        });

        const profile = await OAuthService.getUserProfile('github', accessToken);

        expect(profile.email).toBe('test@github.com');
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.github.com/user/emails',
          expect.any(Object),
        );
      });

      it('should use login as name if name is missing', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            id: 12345,
            login: 'testuser',
            // No name
            email: 'test@github.com',
          },
        });

        const profile = await OAuthService.getUserProfile('github', accessToken);

        expect(profile.name).toBe('testuser');
      });
    });

    describe('Microsoft provider', () => {
      beforeEach(() => {
        mockedAxios.get.mockResolvedValue({
          data: {
            id: 'microsoft-user-123',
            mail: 'test@outlook.com',
            displayName: 'Test User',
          },
        });
      });

      it('should fetch user profile from Microsoft', async () => {
        const profile = await OAuthService.getUserProfile('microsoft', accessToken);

        expect(profile).toEqual({
          id: 'microsoft-user-123',
          email: 'test@outlook.com',
          name: 'Test User',
          avatarUrl: null,
          provider: 'microsoft',
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://graph.microsoft.com/v1.0/me',
          expect.any(Object),
        );
      });

      it('should use userPrincipalName if mail is missing', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            id: 'microsoft-user-123',
            userPrincipalName: 'test@company.onmicrosoft.com',
            displayName: 'Test User',
          },
        });

        const profile = await OAuthService.getUserProfile('microsoft', accessToken);

        expect(profile.email).toBe('test@company.onmicrosoft.com');
      });
    });

    it('should normalize profile data across providers', async () => {
      // Test Google
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: '123',
          email: 'test@example.com',
          name: 'Test',
          picture: 'url',
        },
      });
      const googleProfile = await OAuthService.getUserProfile('google', accessToken);
      expect(googleProfile).toHaveProperty('provider', 'google');

      // Test GitHub
      mockedAxios.get.mockResolvedValueOnce({
        data: { id: 123, email: 'test@example.com', login: 'test' },
      });
      const githubProfile = await OAuthService.getUserProfile('github', accessToken);
      expect(githubProfile).toHaveProperty('provider', 'github');
      expect(githubProfile.id).toBe('123'); // Normalized to string

      // Test Microsoft
      mockedAxios.get.mockResolvedValueOnce({
        data: { id: '123', mail: 'test@example.com', displayName: 'Test' },
      });
      const msProfile = await OAuthService.getUserProfile('microsoft', accessToken);
      expect(msProfile).toHaveProperty('provider', 'microsoft');
    });

    it('should throw error for invalid token', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'invalid_token' },
        },
        message: 'Invalid access token',
      });

      await expect(
        OAuthService.getUserProfile('google', 'invalid-token'),
      ).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'token_expired' },
        },
        message: 'Token expired',
      });

      await expect(
        OAuthService.getUserProfile('google', 'expired-token'),
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // isProviderConfigured Tests
  // ==========================================================================
  describe('isProviderConfigured', () => {
    it('should return true when Google is configured', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';

      const result = OAuthService.isProviderConfigured('google');

      expect(result).toBe(true);
    });

    it('should return false when Google client ID is missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';

      const result = OAuthService.isProviderConfigured('google');

      expect(result).toBe(false);
    });

    it('should return false when Google client secret is missing', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      delete process.env.GOOGLE_CLIENT_SECRET;

      const result = OAuthService.isProviderConfigured('google');

      expect(result).toBe(false);
    });

    it('should return true when GitHub is configured', () => {
      process.env.GITHUB_CLIENT_ID = 'test-id';
      process.env.GITHUB_CLIENT_SECRET = 'test-secret';

      const result = OAuthService.isProviderConfigured('github');

      expect(result).toBe(true);
    });

    it('should return true when Microsoft is configured', () => {
      process.env.MICROSOFT_CLIENT_ID = 'test-id';
      process.env.MICROSOFT_CLIENT_SECRET = 'test-secret';

      const result = OAuthService.isProviderConfigured('microsoft');

      expect(result).toBe(true);
    });
  });
});
