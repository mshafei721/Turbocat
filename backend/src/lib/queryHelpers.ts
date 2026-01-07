/**
 * Query Helper Utilities
 *
 * Provides reusable helper functions for building Prisma queries.
 * Simplifies common patterns like pagination, filtering, sorting, and soft delete handling.
 *
 * @module lib/queryHelpers
 */

/**
 * Pagination input parameters
 */
export interface PaginationInput {
  /** Page number (1-indexed). Defaults to 1. */
  page?: number;
  /** Number of items per page. Defaults to 20. */
  pageSize?: number;
}

/**
 * Pagination output for Prisma queries
 */
export interface PaginationOutput {
  skip: number;
  take: number;
}

/**
 * Pagination metadata returned with paginated responses
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Build pagination parameters for Prisma queries
 *
 * @param input - Pagination input with page and pageSize
 * @returns Prisma-compatible skip/take object
 *
 * @example
 * ```typescript
 * const pagination = buildPagination({ page: 2, pageSize: 10 });
 * const users = await prisma.user.findMany({
 *   ...pagination,
 *   where: { isActive: true }
 * });
 * // pagination = { skip: 10, take: 10 }
 * ```
 */
export function buildPagination(input: PaginationInput = {}): PaginationOutput {
  const page = Math.max(1, input.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Build pagination metadata from query results
 *
 * @param totalItems - Total number of items matching the query
 * @param input - Original pagination input
 * @returns Pagination metadata for response
 *
 * @example
 * ```typescript
 * const [users, totalCount] = await Promise.all([
 *   prisma.user.findMany({ ...pagination, where: filters }),
 *   prisma.user.count({ where: filters })
 * ]);
 * const meta = buildPaginationMeta(totalCount, { page: 1, pageSize: 20 });
 * ```
 */
export function buildPaginationMeta(
  totalItems: number,
  input: PaginationInput = {},
): PaginationMeta {
  const page = Math.max(1, input.page ?? DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting input parameters
 */
export interface SortingInput {
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc). Defaults to 'desc'. */
  sortOrder?: SortDirection;
}

/**
 * Allowed sort fields configuration
 */
export type AllowedSortFields<T extends string = string> = Record<T, string>;

/**
 * Build sorting parameters for Prisma queries
 *
 * @param input - Sorting input with sortBy and sortOrder
 * @param allowedFields - Map of allowed sort field names to actual database field names
 * @param defaultField - Default field to sort by if none specified
 * @returns Prisma-compatible orderBy object or undefined
 *
 * @example
 * ```typescript
 * const allowedFields = {
 *   name: 'name',
 *   created: 'createdAt',
 *   updated: 'updatedAt'
 * };
 * const orderBy = buildSorting({ sortBy: 'created', sortOrder: 'desc' }, allowedFields, 'createdAt');
 * const users = await prisma.user.findMany({ orderBy });
 * // orderBy = { createdAt: 'desc' }
 * ```
 */
export function buildSorting<T extends string>(
  input: SortingInput = {},
  allowedFields: AllowedSortFields<T>,
  defaultField: string = 'createdAt',
): Record<string, SortDirection> {
  const { sortBy, sortOrder = 'desc' } = input;

  // Validate sort order
  const validatedOrder: SortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  // If sortBy is provided, check if it's allowed
  if (sortBy && sortBy in allowedFields) {
    const actualField = allowedFields[sortBy as T];
    return { [actualField]: validatedOrder };
  }

  // Use default field
  return { [defaultField]: validatedOrder };
}

/**
 * Filter operator types for building dynamic filters
 */
export type FilterOperator =
  | 'equals'
  | 'not'
  | 'in'
  | 'notIn'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'search';

/**
 * Filter value type - can be primitive or array for 'in' operations
 */
export type FilterValue = string | number | boolean | Date | string[] | number[];

/**
 * Single filter definition
 */
export interface FilterDefinition {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  caseInsensitive?: boolean;
}

/**
 * Build a single filter condition for Prisma
 *
 * @param definition - Filter definition with field, operator, and value
 * @returns Prisma-compatible where condition
 *
 * @example
 * ```typescript
 * const filter = buildFilter({
 *   field: 'email',
 *   operator: 'contains',
 *   value: 'example.com',
 *   caseInsensitive: true
 * });
 * // Returns: { email: { contains: 'example.com', mode: 'insensitive' } }
 * ```
 */
export function buildFilter(definition: FilterDefinition): Record<string, unknown> {
  const { field, operator, value, caseInsensitive } = definition;

  // Build the operator value
  let operatorValue: unknown;

  switch (operator) {
    case 'equals':
      operatorValue = value;
      break;
    case 'not':
      operatorValue = { not: value };
      break;
    case 'in':
      operatorValue = { in: Array.isArray(value) ? value : [value] };
      break;
    case 'notIn':
      operatorValue = { notIn: Array.isArray(value) ? value : [value] };
      break;
    case 'lt':
      operatorValue = { lt: value };
      break;
    case 'lte':
      operatorValue = { lte: value };
      break;
    case 'gt':
      operatorValue = { gt: value };
      break;
    case 'gte':
      operatorValue = { gte: value };
      break;
    case 'contains':
      operatorValue = {
        contains: value,
        ...(caseInsensitive && { mode: 'insensitive' }),
      };
      break;
    case 'startsWith':
      operatorValue = {
        startsWith: value,
        ...(caseInsensitive && { mode: 'insensitive' }),
      };
      break;
    case 'endsWith':
      operatorValue = {
        endsWith: value,
        ...(caseInsensitive && { mode: 'insensitive' }),
      };
      break;
    case 'search':
      // Full-text search (requires @db.Text field with search index)
      operatorValue = { search: value };
      break;
    default:
      operatorValue = value;
  }

  return { [field]: operatorValue };
}

/**
 * Build multiple filter conditions combined with AND
 *
 * @param definitions - Array of filter definitions
 * @returns Combined Prisma where clause
 *
 * @example
 * ```typescript
 * const filters = buildFilters([
 *   { field: 'status', operator: 'equals', value: 'active' },
 *   { field: 'type', operator: 'in', value: ['CODE', 'API'] },
 *   { field: 'name', operator: 'contains', value: 'test', caseInsensitive: true }
 * ]);
 * const agents = await prisma.agent.findMany({ where: filters });
 * ```
 */
export function buildFilters(definitions: FilterDefinition[]): Record<string, unknown> {
  if (definitions.length === 0) {
    return {};
  }

  const conditions = definitions.map((def) => buildFilter(def));

  if (conditions.length === 1) {
    // Safe assertion: we know there's exactly one element
    return conditions[0] as Record<string, unknown>;
  }

  return { AND: conditions };
}

/**
 * Search input parameters for text search across multiple fields
 */
export interface SearchInput {
  /** Search query string */
  query?: string;
  /** Fields to search in */
  fields: string[];
  /** Whether to use case-insensitive search. Defaults to true. */
  caseInsensitive?: boolean;
}

/**
 * Build a search filter that searches across multiple fields with OR logic
 *
 * @param input - Search input with query and fields
 * @returns Prisma-compatible where clause for search or undefined if no query
 *
 * @example
 * ```typescript
 * const searchFilter = buildSearch({
 *   query: 'web scraper',
 *   fields: ['name', 'description'],
 *   caseInsensitive: true
 * });
 * const agents = await prisma.agent.findMany({
 *   where: { ...searchFilter }
 * });
 * ```
 */
export function buildSearch(input: SearchInput): Record<string, unknown> | undefined {
  const { query, fields, caseInsensitive = true } = input;

  if (!query || query.trim().length === 0 || fields.length === 0) {
    return undefined;
  }

  const trimmedQuery = query.trim();

  const searchConditions = fields.map((field) => ({
    [field]: {
      contains: trimmedQuery,
      ...(caseInsensitive && { mode: 'insensitive' }),
    },
  }));

  if (searchConditions.length === 1) {
    return searchConditions[0];
  }

  return { OR: searchConditions };
}

/**
 * Soft delete filter option
 */
export type SoftDeleteOption = 'exclude' | 'include' | 'only';

/**
 * Build soft delete filter condition
 *
 * @param option - How to handle soft-deleted records
 * @param deletedAtField - Name of the deletedAt field. Defaults to 'deletedAt'.
 * @returns Prisma-compatible where condition for soft deletes
 *
 * @example
 * ```typescript
 * // Exclude deleted records (default behavior)
 * const filter = buildSoftDeleteFilter('exclude');
 * // Returns: { deletedAt: null }
 *
 * // Include all records
 * const filter = buildSoftDeleteFilter('include');
 * // Returns: {}
 *
 * // Only deleted records
 * const filter = buildSoftDeleteFilter('only');
 * // Returns: { deletedAt: { not: null } }
 * ```
 */
export function buildSoftDeleteFilter(
  option: SoftDeleteOption = 'exclude',
  deletedAtField: string = 'deletedAt',
): Record<string, unknown> {
  switch (option) {
    case 'exclude':
      return { [deletedAtField]: null };
    case 'only':
      return { [deletedAtField]: { not: null } };
    case 'include':
    default:
      return {};
  }
}

/**
 * Date range filter input
 */
export interface DateRangeInput {
  /** Start date (inclusive) */
  from?: Date | string;
  /** End date (inclusive) */
  to?: Date | string;
}

/**
 * Build a date range filter for a specific field
 *
 * @param field - Field name to filter on
 * @param range - Date range with from and/or to
 * @returns Prisma-compatible where condition for date range
 *
 * @example
 * ```typescript
 * const dateFilter = buildDateRangeFilter('createdAt', {
 *   from: '2024-01-01',
 *   to: '2024-12-31'
 * });
 * const agents = await prisma.agent.findMany({
 *   where: dateFilter
 * });
 * ```
 */
export function buildDateRangeFilter(
  field: string,
  range: DateRangeInput,
): Record<string, unknown> {
  const conditions: Record<string, unknown> = {};

  if (range.from) {
    const fromDate = range.from instanceof Date ? range.from : new Date(range.from);
    conditions.gte = fromDate;
  }

  if (range.to) {
    const toDate = range.to instanceof Date ? range.to : new Date(range.to);
    conditions.lte = toDate;
  }

  if (Object.keys(conditions).length === 0) {
    return {};
  }

  return { [field]: conditions };
}

/**
 * Tags filter input for array field matching
 */
export interface TagsFilterInput {
  /** Tags to match (OR logic - any tag matches) */
  anyOf?: string[];
  /** Tags that must all be present (AND logic) */
  allOf?: string[];
}

/**
 * Build a tags filter for array fields
 *
 * @param field - Array field name to filter on
 * @param input - Tags filter input with anyOf and/or allOf
 * @returns Prisma-compatible where condition for tags
 *
 * @example
 * ```typescript
 * const tagsFilter = buildTagsFilter('tags', {
 *   anyOf: ['automation', 'scraping'],
 *   allOf: ['production']
 * });
 * const agents = await prisma.agent.findMany({
 *   where: tagsFilter
 * });
 * ```
 */
export function buildTagsFilter(field: string, input: TagsFilterInput): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  if (input.anyOf && input.anyOf.length > 0) {
    // Match any of the tags (hasSome)
    conditions.push({ [field]: { hasSome: input.anyOf } });
  }

  if (input.allOf && input.allOf.length > 0) {
    // Match all tags (hasEvery)
    conditions.push({ [field]: { hasEvery: input.allOf } });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    // Safe assertion: we know there's exactly one element
    return conditions[0] as Record<string, unknown>;
  }

  return { AND: conditions };
}

/**
 * Combined query parameters interface
 * Combines pagination, sorting, search, and filtering
 */
export interface QueryParams extends PaginationInput, SortingInput {
  /** Search query string */
  search?: string;
  /** Whether to include soft-deleted records */
  includeDeleted?: boolean;
}

/**
 * Build a complete query configuration from standard query parameters
 *
 * @param params - Combined query parameters
 * @param config - Configuration for search fields and sort fields
 * @returns Object with pagination, sorting, and where clause
 *
 * @example
 * ```typescript
 * const { pagination, orderBy, baseWhere } = buildQueryConfig(
 *   { page: 1, pageSize: 20, search: 'test', sortBy: 'name', sortOrder: 'asc' },
 *   {
 *     searchFields: ['name', 'description'],
 *     sortFields: { name: 'name', created: 'createdAt' }
 *   }
 * );
 *
 * const agents = await prisma.agent.findMany({
 *   ...pagination,
 *   orderBy,
 *   where: { ...baseWhere, userId: 'user-id' }
 * });
 * ```
 */
export function buildQueryConfig<T extends string>(
  params: QueryParams,
  config: {
    searchFields?: string[];
    sortFields?: AllowedSortFields<T>;
    defaultSortField?: string;
  } = {},
): {
  pagination: PaginationOutput;
  orderBy: Record<string, SortDirection>;
  baseWhere: Record<string, unknown>;
} {
  const {
    searchFields = [],
    sortFields = {} as AllowedSortFields<T>,
    defaultSortField = 'createdAt',
  } = config;

  // Build pagination
  const pagination = buildPagination(params);

  // Build sorting
  const orderBy = buildSorting(params, sortFields, defaultSortField);

  // Build base where clause
  const baseWhere: Record<string, unknown> = {};

  // Add soft delete filter
  if (!params.includeDeleted) {
    Object.assign(baseWhere, buildSoftDeleteFilter('exclude'));
  }

  // Add search filter
  if (params.search && searchFields.length > 0) {
    const searchFilter = buildSearch({
      query: params.search,
      fields: searchFields,
    });
    if (searchFilter) {
      Object.assign(baseWhere, searchFilter);
    }
  }

  return {
    pagination,
    orderBy,
    baseWhere,
  };
}

/**
 * Type for select fields - useful for building dynamic selects
 */
export type SelectFields<T extends string> = Partial<Record<T, boolean>>;

/**
 * Build a select object from an array of field names
 *
 * @param fields - Array of field names to include in select
 * @returns Prisma-compatible select object
 *
 * @example
 * ```typescript
 * const select = buildSelect(['id', 'name', 'email']);
 * const users = await prisma.user.findMany({ select });
 * // select = { id: true, name: true, email: true }
 * ```
 */
export function buildSelect<T extends string>(fields: T[]): SelectFields<T> {
  return fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as SelectFields<T>);
}

/**
 * Exclude fields from an object (useful for removing sensitive data)
 *
 * @param obj - Object to exclude fields from
 * @param keys - Array of keys to exclude
 * @returns New object without the excluded keys
 *
 * @example
 * ```typescript
 * const user = { id: '1', email: 'test@test.com', passwordHash: 'secret' };
 * const safeUser = excludeFields(user, ['passwordHash']);
 * // safeUser = { id: '1', email: 'test@test.com' }
 * ```
 */
export function excludeFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export default {
  buildPagination,
  buildPaginationMeta,
  buildSorting,
  buildFilter,
  buildFilters,
  buildSearch,
  buildSoftDeleteFilter,
  buildDateRangeFilter,
  buildTagsFilter,
  buildQueryConfig,
  buildSelect,
  excludeFields,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};
