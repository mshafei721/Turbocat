/**
 * Chat Service - Epic 2: Dashboard & Projects
 *
 * This service manages chat messages for projects.
 * Chat messages are stored in the ChatMessage table and linked to workflows.
 *
 * @module services/chat.service
 */

import { Prisma } from '@prisma/client';
import { prisma, isPrismaAvailable } from '../lib/prisma';
import { logger } from '../lib/logger';
import { ApiError } from '../utils/ApiError';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Chat message role
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message DTO
 */
export interface ChatMessageDTO {
  id: string;
  workflowId: string;
  role: ChatRole;
  content: string;
  metadata: Record<string, unknown>;
  toolCalls: unknown[];
  createdAt: Date;
}

/**
 * Input for creating a chat message
 */
export interface CreateChatMessageInput {
  role: ChatRole;
  content: string;
  metadata?: Record<string, unknown>;
  toolCalls?: unknown[];
}

// =============================================================================
// CHAT SERVICE
// =============================================================================

/**
 * Get chat history for a project
 */
export async function getChatHistory(
  workflowId: string,
  userId: string,
): Promise<ChatMessageDTO[]> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Verify ownership
    const workflow = await prisma!.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true, deletedAt: true },
    });

    if (!workflow) {
      throw ApiError.notFound('Project not found');
    }

    if (workflow.deletedAt) {
      throw ApiError.notFound('Project not found');
    }

    if (workflow.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Fetch messages
    const messages = await prisma!.chatMessage.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' },
    });

    logger.info(`[ChatService] Retrieved ${messages.length} messages for workflow ${workflowId}`);

    return messages.map((msg) => ({
      id: msg.id,
      workflowId: msg.workflowId,
      role: msg.role as ChatRole,
      content: msg.content,
      metadata: msg.metadata as Record<string, unknown>,
      toolCalls: msg.toolCalls as unknown[],
      createdAt: msg.createdAt,
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ChatService] Error retrieving chat history', { error, workflowId, userId });
    throw ApiError.internal('Failed to retrieve chat history');
  }
}

/**
 * Add a chat message and trigger execution
 */
export async function addChatMessage(
  workflowId: string,
  userId: string,
  input: CreateChatMessageInput,
): Promise<ChatMessageDTO> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Verify ownership
    const workflow = await prisma!.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true, deletedAt: true },
    });

    if (!workflow) {
      throw ApiError.notFound('Project not found');
    }

    if (workflow.deletedAt) {
      throw ApiError.notFound('Project not found');
    }

    if (workflow.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Create message
    const message = await prisma!.chatMessage.create({
      data: {
        workflowId,
        role: input.role,
        content: input.content,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
        toolCalls: (input.toolCalls || []) as Prisma.InputJsonValue,
      },
    });

    logger.info(`[ChatService] Created message ${message.id} for workflow ${workflowId}`);

    // TODO: T2.4 - Trigger workflow execution via BullMQ
    // This will be implemented when we integrate with the execution service
    // For now, we just persist the message

    return {
      id: message.id,
      workflowId: message.workflowId,
      role: message.role as ChatRole,
      content: message.content,
      metadata: message.metadata as Record<string, unknown>,
      toolCalls: message.toolCalls as unknown[],
      createdAt: message.createdAt,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ChatService] Error creating chat message', { error, workflowId, userId, input });
    throw ApiError.internal('Failed to create chat message');
  }
}

/**
 * Delete all chat messages for a workflow
 */
export async function deleteChatHistory(workflowId: string, userId: string): Promise<void> {
  if (!isPrismaAvailable()) {
    throw ApiError.serviceUnavailable('Database is not available');
  }

  try {
    // Verify ownership
    const workflow = await prisma!.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true, deletedAt: true },
    });

    if (!workflow) {
      throw ApiError.notFound('Project not found');
    }

    if (workflow.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this project');
    }

    // Delete messages (cascade will handle this, but explicit is better)
    await prisma!.chatMessage.deleteMany({
      where: { workflowId },
    });

    logger.info(`[ChatService] Deleted chat history for workflow ${workflowId}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('[ChatService] Error deleting chat history', { error, workflowId, userId });
    throw ApiError.internal('Failed to delete chat history');
  }
}
