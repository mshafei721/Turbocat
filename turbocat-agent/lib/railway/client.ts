/**
 * Railway API Client Library
 * Phase 4: Mobile Development - Task 3.1
 *
 * Provides methods for container lifecycle management:
 * - createContainer(projectConfig) -> containerId, metroUrl
 * - startContainer(containerId) -> status
 * - stopContainer(containerId) -> status
 * - deleteContainer(containerId) -> success
 * - getContainerStatus(containerId) -> status, resourceUsage
 * - getContainerLogs(containerId) -> logs
 */

import {
  ContainerConfig,
  ContainerCreateResult,
  ContainerStatusResult,
  ContainerLogsResult,
  ContainerStatus,
  LogEntry,
  RailwayConfig,
  RailwayAPIError,
  RetryConfig,
} from './types'

// Railway GraphQL API endpoint
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2'

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

// Docker image for Expo Metro bundler
const EXPO_DOCKER_IMAGE = 'node:22-alpine'

// GraphQL Queries and Mutations
const GRAPHQL_QUERIES = {
  // Create a new project
  createProject: `
    mutation ProjectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
      }
    }
  `,

  // Create a service within a project
  createService: `
    mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `,

  // Deploy a service
  deployService: `
    mutation ServiceInstanceDeploy($input: ServiceInstanceDeployInput!) {
      serviceInstanceDeploy(input: $input)
    }
  `,

  // Get service domains
  getServiceDomains: `
    query ServiceDomains($projectId: String!, $serviceId: String!) {
      serviceDomains(projectId: $projectId, serviceId: $serviceId) {
        serviceDomains {
          domain
        }
      }
    }
  `,

  // Create service domain
  createServiceDomain: `
    mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        domain
      }
    }
  `,

  // Get service status
  getServiceStatus: `
    query Service($id: String!) {
      service(id: $id) {
        id
        name
        deployments {
          edges {
            node {
              id
              status
              createdAt
            }
          }
        }
      }
    }
  `,

  // Redeploy service
  redeployService: `
    mutation ServiceInstanceRedeploy($environmentId: String!, $serviceId: String!) {
      serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
    }
  `,

  // Delete service
  deleteService: `
    mutation ServiceDelete($id: String!) {
      serviceDelete(id: $id)
    }
  `,

  // Delete project
  deleteProject: `
    mutation ProjectDelete($id: String!) {
      projectDelete(id: $id)
    }
  `,

  // Get deployment logs
  getDeploymentLogs: `
    query DeploymentLogs($deploymentId: String!, $limit: Int, $filter: String) {
      deploymentLogs(deploymentId: $deploymentId, limit: $limit, filter: $filter) {
        timestamp
        message
        severity
      }
    }
  `,

  // Set environment variables
  setVariables: `
    mutation VariableUpsert($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
  `,
}

// Railway deployment status to our container status mapping
function mapDeploymentStatus(railwayStatus: string): ContainerStatus {
  switch (railwayStatus?.toUpperCase()) {
    case 'SUCCESS':
    case 'ACTIVE':
    case 'RUNNING':
      return 'running'
    case 'BUILDING':
    case 'DEPLOYING':
    case 'INITIALIZING':
    case 'WAITING':
      return 'starting'
    case 'FAILED':
    case 'CRASHED':
    case 'ERROR':
      return 'error'
    case 'REMOVED':
    case 'STOPPED':
    case 'SLEEPING':
    default:
      return 'stopped'
  }
}

// Map Railway log severity to our log level
function mapLogLevel(severity: string): LogEntry['level'] {
  switch (severity?.toUpperCase()) {
    case 'ERROR':
    case 'FATAL':
      return 'error'
    case 'WARN':
    case 'WARNING':
      return 'warn'
    case 'DEBUG':
    case 'TRACE':
      return 'debug'
    default:
      return 'info'
  }
}

// Check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof RailwayAPIError) {
    // Retry on server errors (5xx) and rate limits (429)
    if (error.statusCode) {
      return error.statusCode >= 500 || error.statusCode === 429
    }
    return error.retryable
  }

  // Retry on network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    )
  }

  return false
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Calculate exponential backoff delay
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs)
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25
  return delay + jitter
}

export interface RailwayClient {
  createContainer(config: ContainerConfig): Promise<ContainerCreateResult>
  startContainer(containerId: string): Promise<{ status: ContainerStatus }>
  stopContainer(containerId: string): Promise<{ status: ContainerStatus }>
  deleteContainer(containerId: string): Promise<boolean>
  getContainerStatus(containerId: string): Promise<ContainerStatusResult>
  getContainerLogs(containerId: string, options?: { limit?: number; cursor?: string }): Promise<ContainerLogsResult>
}

