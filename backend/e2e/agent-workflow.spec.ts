/**
 * E2E Tests for Agent Creation Workflow
 *
 * Tests the complete agent management journey including:
 * - Creating a new agent
 * - Listing agents
 * - Viewing agent details
 * - Updating an agent
 * - Deleting an agent
 *
 * Run with: npm run test:e2e -- --project=api e2e/agent-workflow.spec.ts
 *
 * @module e2e/agent-workflow.spec
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
  assertDataHasFields,
  assertUuid,
  generateAgentData,
  generateCodeAgent,
  generateApiAgent,
  generateLlmAgent,
} from './helpers';

// Interface for agent response data
interface AgentResponse {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  config?: Record<string, unknown>;
  capabilities?: string[];
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentListResponse {
  agents: AgentResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

test.describe('Agent Creation Workflow E2E Tests', () => {
  test.describe('Agent CRUD Operations', () => {
    test('should create a new agent', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Generate agent data
      const agentData = generateAgentData({
        name: 'E2E Test Agent Creation',
        type: 'CODE',
      });

      // Create agent
      const response = await api.post<AgentResponse>('/agents', agentData);

      // Verify creation succeeded
      assertCreated(response, 'Agent creation should return 201');
      assertHasData(response);

      // Verify agent data
      const agent = response.body.data;
      expect(agent).toBeDefined();
      if (agent) {
        assertUuid(agent.id as unknown, 'agent.id');
        expect(agent.name).toBe(agentData.name);
        expect(agent.type).toBe(agentData.type);
        expect(agent.status).toBe('DRAFT');
      }
    });

    test('should list agents after creation', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create an agent first
      const agentData = generateAgentData({
        name: 'E2E Agent List Test',
        type: 'API',
      });
      const createResponse = await api.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const createdAgent = createResponse.body.data;

      // List agents
      const listResponse = await api.get<AgentListResponse>('/agents');

      assertOk(listResponse, 'Agent list should return 200');
      assertHasData(listResponse);

      // Verify list contains created agent
      const data = listResponse.body.data;
      expect(data).toBeDefined();
      expect(data?.agents).toBeDefined();
      expect(Array.isArray(data?.agents)).toBe(true);

      // Find our created agent in the list
      const foundAgent = data?.agents.find((a) => a.id === createdAgent?.id);
      expect(foundAgent).toBeDefined();
      expect(foundAgent?.name).toBe(agentData.name);
    });

    test('should view agent details', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create an agent
      const agentData = generateCodeAgent({
        name: 'E2E Agent Details Test',
      });
      const createResponse = await api.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const createdAgent = createResponse.body.data;

      // Get agent details
      const detailsResponse = await api.get<AgentResponse>(`/agents/${createdAgent?.id}`);

      assertOk(detailsResponse, 'Agent details should return 200');
      assertHasData(detailsResponse);

      // Verify details match created agent
      const agent = detailsResponse.body.data;
      expect(agent).toBeDefined();
      if (agent) {
        expect(agent.id).toBe(createdAgent?.id);
        expect(agent.name).toBe(agentData.name);
        expect(agent.type).toBe('CODE');
        expect(agent.config).toBeDefined();
      }
    });

    test('should update an agent', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create an agent
      const agentData = generateAgentData({
        name: 'E2E Agent Update Test - Original',
        type: 'DATA',
      });
      const createResponse = await api.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const createdAgent = createResponse.body.data;

      // Update agent
      const updateData = {
        name: 'E2E Agent Update Test - Updated',
        description: 'Updated description via E2E test',
        status: 'ACTIVE',
      };
      const updateResponse = await api.patch<AgentResponse>(
        `/agents/${createdAgent?.id}`,
        updateData,
      );

      assertOk(updateResponse, 'Agent update should return 200');
      assertHasData(updateResponse);

      // Verify update applied
      const updatedAgent = updateResponse.body.data;
      expect(updatedAgent?.name).toBe(updateData.name);
      expect(updatedAgent?.description).toBe(updateData.description);
      expect(updatedAgent?.status).toBe(updateData.status);
    });

    test('should delete an agent', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create an agent
      const agentData = generateAgentData({
        name: 'E2E Agent Delete Test',
      });
      const createResponse = await api.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const createdAgent = createResponse.body.data;

      // Delete agent
      const deleteResponse = await api.delete(`/agents/${createdAgent?.id}`);

      // Should return 200 or 204
      expect([200, 204]).toContain(deleteResponse.status);

      // Verify agent is deleted (should return 404)
      const getResponse = await api.get(`/agents/${createdAgent?.id}`);
      assertNotFound(getResponse, 'Deleted agent should return 404');
    });
  });

  test.describe('Complete Agent Journey', () => {
    test('should complete full agent workflow: login -> create -> list -> details -> update -> delete', async ({
      request,
    }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Step 1: Register and login
      const { user } = await auth.createAndLoginTestUser();
      expect(user).toBeDefined();

      // Step 2: Create a new agent
      const agentData = generateLlmAgent({
        name: 'E2E Complete Journey Agent',
        description: 'Created during E2E complete journey test',
      });
      const createResponse = await api.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const createdAgent = createResponse.body.data;
      expect(createdAgent?.id).toBeDefined();

      // Step 3: List agents and verify ours is there
      const listResponse = await api.get<AgentListResponse>('/agents');
      assertOk(listResponse);
      const agents = listResponse.body.data?.agents || [];
      const foundInList = agents.some((a) => a.id === createdAgent?.id);
      expect(foundInList).toBe(true);

      // Step 4: View agent details
      const detailsResponse = await api.get<AgentResponse>(`/agents/${createdAgent?.id}`);
      assertOk(detailsResponse);
      expect(detailsResponse.body.data?.name).toBe(agentData.name);
      expect(detailsResponse.body.data?.type).toBe('LLM');

      // Step 5: Update agent
      const updateResponse = await api.patch<AgentResponse>(`/agents/${createdAgent?.id}`, {
        name: 'E2E Complete Journey Agent - Updated',
        status: 'ACTIVE',
        tags: ['e2e-test', 'complete-journey', 'updated'],
      });
      assertOk(updateResponse);
      expect(updateResponse.body.data?.name).toContain('Updated');
      expect(updateResponse.body.data?.status).toBe('ACTIVE');

      // Step 6: Delete agent
      const deleteResponse = await api.delete(`/agents/${createdAgent?.id}`);
      expect([200, 204]).toContain(deleteResponse.status);

      // Step 7: Verify deletion
      const verifyDeleteResponse = await api.get(`/agents/${createdAgent?.id}`);
      assertNotFound(verifyDeleteResponse);
    });

    test('should create multiple agents of different types', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create CODE agent
      const codeAgent = generateCodeAgent({ name: 'E2E Code Agent' });
      const codeResponse = await api.post<AgentResponse>('/agents', codeAgent);
      assertCreated(codeResponse);

      // Create API agent
      const apiAgent = generateApiAgent({ name: 'E2E API Agent' });
      const apiResponse = await api.post<AgentResponse>('/agents', apiAgent);
      assertCreated(apiResponse);

      // Create LLM agent
      const llmAgent = generateLlmAgent({ name: 'E2E LLM Agent' });
      const llmResponse = await api.post<AgentResponse>('/agents', llmAgent);
      assertCreated(llmResponse);

      // List all agents
      const listResponse = await api.get<AgentListResponse>('/agents');
      assertOk(listResponse);

      // Verify all three agents exist
      const agents = listResponse.body.data?.agents || [];
      expect(agents.length).toBeGreaterThanOrEqual(3);

      const types = agents.map((a) => a.type);
      expect(types).toContain('CODE');
      expect(types).toContain('API');
      expect(types).toContain('LLM');
    });
  });

  test.describe('Agent Authorization', () => {
    test('should not access agents without authentication', async ({ request }) => {
      const api = createApiClient(request);

      // Try to list agents without auth
      const listResponse = await api.get('/agents');
      assertUnauthorized(listResponse);

      // Try to create agent without auth
      const createResponse = await api.post('/agents', generateAgentData());
      assertUnauthorized(createResponse);
    });

    test('should not access another users agent', async ({ request }) => {
      // Create first user and agent
      const api1 = createApiClient(request);
      const auth1 = createAuthHelper(api1);
      await auth1.createAndLoginTestUser();

      const agentData = generateAgentData({
        name: 'E2E Agent Ownership Test',
        isPublic: false,
      });
      const createResponse = await api1.post<AgentResponse>('/agents', agentData);
      assertCreated(createResponse);
      const agent = createResponse.body.data;

      // Create second user
      const api2 = createApiClient(request);
      const auth2 = createAuthHelper(api2);
      await auth2.createAndLoginTestUser();

      // Try to access first users agent
      const accessResponse = await api2.get(`/agents/${agent?.id}`);

      // Should be 404 (not found for security) or 403 (forbidden)
      expect([403, 404]).toContain(accessResponse.status);
    });
  });

  test.describe('Agent Filtering and Pagination', () => {
    test('should filter agents by type', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create agents of different types
      await api.post('/agents', generateCodeAgent({ name: 'E2E Filter Test Code' }));
      await api.post('/agents', generateApiAgent({ name: 'E2E Filter Test API' }));

      // Filter by CODE type
      const codeFilterResponse = await api.get<AgentListResponse>('/agents', {
        params: { type: 'CODE' },
      });
      assertOk(codeFilterResponse);

      const codeAgents = codeFilterResponse.body.data?.agents || [];
      expect(codeAgents.every((a) => a.type === 'CODE')).toBe(true);
    });

    test('should paginate agent list', async ({ request }) => {
      const api = createApiClient(request);
      const auth = createAuthHelper(api);

      // Authenticate
      await auth.createAndLoginTestUser();

      // Create multiple agents
      for (let i = 0; i < 5; i++) {
        await api.post(
          '/agents',
          generateAgentData({ name: `E2E Pagination Test Agent ${i + 1}` }),
        );
      }

      // Request first page with small page size
      const page1Response = await api.get<AgentListResponse>('/agents', {
        params: { page: 1, pageSize: 2 },
      });
      assertOk(page1Response);

      const pagination = page1Response.body.data?.pagination;
      expect(pagination).toBeDefined();
      expect(pagination?.page).toBe(1);
      expect(pagination?.pageSize).toBe(2);
      expect(page1Response.body.data?.agents.length).toBeLessThanOrEqual(2);

      // If there are more pages, request next page
      if (pagination?.hasNextPage) {
        const page2Response = await api.get<AgentListResponse>('/agents', {
          params: { page: 2, pageSize: 2 },
        });
        assertOk(page2Response);
        expect(page2Response.body.data?.pagination?.page).toBe(2);
      }
    });
  });
});
