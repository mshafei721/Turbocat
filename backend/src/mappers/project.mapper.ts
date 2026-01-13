/**
 * Project Mapper - Epic 2: Dashboard & Projects
 *
 * Maps between Workflow database model and Project DTOs
 * Projects are conceptually the same as Workflows, but with project-specific fields
 */

import { Workflow, WorkflowStatus } from '@prisma/client';

/**
 * Project Data Transfer Object
 * Frontend-facing representation of a project
 */
export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  platform: 'web' | 'mobile' | 'both' | null;
  selectedModel: string | null;
  status: 'draft' | 'active' | 'building' | 'deployed' | 'error';
  thumbnailUrl: string | null;
  previewCode: string | null;
  previewError: string | null;
  lastUpdated: Date;
  totalExecutions: number;
  createdAt: Date;
}

/**
 * Map Workflow status to Project status
 */
function mapWorkflowStatusToProjectStatus(
  status: WorkflowStatus,
): 'draft' | 'active' | 'building' | 'deployed' | 'error' {
  switch (status) {
    case WorkflowStatus.DRAFT:
      return 'draft';
    case WorkflowStatus.ACTIVE:
      return 'active';
    case WorkflowStatus.INACTIVE:
      return 'deployed'; // Inactive workflows are deployed but paused
    case WorkflowStatus.ARCHIVED:
      return 'error'; // Archived workflows had errors or were abandoned
    default:
      return 'draft';
  }
}

/**
 * Project Mapper
 * Converts between Workflow model and Project DTO
 */
export class ProjectMapper {
  /**
   * Convert Workflow to ProjectDTO
   */
  static toDTO(workflow: Workflow): ProjectDTO {
    return {
      id: workflow.id,
      name: workflow.projectName || workflow.name,
      description: workflow.description,
      platform: workflow.platform as 'web' | 'mobile' | 'both' | null,
      selectedModel: workflow.selectedModel,
      status: mapWorkflowStatusToProjectStatus(workflow.status),
      thumbnailUrl: workflow.thumbnailUrl,
      previewCode: workflow.previewCode,
      previewError: workflow.previewError,
      lastUpdated: workflow.updatedAt,
      totalExecutions: workflow.totalExecutions,
      createdAt: workflow.createdAt,
    };
  }

  /**
   * Convert array of Workflows to ProjectDTOs
   */
  static toDTOs(workflows: Workflow[]): ProjectDTO[] {
    return workflows.map((workflow) => this.toDTO(workflow));
  }
}
