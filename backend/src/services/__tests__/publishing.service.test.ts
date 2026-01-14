/**
 * Publishing Service Unit Tests
 *
 * Tests the PublishingService which orchestrates Apple, Expo, encryption,
 * and database operations for the publishing pipeline.
 *
 * @module services/__tests__/publishing.service.test
 */

import { PublishingService, PublishData } from '../publishing.service';
import { AppleService } from '../apple.service';
import { ExpoService } from '../expo.service';
import { PrismaClient, PublishingStatus } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import * as encryption from '../../utils/encryption';

// Mock dependencies
jest.mock('../apple.service');
jest.mock('../expo.service');
jest.mock('../../utils/encryption');
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Prisma Client
const createMockPrismaClient = () => ({
  workflow: {
    findFirst: jest.fn(),
  },
  publishing: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

describe('PublishingService', () => {
  let service: PublishingService;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let mockAppleService: AppleService;
  let mockExpoService: ExpoService;

  const mockUserId = 'user-123';
  const mockProjectId = 'project-456';
  const mockPublishingId = 'publishing-789';

  const mockPublishData: PublishData = {
    appleTeamId: 'TEAM123',
    appleKeyId: 'KEY123',
    appleIssuerId: 'ISSUER-UUID',
    applePrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
    expoToken: 'expo-token-123',
    appName: 'My Test App',
    description: 'A test application',
    category: 'Productivity',
    ageRating: '4+',
    supportUrl: 'https://example.com/support',
    iconUrl: 'https://example.com/icon.png',
  };

  const mockEncryptedData = {
    iv: 'mock-iv-base64',
    content: 'mock-content-base64',
    tag: 'mock-tag-base64',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockPrisma = createMockPrismaClient();
    mockAppleService = new AppleService();
    mockExpoService = new ExpoService();

    // Setup encryption mocks
    jest.mocked(encryption.encrypt).mockReturnValue(mockEncryptedData);
    jest.mocked(encryption.decrypt).mockReturnValue('decrypted-value');

    // Create service instance
    service = new PublishingService(
      mockPrisma as unknown as PrismaClient,
      mockAppleService,
      mockExpoService,
    );
  });

  describe('initiatePublishing', () => {
    it('should successfully create a publishing record with valid inputs', async () => {
      // Arrange
      const mockWorkflow = {
        id: mockProjectId,
        userId: mockUserId,
        name: 'Test Workflow',
        deletedAt: null,
      };

      const mockPublishing = {
        id: mockPublishingId,
        workflowId: mockProjectId,
        status: 'INITIATED' as PublishingStatus,
        appleTeamId: mockPublishData.appleTeamId,
        bundleId: 'com.turbocat.mytestapp',
        appName: mockPublishData.appName,
      };

      mockPrisma.workflow.findFirst.mockResolvedValue(mockWorkflow);
      jest.mocked(mockAppleService.validateCredentials).mockResolvedValue(true);
      jest.mocked(mockExpoService.validateToken).mockResolvedValue(true);
      mockPrisma.publishing.create.mockResolvedValue(mockPublishing);

      // Act
      const result = await service.initiatePublishing(
        mockUserId,
        mockProjectId,
        mockPublishData,
      );

      // Assert
      expect(mockPrisma.workflow.findFirst).toHaveBeenCalledWith({
        where: { id: mockProjectId, userId: mockUserId, deletedAt: null },
      });
      expect(mockAppleService.validateCredentials).toHaveBeenCalledWith(
        mockPublishData.appleTeamId,
        mockPublishData.appleKeyId,
        mockPublishData.appleIssuerId,
        mockPublishData.applePrivateKey,
      );
      expect(mockExpoService.validateToken).toHaveBeenCalledWith(mockPublishData.expoToken);
      expect(encryption.encrypt).toHaveBeenCalledTimes(2); // privateKey and expoToken
      expect(mockPrisma.publishing.create).toHaveBeenCalled();
      expect(result).toEqual(mockPublishing);
    });

    it('should throw ApiError if project is not found', async () => {
      // Arrange
      mockPrisma.workflow.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toThrow(ApiError);

      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Project not found',
      });
    });

    it('should throw ApiError if Apple credentials are invalid', async () => {
      // Arrange
      mockPrisma.workflow.findFirst.mockResolvedValue({ id: mockProjectId, userId: mockUserId });
      jest.mocked(mockAppleService.validateCredentials).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toThrow(ApiError);

      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid Apple Developer credentials',
      });
    });

    it('should throw ApiError if Expo token is invalid', async () => {
      // Arrange
      mockPrisma.workflow.findFirst.mockResolvedValue({ id: mockProjectId, userId: mockUserId });
      jest.mocked(mockAppleService.validateCredentials).mockResolvedValue(true);
      jest.mocked(mockExpoService.validateToken).mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toThrow(ApiError);

      await expect(
        service.initiatePublishing(mockUserId, mockProjectId, mockPublishData),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid Expo token',
      });
    });

    it('should encrypt sensitive credentials before storing', async () => {
      // Arrange
      mockPrisma.workflow.findFirst.mockResolvedValue({ id: mockProjectId, userId: mockUserId });
      jest.mocked(mockAppleService.validateCredentials).mockResolvedValue(true);
      jest.mocked(mockExpoService.validateToken).mockResolvedValue(true);
      mockPrisma.publishing.create.mockResolvedValue({} as any);

      // Act
      await service.initiatePublishing(mockUserId, mockProjectId, mockPublishData);

      // Assert
      expect(encryption.encrypt).toHaveBeenCalledWith(mockPublishData.applePrivateKey);
      expect(encryption.encrypt).toHaveBeenCalledWith(mockPublishData.expoToken);
    });

    it('should generate a valid bundle ID from app name', async () => {
      // Arrange
      mockPrisma.workflow.findFirst.mockResolvedValue({ id: mockProjectId, userId: mockUserId });
      jest.mocked(mockAppleService.validateCredentials).mockResolvedValue(true);
      jest.mocked(mockExpoService.validateToken).mockResolvedValue(true);
      mockPrisma.publishing.create.mockResolvedValue({} as any);

      // Act
      await service.initiatePublishing(mockUserId, mockProjectId, mockPublishData);

      // Assert
      expect(mockPrisma.publishing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bundleId: 'com.turbocat.mytestapp',
          }),
        }),
      );
    });
  });

  describe('executeBuildAndSubmit', () => {
    const mockPublishing = {
      id: mockPublishingId,
      workflowId: mockProjectId,
      status: 'INITIATED' as PublishingStatus,
      expoToken: JSON.stringify(mockEncryptedData),
      applePrivateKey: JSON.stringify(mockEncryptedData),
      appleTeamId: 'TEAM123',
      appleKeyId: 'KEY123',
      appleIssuerId: 'ISSUER-UUID',
      workflow: {
        id: mockProjectId,
        name: 'Test Workflow',
      },
    };

    it('should successfully execute build and submit flow', async () => {
      // Arrange
      const mockBuildId = 'expo-build-123';
      const mockBuildStatus = {
        status: 'finished' as const,
        artifactUrl: 'https://expo.dev/artifacts/build.ipa',
      };

      mockPrisma.publishing.findUnique.mockResolvedValue(mockPublishing as any);
      mockPrisma.publishing.update.mockResolvedValue({} as any);
      jest.mocked(mockExpoService.startBuild).mockResolvedValue(mockBuildId);
      jest.mocked(mockExpoService.getBuildStatus).mockResolvedValue(mockBuildStatus);

      // Act
      const result = await service.executeBuildAndSubmit(mockPublishingId);

      // Assert
      expect(mockPrisma.publishing.findUnique).toHaveBeenCalledWith({
        where: { id: mockPublishingId },
        include: { workflow: true },
      });
      expect(mockExpoService.startBuild).toHaveBeenCalled();
      expect(mockExpoService.getBuildStatus).toHaveBeenCalledWith(mockBuildId, 'decrypted-value');
      expect(result).toEqual('SUBMITTED');
    });

    it('should throw ApiError if publishing record not found', async () => {
      // Arrange
      mockPrisma.publishing.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.executeBuildAndSubmit(mockPublishingId)).rejects.toThrow(ApiError);

      await expect(service.executeBuildAndSubmit(mockPublishingId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Publishing record not found',
      });
    });

    it('should update status to BUILDING when build starts', async () => {
      // Arrange
      mockPrisma.publishing.findUnique.mockResolvedValue(mockPublishing as any);
      mockPrisma.publishing.update.mockResolvedValue({} as any);
      jest.mocked(mockExpoService.startBuild).mockResolvedValue('build-123');
      jest.mocked(mockExpoService.getBuildStatus).mockResolvedValue({
        status: 'finished',
        artifactUrl: 'https://example.com/build.ipa',
      });

      // Act
      await service.executeBuildAndSubmit(mockPublishingId);

      // Assert
      expect(mockPrisma.publishing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPublishingId },
          data: expect.objectContaining({
            status: 'BUILDING',
          }),
        }),
      );
    });

    it('should update status to FAILED on build error', async () => {
      // Arrange
      mockPrisma.publishing.findUnique.mockResolvedValue(mockPublishing as any);
      mockPrisma.publishing.update.mockResolvedValue({} as any);
      jest.mocked(mockExpoService.startBuild).mockResolvedValue('build-123');
      jest.mocked(mockExpoService.getBuildStatus).mockResolvedValue({
        status: 'errored',
        error: 'Build compilation failed',
      });

      // Act
      const result = await service.executeBuildAndSubmit(mockPublishingId);

      // Assert
      expect(result).toEqual('FAILED');
      expect(mockPrisma.publishing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPublishingId },
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });

    it('should decrypt credentials before using them', async () => {
      // Arrange
      mockPrisma.publishing.findUnique.mockResolvedValue(mockPublishing as any);
      mockPrisma.publishing.update.mockResolvedValue({} as any);
      jest.mocked(mockExpoService.startBuild).mockResolvedValue('build-123');
      jest.mocked(mockExpoService.getBuildStatus).mockResolvedValue({
        status: 'finished',
        artifactUrl: 'https://example.com/build.ipa',
      });

      // Act
      await service.executeBuildAndSubmit(mockPublishingId);

      // Assert
      expect(encryption.decrypt).toHaveBeenCalledWith(mockEncryptedData);
    });
  });

  describe('updateStatus', () => {
    it('should update publishing status successfully', async () => {
      // Arrange
      const mockUpdatedPublishing = {
        id: mockPublishingId,
        status: 'BUILDING' as PublishingStatus,
        statusMessage: 'Build in progress',
      };

      mockPrisma.publishing.update.mockResolvedValue(mockUpdatedPublishing as any);

      // Act
      const result = await service.updateStatus(mockPublishingId, 'BUILDING', 'Build in progress');

      // Assert
      expect(mockPrisma.publishing.update).toHaveBeenCalledWith({
        where: { id: mockPublishingId },
        data: {
          status: 'BUILDING',
          statusMessage: 'Build in progress',
        },
      });
      expect(result).toEqual(mockUpdatedPublishing);
    });

    it('should update status without message', async () => {
      // Arrange
      mockPrisma.publishing.update.mockResolvedValue({} as any);

      // Act
      await service.updateStatus(mockPublishingId, 'SUBMITTED');

      // Assert
      expect(mockPrisma.publishing.update).toHaveBeenCalledWith({
        where: { id: mockPublishingId },
        data: {
          status: 'SUBMITTED',
          statusMessage: undefined,
        },
      });
    });
  });

  describe('generateBundleId', () => {
    it('should generate valid bundle ID from simple app name', () => {
      // Act
      const bundleId = service.generateBundleId('MyApp');

      // Assert
      expect(bundleId).toBe('com.turbocat.myapp');
    });

    it('should sanitize special characters from app name', () => {
      // Act
      const bundleId = service.generateBundleId('My Cool App! 2024');

      // Assert
      expect(bundleId).toBe('com.turbocat.mycoolapp2024');
    });

    it('should handle spaces and punctuation', () => {
      // Act
      const bundleId = service.generateBundleId('Weather-Tracker Pro!');

      // Assert
      expect(bundleId).toBe('com.turbocat.weathertrackerpro');
    });

    it('should limit bundle ID to 20 characters after prefix', () => {
      // Act
      const bundleId = service.generateBundleId('ThisIsAVeryLongApplicationNameThatExceedsLimit');

      // Assert
      expect(bundleId).toBe('com.turbocat.thisisaverylongappli');
      expect(bundleId.length).toBeLessThanOrEqual(33); // com.turbocat. (12) + 20 = 32 + 1
      // Verify sanitized part is exactly 20 chars
      const sanitizedPart = bundleId.split('.')[2];
      expect(sanitizedPart).toBeDefined();
      expect(sanitizedPart!.length).toBe(20);
    });

    it('should handle unicode characters', () => {
      // Act
      const bundleId = service.generateBundleId('Café ☕ App');

      // Assert
      expect(bundleId).toBe('com.turbocat.cafapp');
    });

    it('should handle empty or whitespace-only names', () => {
      // Act
      const bundleId = service.generateBundleId('   ');

      // Assert
      expect(bundleId).toBe('com.turbocat.');
    });

    it('should convert to lowercase', () => {
      // Act
      const bundleId = service.generateBundleId('UPPERCASE APP');

      // Assert
      expect(bundleId).toBe('com.turbocat.uppercaseapp');
    });
  });
});
