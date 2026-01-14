import axios from 'axios';
import { ExpoService } from '../expo.service';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';

jest.mock('axios');
jest.mock('../../lib/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ExpoService', () => {
  let expoService: ExpoService;
  const mockToken = 'test-expo-token';
  const mockProjectId = 'test-project-id';
  const mockBuildId = 'build-123';

  beforeEach(() => {
    expoService = new ExpoService();
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should return true when token is valid', async () => {
      mockedAxios.get.mockResolvedValue({ status: 200 });

      const result = await expoService.validateToken(mockToken);

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.expo.dev/v2/auth/loginAsync',
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
    });

    it('should return false when token is invalid', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await expoService.validateToken(mockToken);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Expo token validation failed',
        { error: expect.any(Error) }
      );
    });

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await expoService.validateToken(mockToken);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('startBuild', () => {
    it('should start iOS build successfully', async () => {
      const mockBuildResponse = {
        data: {
          id: mockBuildId,
          status: 'in-progress'
        }
      };
      mockedAxios.post.mockResolvedValue(mockBuildResponse);

      const result = await expoService.startBuild(mockProjectId, 'ios', mockToken);

      expect(result).toBe(mockBuildId);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.expo.dev/v2/builds',
        { platform: 'ios', projectId: mockProjectId },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Expo build started',
        { buildId: mockBuildId, projectId: mockProjectId, platform: 'ios' }
      );
    });

    it('should start Android build successfully', async () => {
      const mockBuildResponse = {
        data: {
          id: mockBuildId,
          status: 'in-progress'
        }
      };
      mockedAxios.post.mockResolvedValue(mockBuildResponse);

      const result = await expoService.startBuild(mockProjectId, 'android', mockToken);

      expect(result).toBe(mockBuildId);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.expo.dev/v2/builds',
        { platform: 'android', projectId: mockProjectId },
        expect.any(Object)
      );
    });

    it('should throw ApiError when build fails to start', async () => {
      const mockError = new Error('Build failed');
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(
        expoService.startBuild(mockProjectId, 'ios', mockToken)
      ).rejects.toThrow(ApiError);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to start Expo build',
        { error: mockError, projectId: mockProjectId, platform: 'ios' }
      );
    });

    it('should throw ApiError on unauthorized request', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        expoService.startBuild(mockProjectId, 'android', 'invalid-token')
      ).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on network error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        expoService.startBuild(mockProjectId, 'ios', mockToken)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getBuildStatus', () => {
    it('should return in-progress status', async () => {
      const mockResponse = {
        data: {
          status: 'in-progress',
          artifacts: null,
          error: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await expoService.getBuildStatus(mockBuildId, mockToken);

      expect(result).toEqual({
        status: 'in-progress',
        artifactUrl: undefined,
        error: null
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://api.expo.dev/v2/builds/${mockBuildId}`,
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
    });

    it('should return finished status with artifact URL', async () => {
      const mockArtifactUrl = 'https://expo.dev/artifacts/build.ipa';
      const mockResponse = {
        data: {
          status: 'finished',
          artifacts: {
            buildUrl: mockArtifactUrl
          },
          error: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await expoService.getBuildStatus(mockBuildId, mockToken);

      expect(result).toEqual({
        status: 'finished',
        artifactUrl: mockArtifactUrl,
        error: null
      });
    });

    it('should return errored status with error message', async () => {
      const mockError = 'Build failed: Invalid configuration';
      const mockResponse = {
        data: {
          status: 'errored',
          artifacts: null,
          error: mockError
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await expoService.getBuildStatus(mockBuildId, mockToken);

      expect(result).toEqual({
        status: 'errored',
        artifactUrl: undefined,
        error: mockError
      });
    });

    it('should throw ApiError when status check fails', async () => {
      const mockError = new Error('Failed to get status');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        expoService.getBuildStatus(mockBuildId, mockToken)
      ).rejects.toThrow(ApiError);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get build status',
        { error: mockError, buildId: mockBuildId }
      );
    });

    it('should throw ApiError on unauthorized request', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        expoService.getBuildStatus(mockBuildId, 'invalid-token')
      ).rejects.toThrow(ApiError);
    });

    it('should handle missing artifacts gracefully', async () => {
      const mockResponse = {
        data: {
          status: 'finished',
          artifacts: undefined,
          error: null
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await expoService.getBuildStatus(mockBuildId, mockToken);

      expect(result.artifactUrl).toBeUndefined();
    });

    it('should handle all status types correctly', async () => {
      const statuses: Array<'in-progress' | 'finished' | 'errored'> = [
        'in-progress',
        'finished',
        'errored'
      ];

      for (const status of statuses) {
        mockedAxios.get.mockResolvedValue({
          data: { status, artifacts: null, error: null }
        });

        const result = await expoService.getBuildStatus(mockBuildId, mockToken);
        expect(result.status).toBe(status);
      }
    });
  });
});
