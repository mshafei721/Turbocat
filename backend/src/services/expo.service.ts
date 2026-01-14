import axios from 'axios';
import { logger } from '../lib/logger';
import { ApiError, ErrorCodes } from '../utils/ApiError';

export interface BuildStatus {
  status: 'in-progress' | 'finished' | 'errored';
  artifactUrl?: string;
  error?: string;
}

export class ExpoService {
  private readonly apiUrl = 'https://api.expo.dev/v2';

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/auth/loginAsync`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Expo token validation failed', { error });
      return false;
    }
  }

  async startBuild(projectId: string, platform: 'ios' | 'android', token: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/builds`,
        { platform, projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Expo build started', { buildId: response.data.id, projectId, platform });
      return response.data.id;
    } catch (error) {
      logger.error('Failed to start Expo build', { error, projectId, platform });
      throw new ApiError(500, 'Failed to start Expo build', ErrorCodes.EXTERNAL_SERVICE_ERROR);
    }
  }

  async getBuildStatus(buildId: string, token: string): Promise<BuildStatus> {
    try {
      const response = await axios.get(`${this.apiUrl}/builds/${buildId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        status: response.data.status,
        artifactUrl: response.data.artifacts?.buildUrl,
        error: response.data.error
      };
    } catch (error) {
      logger.error('Failed to get build status', { error, buildId });
      throw new ApiError(500, 'Failed to get build status', ErrorCodes.EXTERNAL_SERVICE_ERROR);
    }
  }
}

export const expoService = new ExpoService();
