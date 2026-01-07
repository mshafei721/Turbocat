/**
 * Data Agent Executor
 *
 * Executes data agents that perform data transformations.
 * Supports operations: filter, map, reduce, sort, group, and more.
 *
 * @module engine/agents/DataAgentExecutor
 */

import { Agent, AgentType } from '@prisma/client';
import {
  AgentExecutor,
  AgentExecutorConfig,
  AgentExecutionInput,
  ExecutionMetrics,
} from './AgentExecutor';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported data operations
 */
export type DataOperation =
  | 'filter'
  | 'map'
  | 'reduce'
  | 'sort'
  | 'group'
  | 'flatten'
  | 'unique'
  | 'pick'
  | 'omit'
  | 'merge'
  | 'join'
  | 'aggregate'
  | 'transform';

/**
 * Filter condition operators
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'exists'
  | 'regex';

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification
 */
export interface SortSpec {
  field: string;
  direction: SortDirection;
}

/**
 * Aggregation operations
 */
export type AggregationOp = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';

/**
 * Aggregation specification
 */
export interface AggregationSpec {
  field: string;
  operation: AggregationOp;
  alias?: string;
}

/**
 * Pipeline step configuration
 */
export interface PipelineStep {
  operation: DataOperation;
  config: Record<string, unknown>;
}

/**
 * Data agent configuration in agent.config
 */
export interface DataAgentConfig {
  /** Single operation mode */
  operation?: DataOperation;
  /** Operation configuration */
  operationConfig?: Record<string, unknown>;
  /** Pipeline mode - multiple operations in sequence */
  pipeline?: PipelineStep[];
  /** Input field containing the data (default: 'data') */
  inputField?: string;
  /** Output field for the result (default: 'result') */
  outputField?: string;
  /** Whether to validate output schema */
  validateOutput?: boolean;
  /** Expected output schema (JSON Schema) */
  outputSchema?: Record<string, unknown>;
}

/**
 * Data execution result
 */
export interface DataExecutionResult {
  /** Transformed data */
  result: unknown;
  /** Original data (if preserved) */
  originalData?: unknown;
  /** Number of input items processed */
  inputCount: number;
  /** Number of output items */
  outputCount: number;
  /** Operations performed */
  operationsPerformed: string[];
}

// =============================================================================
// DATA AGENT EXECUTOR
// =============================================================================

/**
 * Executor for data agents
 *
 * Features:
 * - Filter: Filter arrays based on conditions
 * - Map: Transform each item in an array
 * - Reduce: Aggregate array to single value
 * - Sort: Sort arrays by field(s)
 * - Group: Group items by field
 * - Flatten: Flatten nested arrays
 * - Unique: Remove duplicates
 * - Pick/Omit: Select or exclude fields
 * - Merge: Combine multiple objects/arrays
 * - Aggregate: Calculate statistics
 * - Pipeline: Chain multiple operations
 */
export class DataAgentExecutor extends AgentExecutor {
  private executionMetrics: ExecutionMetrics = {};

  constructor(config: AgentExecutorConfig = {}) {
    super(config);
  }

  /**
   * Get the agent type this executor handles
   */
  getAgentType(): AgentType {
    return AgentType.DATA;
  }

