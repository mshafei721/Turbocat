/**
 * Suggestion Service - Epic 3: Editing & Iteration Tools
 *
 * This service analyzes project state and generates contextual prompt suggestions
 * to help users iterate faster on their AI-generated apps.
 *
 * @module services/suggestion.service
 */

import { Workflow } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Suggestion categories
 */
export type SuggestionCategory = 'starter' | 'feature' | 'design' | 'enhancement';

/**
 * Suggestion interface
 */
export interface Suggestion {
  id: string;
  text: string;
  category: SuggestionCategory;
  icon?: string;
  priority: number;
}

/**
 * Project state analysis result
 */
interface ProjectState {
  hasDarkMode: boolean;
  hasAuth: boolean;
  hasAnimations: boolean;
  hasNavigation: boolean;
  messageCount: number;
}

/**
 * Workflow with chat messages (for type safety)
 */
interface WorkflowWithMessages extends Workflow {
  chatMessages: Array<{
    id: string;
    content: string;
    createdAt: Date;
  }>;
}

// =============================================================================
// SUGGESTION SERVICE
// =============================================================================

/**
 * Get suggestions for a project
 *
 * Returns starter suggestions for new projects (<= 1 message)
 * and contextual suggestions for existing projects.
 *
 * @param userId - User ID (for ownership verification)
 * @param projectId - Project/Workflow ID
 * @returns Promise<Suggestion[]> - Max 6 suggestions sorted by priority
 * @throws ApiError if project not found or user doesn't have access
 */
export async function getSuggestions(userId: string, projectId: string): Promise<Suggestion[]> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Verify ownership and fetch project with chat messages
    const project = await prisma!.workflow.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Initial suggestions for new projects
    if (project.chatMessages.length <= 1) {
      const suggestions = getStarterSuggestions(project.platform);
      logger.info(
        `[SuggestionService] Generated ${suggestions.length} starter suggestions for project ${projectId}`,
      );
      return suggestions;
    }

    // Contextual suggestions based on conversation
    const suggestions = getContextualSuggestions(project as WorkflowWithMessages);
    logger.info(
      `[SuggestionService] Generated ${suggestions.length} contextual suggestions for project ${projectId}`,
    );
    return suggestions;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[SuggestionService] Error generating suggestions', {
      error,
      userId,
      projectId,
    });
    throw ApiError.internal('Failed to generate suggestions');
  }
}

/**
 * Get starter suggestions for new projects
 *
 * Returns common starter prompts with platform-specific additions.
 *
 * @param platform - Project platform ('web' | 'mobile' | 'both' | null)
 * @returns Suggestion[] - Top 6 starter suggestions
 */
function getStarterSuggestions(platform: string | null): Suggestion[] {
  const starters: Suggestion[] = [
    { id: 's1', text: 'AI Chat', category: 'starter', icon: 'chat', priority: 10 },
    { id: 's2', text: 'Mood Tracker', category: 'starter', icon: 'heart', priority: 9 },
    { id: 's3', text: 'Social app', category: 'starter', icon: 'users', priority: 8 },
    { id: 's4', text: 'Plant Care', category: 'starter', icon: 'leaf', priority: 7 },
    { id: 's5', text: 'Workout Timer', category: 'starter', icon: 'timer', priority: 6 },
  ];

  if (platform === 'mobile') {
    starters.push(
      { id: 's6', text: 'Habit Tracker', category: 'starter', icon: 'check-circle', priority: 5 },
      { id: 's7', text: 'Recipe Book', category: 'starter', icon: 'book', priority: 4 },
    );
  } else if (platform === 'web') {
    starters.push(
      { id: 's8', text: 'Portfolio Site', category: 'starter', icon: 'briefcase', priority: 5 },
      { id: 's9', text: 'Blog Platform', category: 'starter', icon: 'pencil', priority: 4 },
    );
  }

  return starters.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

/**
 * Get contextual suggestions based on project state
 *
 * Analyzes chat history to detect missing features and suggests improvements.
 *
 * @param project - Workflow with chat messages
 * @returns Suggestion[] - Top 6 contextual suggestions
 */
function getContextualSuggestions(project: WorkflowWithMessages): Suggestion[] {
  const state = analyzeProjectState(project);
  const suggestions: Suggestion[] = [];

  // Feature suggestions based on missing features
  if (!state.hasDarkMode) {
    suggestions.push({
      id: 'f1',
      text: 'Add dark mode',
      category: 'feature',
      icon: 'moon',
      priority: 10,
    });
  }

  if (!state.hasAuth) {
    suggestions.push({
      id: 'f2',
      text: 'Add authentication',
      category: 'feature',
      icon: 'lock',
      priority: 9,
    });
  }

  if (!state.hasAnimations) {
    suggestions.push({
      id: 'd1',
      text: 'Add animations',
      category: 'design',
      icon: 'sparkle',
      priority: 8,
    });
  }

  // Design improvements (always suggested)
  suggestions.push(
    {
      id: 'd2',
      text: 'Improve color scheme',
      category: 'design',
      icon: 'palette',
      priority: 7,
    },
    {
      id: 'e1',
      text: 'Add loading states',
      category: 'enhancement',
      icon: 'spinner',
      priority: 6,
    },
    {
      id: 'e2',
      text: 'Improve accessibility',
      category: 'enhancement',
      icon: 'accessibility',
      priority: 5,
    },
  );

  // Navigation suggestion for projects with many messages
  if (state.messageCount > 5 && !state.hasNavigation) {
    suggestions.push({
      id: 'f3',
      text: 'Add navigation',
      category: 'feature',
      icon: 'compass',
      priority: 8,
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

/**
 * Analyze project state by scanning chat history
 *
 * Uses regex patterns to detect existing features in the conversation.
 *
 * @param project - Workflow with chat messages
 * @returns ProjectState - Feature flags and message count
 */
function analyzeProjectState(project: WorkflowWithMessages): ProjectState {
  const messages = project.chatMessages.map((m) => m.content.toLowerCase());
  const allText = messages.join(' ');

  return {
    hasDarkMode: /dark\s*mode|theme\s*toggle|light.*dark/.test(allText),
    hasAuth: /auth|login|sign\s*in|register|sign\s*up/.test(allText),
    hasAnimations: /animation|animate|transition|motion/.test(allText),
    hasNavigation: /navigation|nav\s*bar|tab\s*bar|drawer|menu/.test(allText),
    messageCount: messages.length,
  };
}