// Internal state for tracking container metadata
interface ContainerMetadata {
  projectId: string
  serviceId: string
  environmentId: string
  deploymentId?: string
}

// In-memory cache for container metadata (in production, this would be in database)
const containerMetadataCache = new Map<string, ContainerMetadata>()

/**
 * Create a Railway client with the given configuration
 */
export function createRailwayClient(config: RailwayConfig): RailwayClient {
  if (!config.apiToken) {
    throw new Error('Railway API token is required')
  }

  const baseUrl = config.baseUrl || RAILWAY_API_URL
  const retryConfig = DEFAULT_RETRY_CONFIG

  // Execute GraphQL query with retry logic
  async function executeGraphQL<T>(
    query: string,
    variables: Record<string, unknown> = {},
    retries = retryConfig.maxRetries,
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiToken}`,
          },
          body: JSON.stringify({ query, variables }),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          const errorMessage = errorBody.errors?.[0]?.message || response.statusText
          const apiError = new RailwayAPIError(
            errorMessage,
            response.status,
            undefined,
            response.status >= 500 || response.status === 429,
          )

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after')
            if (retryAfter && attempt < retries) {
              await sleep(parseInt(retryAfter, 10) * 1000)
              continue
            }
          }

          // Don't retry client errors (4xx except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw apiError
          }

          lastError = apiError
        } else {
          const result = await response.json()
          if (result.errors?.length > 0) {
            throw new RailwayAPIError(result.errors[0].message)
          }
          return result as T
        }
      } catch (error) {
        lastError = error

        // Don't retry non-retryable errors
        if (!isRetryableError(error)) {
          throw error
        }
      }

      // Wait before retrying
      if (attempt < retries) {
        await sleep(calculateBackoffDelay(attempt, retryConfig))
      }
    }

    throw lastError
  }

  return {
    async createContainer(containerConfig: ContainerConfig): Promise<ContainerCreateResult> {
      const projectName =
        containerConfig.projectName || `turbocat-mobile-${containerConfig.taskId.slice(0, 8)}`

      // Step 1: Create project
      const projectResult = await executeGraphQL<{
        data: { projectCreate: { id: string; name: string } }
      }>(GRAPHQL_QUERIES.createProject, {
        input: {
          name: projectName,
          teamId: config.teamId,
        },
      })

      const projectId = projectResult.data.projectCreate.id

      // Step 2: Create service
      const serviceResult = await executeGraphQL<{
        data: { serviceCreate: { id: string; name: string } }
      }>(GRAPHQL_QUERIES.createService, {
        input: {
          projectId,
          name: 'expo-metro',
          source: {
            image: EXPO_DOCKER_IMAGE,
          },
        },
      })

      const serviceId = serviceResult.data.serviceCreate.id

      // Step 3: Set environment variables
      const envVars = {
        EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
        REACT_NATIVE_PACKAGER_HOSTNAME: '0.0.0.0',
        ...containerConfig.envVars,
      }

      for (const [key, value] of Object.entries(envVars)) {
        await executeGraphQL(GRAPHQL_QUERIES.setVariables, {
          input: {
            projectId,
            serviceId,
            name: key,
            value,
          },
        })
      }

      // Step 4: Deploy service
      const deployResult = await executeGraphQL<{
        data: { serviceInstanceDeploy: { id: string } }
      }>(GRAPHQL_QUERIES.deployService, {
        input: {
          serviceId,
        },
      })

      const deploymentId = deployResult.data?.serviceInstanceDeploy?.id

      // Step 5: Get or create domain
      let domain: string

      try {
        const domainResult = await executeGraphQL<{
          data: { serviceDomains: { serviceDomains: Array<{ domain: string }> } }
        }>(GRAPHQL_QUERIES.getServiceDomains, {
          projectId,
          serviceId,
        })

        if (domainResult.data.serviceDomains.serviceDomains.length > 0) {
          domain = domainResult.data.serviceDomains.serviceDomains[0].domain
        } else {
          // Create a new domain
          const createDomainResult = await executeGraphQL<{
            data: { serviceDomainCreate: { domain: string } }
          }>(GRAPHQL_QUERIES.createServiceDomain, {
            input: {
              serviceId,
            },
          })
          domain = createDomainResult.data.serviceDomainCreate.domain
        }
      } catch {
        // Use a default domain format if domain retrieval fails
        domain = `${projectName}.up.railway.app`
      }

      // Store metadata for later operations
      const containerId = `${projectId}:${serviceId}`
      containerMetadataCache.set(containerId, {
        projectId,
        serviceId,
        environmentId: projectId, // In Railway, environment ID is often the project ID
        deploymentId,
      })

      return {
        containerId,
        metroUrl: `https://${domain}`,
        projectId,
        serviceId,
      }
    },

    async startContainer(containerId: string): Promise<{ status: ContainerStatus }> {
      const metadata = containerMetadataCache.get(containerId)
      if (!metadata) {
        throw new RailwayAPIError('Container metadata not found', 404)
      }

      await executeGraphQL(GRAPHQL_QUERIES.redeployService, {
        environmentId: metadata.environmentId,
        serviceId: metadata.serviceId,
      })

      return { status: 'starting' }
    },

    async stopContainer(containerId: string): Promise<{ status: ContainerStatus }> {
      const metadata = containerMetadataCache.get(containerId)
      if (!metadata) {
        // Container already removed or never existed
        return { status: 'stopped' }
      }

      try {
        await executeGraphQL(GRAPHQL_QUERIES.deleteService, {
          id: metadata.serviceId,
        })
      } catch {
        // Service may already be stopped
      }

      return { status: 'stopped' }
    },

    async deleteContainer(containerId: string): Promise<boolean> {
      const metadata = containerMetadataCache.get(containerId)
      if (!metadata) {
        // Container doesn't exist, consider it deleted
        return true
      }

      try {
        await executeGraphQL(GRAPHQL_QUERIES.deleteProject, {
          id: metadata.projectId,
        })
      } catch {
        // Project may already be deleted
      }

      containerMetadataCache.delete(containerId)
      return true
    },

    async getContainerStatus(containerId: string): Promise<ContainerStatusResult> {
      const metadata = containerMetadataCache.get(containerId)
      if (!metadata) {
        return {
          status: 'stopped',
          resourceUsage: {},
        }
      }

      const result = await executeGraphQL<{
        data: {
          service: {
            id: string
            deployments: {
              edges: Array<{
                node: {
                  status: string
                  createdAt: string
                }
              }>
            }
          }
        }
      }>(GRAPHQL_QUERIES.getServiceStatus, {
        id: metadata.serviceId,
      })

      const latestDeployment = result.data.service?.deployments?.edges?.[0]?.node
      const status = mapDeploymentStatus(latestDeployment?.status || 'STOPPED')

      // Calculate uptime if running
      let uptimeSeconds: number | undefined
      if (latestDeployment?.createdAt && status === 'running') {
        const createdAt = new Date(latestDeployment.createdAt)
        uptimeSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
      }

      return {
        status,
        resourceUsage: {
          // Railway doesn't expose real-time resource usage via API
          // These would need to come from metrics endpoints
          cpu: undefined,
          ram: undefined,
          network: undefined,
        },
        uptimeSeconds,
        lastHealthCheck: new Date(),
      }
    },

    async getContainerLogs(
      containerId: string,
      options?: { limit?: number; cursor?: string },
    ): Promise<ContainerLogsResult> {
      const metadata = containerMetadataCache.get(containerId)
      if (!metadata || !metadata.deploymentId) {
        return {
          logs: [],
          hasMore: false,
        }
      }

      const result = await executeGraphQL<{
        data: {
          deploymentLogs: Array<{
            timestamp: string
            message: string
            severity: string
          }>
          pageInfo?: {
            hasNextPage: boolean
            endCursor: string
          }
        }
      }>(GRAPHQL_QUERIES.getDeploymentLogs, {
        deploymentId: metadata.deploymentId,
        limit: options?.limit || 100,
        filter: options?.cursor,
      })

      const logs: LogEntry[] = (result.data.deploymentLogs || []).map((log) => ({
        timestamp: new Date(log.timestamp),
        level: mapLogLevel(log.severity),
        message: log.message,
        source: log.message.toLowerCase().includes('metro') ? 'metro' : 'app',
      }))

      return {
        logs,
        hasMore: result.data.pageInfo?.hasNextPage || false,
        cursor: result.data.pageInfo?.endCursor,
      }
    },
  }
}

/**
 * Get Railway client from environment variables
 */
export function getRailwayClientFromEnv(): RailwayClient {
  const apiToken = process.env.RAILWAY_API_TOKEN
  const teamId = process.env.RAILWAY_TEAM_ID

  if (!apiToken) {
    throw new Error('RAILWAY_API_TOKEN environment variable is required')
  }

  return createRailwayClient({
    apiToken,
    teamId,
  })
}
