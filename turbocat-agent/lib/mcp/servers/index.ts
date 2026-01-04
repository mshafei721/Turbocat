/**
 * MCP Server Configurations
 *
 * Central export point for all MCP server configurations and helpers.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/mcp/servers/index.ts
 */

export { ExaSearchHelper, getExaServerConfig } from './exa'
export type {
  ExaSearchResult,
  ExaSimilarPage,
  ExaPageContent,
  ExaSearchOptions,
  ExaSearchResponse,
  ExaFindSimilarResponse,
  ExaGetContentsResponse,
} from './exa'

export { FirecrawlHelper, getFirecrawlServerConfig } from './firecrawl'
export type {
  FirecrawlScrapeData,
  FirecrawlCrawledPage,
  FirecrawlSitemapEntry,
  FirecrawlScrapeOptions,
  FirecrawlCrawlOptions,
  FirecrawlScrapeResponse,
  FirecrawlCrawlResponse,
  FirecrawlSitemapResponse,
} from './firecrawl'

export { GitHubHelper, getGitHubServerConfig } from './github'
export type {
  GitHubRepository,
  GitHubFileContent,
  GitHubIssue,
  GitHubPullRequest,
  GitHubCodeSearchItem,
  GitHubSearchReposResponse,
  GitHubGetRepoResponse,
  GitHubReadFileResponse,
  GitHubCreateIssueResponse,
  GitHubCreatePRResponse,
  GitHubSearchCodeResponse,
} from './github'

export { SupabaseHelper, getSupabaseServerConfig } from './supabase'
export type {
  SupabaseColumn,
  SupabaseTableSchema,
  SupabaseTable,
  SupabaseBucket,
  SupabaseFileUpload,
  SupabaseRunSQLResponse,
  SupabaseGetSchemaResponse,
  SupabaseListTablesResponse,
  SupabaseCreateTableResponse,
  SupabaseSetupAuthResponse,
  SupabaseCreateBucketResponse,
  SupabaseUploadFileResponse,
  SupabaseEnableRealtimeResponse,
} from './supabase'
