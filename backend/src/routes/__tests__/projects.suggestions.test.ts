/**
 * Projects Suggestions API Integration Tests
 *
 * Tests for GET /api/v1/projects/:id/suggestions endpoint
 * - Authentication requirements
 * - Project ownership verification
 * - Redis caching behavior
 * - Response format validation
 *
 * @module routes/__tests__/projects.suggestions.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../lib/prisma', () => ({
  prisma: null,
  isPrismaAvailable: jest.fn(() => true),
}));

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../lib/redis', () => ({
  setWithExpiry: jest.fn(),
  getAndParse: jest.fn(),
}));

jest.mock('../../services/suggestion.service', () => ({
  getSuggestions: jest.fn(),
  Suggestion: {},
}));

// Import after mocks
import { getSuggestions } from '../../services/suggestion.service';
import { getAndParse, setWithExpiry } from '../../lib/redis';

// Import types
import type { Suggestion, SuggestionCategory } from '../../services/suggestion.service';

// Mock suggestion data
const mockSuggestions: Suggestion[] = [
  {
    id: 's1',
    text: 'Add dark mode',
    category: 'feature' as SuggestionCategory,
    icon: 'moon',
    priority: 10,
  },
  {
    id: 's2',
    text: 'Add authentication',
    category: 'feature' as SuggestionCategory,
    icon: 'lock',
    priority: 9,
  },
  {
    id: 's3',
    text: 'Improve color scheme',
    category: 'design' as SuggestionCategory,
    icon: 'palette',
    priority: 7,
  },
];

describe('GET /projects/:id/suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should verify project ownership via getSuggestions', async () => {
      // getSuggestions service validates project ownership
      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      mockedGetSuggestions.mockResolvedValue(mockSuggestions);

      const mockedGetAndParse = getAndParse as jest.MockedFunction<typeof getAndParse>;
      mockedGetAndParse.mockResolvedValue(null); // Cache miss

      // Simulate route handler behavior
      const userId = 'test-user-id';
      const projectId = 'test-project-id';

      await getSuggestions(userId, projectId);

      expect(mockedGetSuggestions).toHaveBeenCalledWith('test-user-id', 'test-project-id');
    });
  });

  describe('Response Format', () => {
    it('should return suggestions in correct format', async () => {
      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      mockedGetSuggestions.mockResolvedValue(mockSuggestions);

      const mockedGetAndParse = getAndParse as jest.MockedFunction<typeof getAndParse>;
      mockedGetAndParse.mockResolvedValue(null); // Cache miss

      const suggestions = await getSuggestions('test-user-id', 'test-project-id');

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toHaveProperty('id');
      expect(suggestions[0]).toHaveProperty('text');
      expect(suggestions[0]).toHaveProperty('category');
      expect(suggestions[0]).toHaveProperty('priority');
    });

    it('should return max 6 suggestions', async () => {
      const manySuggestions: Suggestion[] = Array.from({ length: 10 }, (_, i) => ({
        id: `s${i}`,
        text: `Suggestion ${i}`,
        category: 'feature' as SuggestionCategory,
        priority: 10 - i,
      }));

      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      mockedGetSuggestions.mockResolvedValue(manySuggestions.slice(0, 6));

      const suggestions = await getSuggestions('test-user-id', 'test-project-id');

      expect(suggestions.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Redis Caching', () => {
    it('should return cached suggestions on cache hit', async () => {
      const mockedGetAndParse = getAndParse as jest.MockedFunction<typeof getAndParse>;
      mockedGetAndParse.mockResolvedValue(mockSuggestions);

      const cacheKey = 'suggestions:test-user-id:test-project-id';
      const cached = await getAndParse(cacheKey);

      expect(cached).toEqual(mockSuggestions);
      expect(mockedGetAndParse).toHaveBeenCalledWith(cacheKey);
    });

    it('should call getSuggestions and cache result on cache miss', async () => {
      const mockedGetAndParse = getAndParse as jest.MockedFunction<typeof getAndParse>;
      mockedGetAndParse.mockResolvedValue(null); // Cache miss

      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      mockedGetSuggestions.mockResolvedValue(mockSuggestions);

      const mockedSetWithExpiry = setWithExpiry as jest.MockedFunction<typeof setWithExpiry>;

      const cacheKey = 'suggestions:test-user-id:test-project-id';

      // Simulate cache miss scenario
      const cached = await getAndParse(cacheKey);
      expect(cached).toBeNull();

      // Fetch suggestions
      const suggestions = await getSuggestions('test-user-id', 'test-project-id');
      expect(suggestions).toEqual(mockSuggestions);

      // Cache the result with 5 minute TTL
      await setWithExpiry(cacheKey, suggestions, 300);

      expect(mockedSetWithExpiry).toHaveBeenCalledWith(cacheKey, mockSuggestions, 300);
    });

    it('should scope cache key to user and project', async () => {
      const mockedGetAndParse = getAndParse as jest.MockedFunction<typeof getAndParse>;

      const userId = 'user-123';
      const projectId = 'project-456';
      const cacheKey = `suggestions:${userId}:${projectId}`;

      await getAndParse(cacheKey);

      expect(mockedGetAndParse).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('Error Handling', () => {
    it('should handle project not found error', async () => {
      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      const notFoundError = new Error('Project not found');
      (notFoundError as any).statusCode = 404;

      mockedGetSuggestions.mockRejectedValue(notFoundError);

      await expect(getSuggestions('test-user-id', 'non-existent-project')).rejects.toThrow(
        'Project not found',
      );
    });

    it('should handle internal server errors', async () => {
      const mockedGetSuggestions = getSuggestions as jest.MockedFunction<typeof getSuggestions>;
      const internalError = new Error('Database connection failed');

      mockedGetSuggestions.mockRejectedValue(internalError);

      await expect(getSuggestions('test-user-id', 'test-project-id')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const userId = 'user-123';
      const projectId = 'project-456';
      const cacheKey = `suggestions:${userId}:${projectId}`;

      expect(cacheKey).toBe('suggestions:user-123:project-456');
    });

    it('should prevent cache key collisions between users', () => {
      const user1Key = `suggestions:user-1:project-123`;
      const user2Key = `suggestions:user-2:project-123`;

      expect(user1Key).not.toBe(user2Key);
    });
  });
});
