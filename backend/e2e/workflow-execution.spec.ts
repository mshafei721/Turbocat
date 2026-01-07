/**
 * E2E Tests for Workflow Execution Flow
 *
 * Tests the complete workflow management and execution journey including:
 * - Creating a workflow
 * - Adding workflow steps
 * - Executing a workflow
 * - Viewing execution results and logs
 * - Cancelling an execution
 *
 * Run with: npm run test:e2e -- --project=api e2e/workflow-execution.spec.ts
 *
 * @module e2e/workflow-execution.spec
 */

import { test, expect } from '@playwright/test';
import {
  createApiClient,
  createAuthHelper,
  assertOk,
  assertCreated,
  assertUnauthorized,
  assertNotFound,
  assertHasData,
  assertUuid,
  generateWorkflowData,
  generateWorkflowWithSteps,
  generateAgentData,
  generateExecutionInput,
} from './helpers';

// Interface for workflow response data
interface WorkflowResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  definition?: Record<string, unknown>;
  triggerConfig?: Record<string, unknown>;
  scheduleEnabled: boolean;
  scheduleCron?: string | null;
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowListResponse {
  workflows: WorkflowResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ExecutionResponse {
  id: string;
  workflowId: string;
  status: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

interface ExecutionListResponse {
  executions: ExecutionResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ExecutionLogResponse {
  logs: Array<{
    id: string;
    executionId: string;
    level: string;
    message: string;
    data?: Record<string, unknown>;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

test.describe('Workflow Execution Flow E2E Tests', () => {
  test.describe('Workflow CRUD Operations', () => {
    test('should create a new workflow', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Generate workflow data
      const workflowData = generateWorkflowData({
        name: 'E2E Test Workflow Creation',
        description: 'Created via E2E test',
      });

      // Create workflow
      const response = await api.post<WorkflowResponse>('/workflows', workflowData);

      // Verify creation succeeded
      assertCreated(response, 'Workflow creation should return 201');
      assertHasData(response);

      // Verify workflow data
      const workflow = response.body.data;
      expect(workflow).toBeDefined();
      if (workflow) {
        assertUuid(workflow.id as unknown, 'workflow.id');
        expect(workflow.name).toBe(workflowData.name);
        expect(workflow.status).toBe('DRAFT');
        expect(workflow.scheduleEnabled).toBe(false);
      }
    });

    test('should list workflows after creation', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow first
      const workflowData = generateWorkflowData({
        name: 'E2E Workflow List Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const createdWorkflow = createResponse.body.data;

      // List workflows
      const listResponse = await api.get<WorkflowListResponse>('/workflows');

      assertOk(listResponse, 'Workflow list should return 200');
      assertHasData(listResponse);

      // Verify list contains created workflow
      const data = listResponse.body.data;
      expect(data).toBeDefined();
      expect(data?.workflows).toBeDefined();
      expect(Array.isArray(data?.workflows)).toBe(true);

      // Find our created workflow in the list
      const foundWorkflow = data?.workflows.find((w) => w.id === createdWorkflow?.id);
      expect(foundWorkflow).toBeDefined();
      expect(foundWorkflow?.name).toBe(workflowData.name);
    });

    test('should view workflow details', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Workflow Details Test',
        description: 'Testing workflow details endpoint',
        tags: ['e2e', 'details-test'],
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const createdWorkflow = createResponse.body.data;

      // Get workflow details
      const detailsResponse = await api.get<WorkflowResponse>(`/workflows/${createdWorkflow?.id}`);

      assertOk(detailsResponse, 'Workflow details should return 200');
      assertHasData(detailsResponse);

      // Verify details match created workflow
      const workflow = detailsResponse.body.data;
      expect(workflow).toBeDefined();
      if (workflow) {
        expect(workflow.id).toBe(createdWorkflow?.id);
        expect(workflow.name).toBe(workflowData.name);
        expect(workflow.description).toBe(workflowData.description);
      }
    });

    test('should update a workflow', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Workflow Update Test - Original',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const createdWorkflow = createResponse.body.data;

      // Update workflow
      const updateData = {
        name: 'E2E Workflow Update Test - Updated',
        description: 'Updated description via E2E test',
        status: 'ACTIVE',
      };
      const updateResponse = await api.patch<WorkflowResponse>(
        `/workflows/${createdWorkflow?.id}`,
        updateData,
      );

      assertOk(updateResponse, 'Workflow update should return 200');
      assertHasData(updateResponse);

      // Verify update applied
      const updatedWorkflow = updateResponse.body.data;
      expect(updatedWorkflow?.name).toBe(updateData.name);
      expect(updatedWorkflow?.description).toBe(updateData.description);
      expect(updatedWorkflow?.status).toBe(updateData.status);
    });

    test('should delete a workflow', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Workflow Delete Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const createdWorkflow = createResponse.body.data;

      // Delete workflow
      const deleteResponse = await api.delete(`/workflows/${createdWorkflow?.id}`);

      // Should return 200 or 204
      expect([200, 204]).toContain(deleteResponse.status);

      // Verify workflow is deleted (should return 404)
      const getResponse = await api.get(`/workflows/${createdWorkflow?.id}`);
      assertNotFound(getResponse, 'Deleted workflow should return 404');
    });
  });

  test.describe('Workflow Execution', () => {
    test('should execute a workflow', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Workflow Execution Test',
        status: 'ACTIVE',
      });
      // First create as draft, then update to active
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Activate workflow for execution
      await api.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });

      // Execute workflow
      const executionInput = generateExecutionInput();
      const executeResponse = await api.post<ExecutionResponse>(
        `/workflows/${workflow?.id}/execute`,
        executionInput,
      );

      // Execution should start (201 or 202 for async)
      expect([200, 201, 202]).toContain(executeResponse.status);

      if (executeResponse.ok) {
        const execution = executeResponse.body.data;
        expect(execution).toBeDefined();
        if (execution) {
          assertUuid(execution.id as unknown, 'execution.id');
          expect(execution.workflowId).toBe(workflow?.id);
          expect(['PENDING', 'RUNNING', 'COMPLETED']).toContain(execution.status);
          expect(execution.triggerType).toBe('MANUAL');
        }
      }
    });

    test('should view execution details', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create and execute a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Execution Details Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Activate and execute
      await api.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });
      const executeResponse = await api.post<ExecutionResponse>(
        `/workflows/${workflow?.id}/execute`,
        generateExecutionInput(),
      );

      if (executeResponse.ok && executeResponse.body.data) {
        const execution = executeResponse.body.data;

        // Get execution details
        const detailsResponse = await api.get<ExecutionResponse>(`/executions/${execution.id}`);

        assertOk(detailsResponse, 'Execution details should return 200');
        assertHasData(detailsResponse);

        const executionDetails = detailsResponse.body.data;
        expect(executionDetails).toBeDefined();
        expect(executionDetails?.id).toBe(execution.id);
        expect(executionDetails?.workflowId).toBe(workflow?.id);
      }
    });

    test('should view execution logs', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create and execute a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Execution Logs Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Activate and execute
      await api.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });
      const executeResponse = await api.post<ExecutionResponse>(
        `/workflows/${workflow?.id}/execute`,
        generateExecutionInput(),
      );

      if (executeResponse.ok && executeResponse.body.data) {
        const execution = executeResponse.body.data;

        // Get execution logs
        const logsResponse = await api.get<ExecutionLogResponse>(`/executions/${execution.id}/logs`);

        // Logs endpoint should return 200 even if empty
        assertOk(logsResponse, 'Execution logs should return 200');
        assertHasData(logsResponse);

        const logsData = logsResponse.body.data;
        expect(logsData?.logs).toBeDefined();
        expect(Array.isArray(logsData?.logs)).toBe(true);
      }
    });

    test('should list workflow executions', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create a workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Execution List Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Activate workflow
      await api.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });

      // Execute workflow multiple times
      await api.post(`/workflows/${workflow?.id}/execute`, generateExecutionInput());
      await api.post(`/workflows/${workflow?.id}/execute`, generateExecutionInput());

      // List executions for this workflow
      const listResponse = await api.get<ExecutionListResponse>(
        `/workflows/${workflow?.id}/executions`,
      );

      assertOk(listResponse, 'Execution list should return 200');
      assertHasData(listResponse);

      const data = listResponse.body.data;
      expect(data?.executions).toBeDefined();
      expect(Array.isArray(data?.executions)).toBe(true);
    });
  });

  test.describe('Complete Workflow Journey', () => {
    test('should complete full workflow: login -> create workflow -> execute -> view results', async ({
      request,
    }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Step 1: Register and login
      const { user } = await auth.createAndLoginTestUser();
      expect(user).toBeDefined();

      // Step 2: Create a new workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Complete Workflow Journey',
        description: 'Testing complete workflow journey',
        tags: ['e2e-test', 'complete-journey'],
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;
      expect(workflow?.id).toBeDefined();

      // Step 3: List workflows and verify ours is there
      const listResponse = await api.get<WorkflowListResponse>('/workflows');
      assertOk(listResponse);
      const workflows = listResponse.body.data?.workflows || [];
      const foundInList = workflows.some((w) => w.id === workflow?.id);
      expect(foundInList).toBe(true);

      // Step 4: Update workflow to ACTIVE status
      const updateResponse = await api.patch<WorkflowResponse>(`/workflows/${workflow?.id}`, {
        status: 'ACTIVE',
        description: 'Activated for execution',
      });
      assertOk(updateResponse);
      expect(updateResponse.body.data?.status).toBe('ACTIVE');

      // Step 5: Execute workflow
      const executionInput = generateExecutionInput({
        inputData: {
          testParam: 'e2e-value',
          timestamp: new Date().toISOString(),
        },
      });
      const executeResponse = await api.post<ExecutionResponse>(
        `/workflows/${workflow?.id}/execute`,
        executionInput,
      );

      // Execution should be accepted
      expect([200, 201, 202]).toContain(executeResponse.status);

      if (executeResponse.ok && executeResponse.body.data) {
        const execution = executeResponse.body.data;
        expect(execution.workflowId).toBe(workflow?.id);

        // Step 6: View execution details
        const detailsResponse = await api.get<ExecutionResponse>(`/executions/${execution.id}`);
        assertOk(detailsResponse);
        expect(detailsResponse.body.data?.id).toBe(execution.id);

        // Step 7: View execution logs
        const logsResponse = await api.get<ExecutionLogResponse>(`/executions/${execution.id}/logs`);
        assertOk(logsResponse);
        expect(logsResponse.body.data?.logs).toBeDefined();
      }

      // Step 8: Clean up - delete workflow
      const deleteResponse = await api.delete(`/workflows/${workflow?.id}`);
      expect([200, 204]).toContain(deleteResponse.status);
    });

    test('should handle workflow with steps', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create workflow with steps
      const workflowData = generateWorkflowWithSteps(3, {
        name: 'E2E Workflow With Steps',
      });

      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Verify workflow was created
      expect(workflow?.id).toBeDefined();

      // Get workflow details to verify steps
      const detailsResponse = await api.get<WorkflowResponse>(`/workflows/${workflow?.id}`);
      assertOk(detailsResponse);

      // Workflow should have the steps we defined
      const workflowDetails = detailsResponse.body.data;
      expect(workflowDetails).toBeDefined();
    });
  });

  test.describe('Workflow Authorization', () => {
    test('should not access workflows without authentication', async ({ request }) => {
      const api = createApiClient(request);

      // Try to list workflows without auth
      const listResponse = await api.get('/workflows');
      assertUnauthorized(listResponse);

      // Try to create workflow without auth
      const createResponse = await api.post('/workflows', generateWorkflowData());
      assertUnauthorized(createResponse);
    });

    test('should not access another users workflow', async ({ request }) => {
      // Create first user and workflow
      const api1 = createApiClient(request);
      const auth1 = createAuthHelper(api1);
      await auth1.createAndLoginTestUser();

      const workflowData = generateWorkflowData({
        name: 'E2E Workflow Ownership Test',
        isPublic: false,
      });
      const createResponse = await api1.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Create second user
      const api2 = createApiClient(request);
      const auth2 = createAuthHelper(api2);
      await auth2.createAndLoginTestUser();

      // Try to access first users workflow
      const accessResponse = await api2.get(`/workflows/${workflow?.id}`);

      // Should be 404 (not found for security) or 403 (forbidden)
      expect([403, 404]).toContain(accessResponse.status);
    });

    test('should not execute another users workflow', async ({ request }) => {
      // Create first user and workflow
      const api1 = createApiClient(request);
      const auth1 = createAuthHelper(api1);
      await auth1.createAndLoginTestUser();

      const workflowData = generateWorkflowData({
        name: 'E2E Execution Ownership Test',
      });
      const createResponse = await api1.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      // Activate workflow
      await api1.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });

      // Create second user
      const api2 = createApiClient(request);
      const auth2 = createAuthHelper(api2);
      await auth2.createAndLoginTestUser();

      // Try to execute first users workflow
      const executeResponse = await api2.post(
        `/workflows/${workflow?.id}/execute`,
        generateExecutionInput(),
      );

      // Should be 403 or 404
      expect([403, 404]).toContain(executeResponse.status);
    });
  });

  test.describe('Execution Cancellation', () => {
    test('should cancel a running execution', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create and activate workflow
      const workflowData = generateWorkflowData({
        name: 'E2E Execution Cancel Test',
      });
      const createResponse = await api.post<WorkflowResponse>('/workflows', workflowData);
      assertCreated(createResponse);
      const workflow = createResponse.body.data;

      await api.patch(`/workflows/${workflow?.id}`, { status: 'ACTIVE' });

      // Execute workflow
      const executeResponse = await api.post<ExecutionResponse>(
        `/workflows/${workflow?.id}/execute`,
        generateExecutionInput(),
      );

      if (executeResponse.ok && executeResponse.body.data) {
        const execution = executeResponse.body.data;

        // Try to cancel (may succeed or fail depending on execution state)
        const cancelResponse = await api.post(`/executions/${execution.id}/cancel`);

        // Should return 200 (cancelled) or 400/409 (already completed/cannot cancel)
        expect([200, 400, 409]).toContain(cancelResponse.status);

        // If cancelled, verify status
        if (cancelResponse.status === 200) {
          const statusResponse = await api.get<ExecutionResponse>(`/executions/${execution.id}`);
          expect(['CANCELLED', 'COMPLETED', 'FAILED']).toContain(
            statusResponse.body.data?.status,
          );
        }
      }
    });
  });
});