  /**
   * Execute the data agent
   */
  protected async executeInternal(input: AgentExecutionInput): Promise<DataExecutionResult> {
    this.validateInput(input);

    const agentConfig = this.parseAgentConfig(input.agent);

    this.log('info', `Executing data agent`, {
      operation: agentConfig.operation,
      hasPipeline: !!agentConfig.pipeline,
    });

    // Get input data
    const inputField = agentConfig.inputField || 'data';
    let data = input.inputs[inputField];

    if (data === undefined) {
      // Try to find data in any common field
      data = input.inputs.data || input.inputs.items || input.inputs.input || input.inputs;
    }

    const originalData = data;
    const operationsPerformed: string[] = [];

    // Count input items
    const inputCount = this.countItems(data);

    // Execute operations
    if (agentConfig.pipeline && agentConfig.pipeline.length > 0) {
      // Pipeline mode
      for (const step of agentConfig.pipeline) {
        this.log('debug', `Executing pipeline step: ${step.operation}`);
        data = await this.executeOperation(step.operation, data, step.config);
        operationsPerformed.push(step.operation);
      }
    } else if (agentConfig.operation) {
      // Single operation mode
      data = await this.executeOperation(
        agentConfig.operation,
        data,
        agentConfig.operationConfig || {},
      );
      operationsPerformed.push(agentConfig.operation);
    }

    // Count output items
    const outputCount = this.countItems(data);

    // Validate output if schema provided
    if (agentConfig.validateOutput && agentConfig.outputSchema) {
      this.validateOutputSchema(data, agentConfig.outputSchema);
    }

    this.log('info', 'Data transformation completed', {
      inputCount,
      outputCount,
      operationsPerformed,
    });

    return {
      result: data,
      originalData,
      inputCount,
      outputCount,
      operationsPerformed,
    };
  }

  /**
   * Parse and validate agent configuration
   */
  private parseAgentConfig(agent: Agent): DataAgentConfig {
    const config = agent.config as Record<string, unknown> | null;

    if (!config) {
      throw new Error('Data agent requires configuration');
    }

    return {
      operation: config.operation as DataOperation | undefined,
      operationConfig: config.operationConfig as Record<string, unknown> | undefined,
      pipeline: config.pipeline as PipelineStep[] | undefined,
      inputField: config.inputField as string | undefined,
      outputField: config.outputField as string | undefined,
      validateOutput: config.validateOutput as boolean | undefined,
      outputSchema: config.outputSchema as Record<string, unknown> | undefined,
    };
  }

  /**
   * Execute a single data operation
   */
  private async executeOperation(
    operation: DataOperation,
    data: unknown,
    config: Record<string, unknown>,
  ): Promise<unknown> {
    switch (operation) {
      case 'filter':
        return this.executeFilter(data, config);
      case 'map':
        return this.executeMap(data, config);
      case 'reduce':
        return this.executeReduce(data, config);
      case 'sort':
        return this.executeSort(data, config);
      case 'group':
        return this.executeGroup(data, config);
      case 'flatten':
        return this.executeFlatten(data, config);
      case 'unique':
        return this.executeUnique(data, config);
      case 'pick':
        return this.executePick(data, config);
      case 'omit':
        return this.executeOmit(data, config);
      case 'merge':
        return this.executeMerge(data, config);
      case 'join':
        return this.executeJoin(data, config);
      case 'aggregate':
        return this.executeAggregate(data, config);
      case 'transform':
        return this.executeTransform(data, config);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Filter operation
   */
  private executeFilter(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Filter operation requires an array input');
    }

    const conditions = config.conditions as FilterCondition[] | undefined;
    const logic = (config.logic as 'and' | 'or') || 'and';

    if (!conditions || conditions.length === 0) {
      return data;
    }

    return data.filter((item) => {
      const results = conditions.map((condition) => this.evaluateCondition(item, condition));

      return logic === 'and' ? results.every(Boolean) : results.some(Boolean);
    });
  }

  /**
   * Evaluate a filter condition against an item
   */
  private evaluateCondition(item: unknown, condition: FilterCondition): boolean {
    const value = this.getNestedValue(item as Record<string, unknown>, condition.field);

    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'nin':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(String(condition.value));
      case 'startsWith':
        return typeof value === 'string' && value.startsWith(String(condition.value));
      case 'endsWith':
        return typeof value === 'string' && value.endsWith(String(condition.value));
      case 'exists':
        return condition.value ? value !== undefined : value === undefined;
      case 'regex':
        return typeof value === 'string' && new RegExp(String(condition.value)).test(value);
      default:
        return false;
    }
  }

  /**
   * Map operation
   */
  private executeMap(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Map operation requires an array input');
    }

    const fields = config.fields as Record<string, string> | undefined;
    const expression = config.expression as string | undefined;

    if (expression) {
      // Expression-based mapping (simple property access)
      return data.map((item) => this.evaluateExpression(item, expression));
    }

    if (fields) {
      // Field mapping
      return data.map((item) => {
        const result: Record<string, unknown> = {};
        for (const [newKey, oldKey] of Object.entries(fields)) {
          result[newKey] = this.getNestedValue(item as Record<string, unknown>, oldKey);
        }
        return result;
      });
    }

    return data;
  }

  /**
   * Reduce operation
   */
  private executeReduce(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Reduce operation requires an array input');
    }

    const operation = config.operation as AggregationOp;
    const field = config.field as string | undefined;
    const initialValue = config.initialValue;

    if (field) {
      const values = data
        .map((item) => this.getNestedValue(item as Record<string, unknown>, field))
        .filter((v) => v !== undefined && v !== null) as number[];

      switch (operation) {
        case 'sum':
          return values.reduce((acc, v) => acc + v, 0);
        case 'avg':
          return values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
        case 'min':
          return values.length > 0 ? Math.min(...values) : null;
        case 'max':
          return values.length > 0 ? Math.max(...values) : null;
        case 'count':
          return values.length;
        case 'first':
          return data[0];
        case 'last':
          return data[data.length - 1];
      }
    }

    // Generic reduce with initial value
    if (initialValue !== undefined) {
      return data.reduce((acc, item) => {
        // Simple concat behavior
        if (Array.isArray(acc)) {
          return [...acc, item];
        }
        if (typeof acc === 'object' && typeof item === 'object') {
          return { ...acc, ...item };
        }
        return item;
      }, initialValue);
    }

    return data;
  }

  /**
   * Sort operation
   */
  private executeSort(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Sort operation requires an array input');
    }

    const specs = config.by as SortSpec[] | SortSpec | undefined;
    const field = config.field as string | undefined;
    const direction = (config.direction as SortDirection) || 'asc';

    // Normalize to array of specs
    let sortSpecs: SortSpec[];
    if (specs) {
      sortSpecs = Array.isArray(specs) ? specs : [specs];
    } else if (field) {
      sortSpecs = [{ field, direction }];
    } else {
      return data;
    }

    return [...data].sort((a, b) => {
      for (const spec of sortSpecs) {
        const aVal = this.getNestedValue(a as Record<string, unknown>, spec.field);
        const bVal = this.getNestedValue(b as Record<string, unknown>, spec.field);

        let comparison = 0;
        if (aVal === bVal) {
          comparison = 0;
        } else if (aVal === null || aVal === undefined) {
          comparison = 1;
        } else if (bVal === null || bVal === undefined) {
          comparison = -1;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = aVal < bVal ? -1 : 1;
        }

        if (comparison !== 0) {
          return spec.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  /**
   * Group operation
   */
  private executeGroup(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Group operation requires an array input');
    }

    const field = config.field as string;
    if (!field) {
      throw new Error('Group operation requires a field');
    }

    const groups: Record<string, unknown[]> = {};

    for (const item of data) {
      const key = String(
        this.getNestedValue(item as Record<string, unknown>, field) ?? 'undefined',
      );
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return groups;
  }

  /**
   * Flatten operation
   */
  private executeFlatten(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      return data;
    }

    const depth = (config.depth as number) ?? 1;
    return data.flat(depth);
  }

  /**
   * Unique operation
   */
  private executeUnique(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      return data;
    }

    const field = config.field as string | undefined;

    if (field) {
      const seen = new Set();
      return data.filter((item) => {
        const value = this.getNestedValue(item as Record<string, unknown>, field);
        const key = JSON.stringify(value);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // For primitive arrays
    return [...new Set(data.map((item) => JSON.stringify(item)))].map((s) => JSON.parse(s));
  }

  /**
   * Pick operation (select specific fields)
   */
  private executePick(data: unknown, config: Record<string, unknown>): unknown {
    const fields = config.fields as string[];
    if (!fields || fields.length === 0) {
      return data;
    }

    const pickFields = (item: unknown): Record<string, unknown> => {
      if (typeof item !== 'object' || item === null) {
        return {};
      }
      const result: Record<string, unknown> = {};
      for (const field of fields) {
        const value = this.getNestedValue(item as Record<string, unknown>, field);
        if (value !== undefined) {
          result[field] = value;
        }
      }
      return result;
    };

    if (Array.isArray(data)) {
      return data.map(pickFields);
    }

    return pickFields(data);
  }

  /**
   * Omit operation (exclude specific fields)
   */
  private executeOmit(data: unknown, config: Record<string, unknown>): unknown {
    const fields = config.fields as string[];
    if (!fields || fields.length === 0) {
      return data;
    }

    const omitFields = (item: unknown): Record<string, unknown> => {
      if (typeof item !== 'object' || item === null) {
        return {};
      }
      const result = { ...(item as Record<string, unknown>) };
      for (const field of fields) {
        delete result[field];
      }
      return result;
    };

    if (Array.isArray(data)) {
      return data.map(omitFields);
    }

    return omitFields(data);
  }

  /**
   * Merge operation
   */
  private executeMerge(data: unknown, config: Record<string, unknown>): unknown {
    const source = config.source;
    const strategy = (config.strategy as 'shallow' | 'deep') || 'shallow';

    if (Array.isArray(data) && Array.isArray(source)) {
      return [...data, ...source];
    }

    if (
      typeof data === 'object' &&
      typeof source === 'object' &&
      data !== null &&
      source !== null
    ) {
      if (strategy === 'deep') {
        return this.deepMerge(data as Record<string, unknown>, source as Record<string, unknown>);
      }
      return { ...data, ...source };
    }

    return data;
  }

  /**
   * Deep merge helper
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = this.deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Join operation (SQL-like join)
   */
  private executeJoin(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Join operation requires an array input');
    }

    const rightData = config.with as unknown[];
    if (!Array.isArray(rightData)) {
      throw new Error('Join operation requires "with" array');
    }

    const leftField = config.on as string;
    const rightField = (config.rightOn as string) || leftField;
    const type = (config.type as 'inner' | 'left' | 'right' | 'full') || 'inner';

    // Build lookup map for right data
    const rightMap = new Map<string, unknown[]>();
    for (const item of rightData) {
      const key = String(this.getNestedValue(item as Record<string, unknown>, rightField));
      if (!rightMap.has(key)) {
        rightMap.set(key, []);
      }
      rightMap.get(key)!.push(item);
    }

    const result: unknown[] = [];

    // Process left data
    for (const leftItem of data) {
      const key = String(this.getNestedValue(leftItem as Record<string, unknown>, leftField));
      const rightItems = rightMap.get(key);

      if (rightItems && rightItems.length > 0) {
        for (const rightItem of rightItems) {
          result.push({
            ...(leftItem as Record<string, unknown>),
            ...(rightItem as Record<string, unknown>),
          });
        }
      } else if (type === 'left' || type === 'full') {
        result.push({ ...(leftItem as Record<string, unknown>) });
      }
    }

    // Handle right/full join unmatched items
    if (type === 'right' || type === 'full') {
      const leftKeys = new Set(
        data.map((item) => String(this.getNestedValue(item as Record<string, unknown>, leftField))),
      );

      for (const rightItem of rightData) {
        const key = String(this.getNestedValue(rightItem as Record<string, unknown>, rightField));
        if (!leftKeys.has(key)) {
          result.push({ ...(rightItem as Record<string, unknown>) });
        }
      }
    }

    return result;
  }

  /**
   * Aggregate operation
   */
  private executeAggregate(data: unknown, config: Record<string, unknown>): unknown {
    if (!Array.isArray(data)) {
      throw new Error('Aggregate operation requires an array input');
    }

    const groupBy = config.groupBy as string | undefined;
    const aggregations = config.aggregations as AggregationSpec[];

    if (!aggregations || aggregations.length === 0) {
      throw new Error('Aggregate operation requires aggregations');
    }

    if (groupBy) {
      // Group and aggregate
      const groups = this.executeGroup(data, { field: groupBy }) as Record<string, unknown[]>;
      const result: Record<string, Record<string, unknown>> = {};

      for (const [key, items] of Object.entries(groups)) {
        result[key] = this.applyAggregations(items, aggregations);
        result[key][groupBy] = key;
      }

      return Object.values(result);
    }

    // Global aggregation
    return this.applyAggregations(data, aggregations);
  }

  /**
   * Apply aggregations to a set of items
   */
  private applyAggregations(
    items: unknown[],
    aggregations: AggregationSpec[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const agg of aggregations) {
      const alias = agg.alias || `${agg.operation}_${agg.field}`;
      const values = items
        .map((item) => this.getNestedValue(item as Record<string, unknown>, agg.field))
        .filter((v) => v !== undefined && v !== null);

      switch (agg.operation) {
        case 'sum':
          result[alias] = (values as number[]).reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[alias] =
            values.length > 0 ? (values as number[]).reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'min':
          result[alias] = values.length > 0 ? Math.min(...(values as number[])) : null;
          break;
        case 'max':
          result[alias] = values.length > 0 ? Math.max(...(values as number[])) : null;
          break;
        case 'count':
          result[alias] = values.length;
          break;
        case 'first':
          result[alias] = values[0];
          break;
        case 'last':
          result[alias] = values[values.length - 1];
          break;
      }
    }

    return result;
  }

  /**
   * Transform operation (custom expression-based transformation)
   */
  private executeTransform(data: unknown, config: Record<string, unknown>): unknown {
    const expression = config.expression as string;
    if (!expression) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.evaluateExpression(item, expression));
    }

    return this.evaluateExpression(data, expression);
  }

  /**
   * Evaluate a simple expression (property access)
   */
  private evaluateExpression(item: unknown, expression: string): unknown {
    // Simple property access (e.g., "item.field" or "field.nested")
    return this.getNestedValue(item as Record<string, unknown>, expression);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Count items in data
   */
  private countItems(data: unknown): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  /**
   * Validate output against JSON schema (basic validation)
   */
  private validateOutputSchema(data: unknown, schema: Record<string, unknown>): void {
    const type = schema.type as string;

    if (type === 'array' && !Array.isArray(data)) {
      throw new Error('Output validation failed: expected array');
    }
    if (type === 'object' && (typeof data !== 'object' || data === null || Array.isArray(data))) {
      throw new Error('Output validation failed: expected object');
    }
    if (type === 'string' && typeof data !== 'string') {
      throw new Error('Output validation failed: expected string');
    }
    if (type === 'number' && typeof data !== 'number') {
      throw new Error('Output validation failed: expected number');
    }
    if (type === 'boolean' && typeof data !== 'boolean') {
      throw new Error('Output validation failed: expected boolean');
    }

    // Check required fields for objects
    if (type === 'object' && schema.required && Array.isArray(schema.required)) {
      const obj = data as Record<string, unknown>;
      for (const field of schema.required as string[]) {
        if (!(field in obj)) {
          throw new Error(`Output validation failed: missing required field "${field}"`);
        }
      }
    }
  }

  /**
   * Collect execution metrics
   */
  protected collectMetrics(): ExecutionMetrics | undefined {
    return this.executionMetrics;
  }

  /**
   * Validate input specific to data agents
   */
  protected validateInput(input: AgentExecutionInput): void {
    super.validateInput(input);

    if (input.agent.type !== AgentType.DATA) {
      throw new Error(`DataAgentExecutor can only execute DATA agents, got: ${input.agent.type}`);
    }
  }
}

export default DataAgentExecutor;
