/**
 * API Integration Skill Handler
 *
 * Generates Next.js App Router API routes with Zod validation schemas,
 * TypeScript types, and error handling utilities.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/handlers/api-integration.ts
 */

interface FieldTypes {
  [field: string]: string
}

interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  code: string
  description: string
}

interface ProcessResult {
  resource: string
  routes: RouteDefinition[]
  schemas: string
  errorHandlers: string
  types: string
  files: Array<{
    path: string
    content: string
  }>
}

export class APIIntegrationHandler {
  /**
   * Generate API routes for a resource with specified operations
   */
  generateRoutes(resource: string, operations: string[]): RouteDefinition[] {
    const routes: RouteDefinition[] = []

    // List operation (GET /api/resource)
    if (operations.includes('list')) {
      routes.push({
        method: 'GET',
        path: `/api/${resource}`,
        description: `List all ${resource}`,
        code: this.generateListRoute(resource),
      })
    }

    // Create operation (POST /api/resource)
    if (operations.includes('create')) {
      routes.push({
        method: 'POST',
        path: `/api/${resource}`,
        description: `Create a new ${this.singularize(resource)}`,
        code: this.generateCreateRoute(resource),
      })
    }

    // Get single operation (GET /api/resource/[id])
    if (operations.includes('get')) {
      routes.push({
        method: 'GET',
        path: `/api/${resource}/[id]`,
        description: `Get a single ${this.singularize(resource)}`,
        code: this.generateGetRoute(resource),
      })
    }

    // Update operation (PUT /api/resource/[id])
    if (operations.includes('update')) {
      routes.push({
        method: 'PUT',
        path: `/api/${resource}/[id]`,
        description: `Update a ${this.singularize(resource)}`,
        code: this.generateUpdateRoute(resource),
      })
    }

    // Delete operation (DELETE /api/resource/[id])
    if (operations.includes('delete')) {
      routes.push({
        method: 'DELETE',
        path: `/api/${resource}/[id]`,
        description: `Delete a ${this.singularize(resource)}`,
        code: this.generateDeleteRoute(resource),
      })
    }

    return routes
  }

  /**
   * Generate Zod validation schema for a resource
   */
  generateZodSchema(resource: string, fields: FieldTypes): string {
    const schemaName = `${this.singularize(resource)}Schema`
    const createSchemaName = `create${this.capitalize(this.singularize(resource))}Schema`
    const updateSchemaName = `update${this.capitalize(this.singularize(resource))}Schema`
    const typeName = this.capitalize(this.singularize(resource))

    const fieldDefinitions = Object.entries(fields)
      .map(([field, type]) => {
        const zodType = this.getZodType(field, type)
        return `  ${field}: ${zodType},`
      })
      .join('\n')

    return `import { z } from 'zod'

/**
 * Zod schema for ${resource}
 */
export const ${schemaName} = z.object({
${fieldDefinitions}
})

/**
 * Schema for creating ${resource} (without auto-generated fields)
 */
export const ${createSchemaName} = ${schemaName}.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

/**
 * Schema for updating ${resource} (all fields optional)
 */
export const ${updateSchemaName} = ${schemaName}.partial().omit({
  id: true,
  createdAt: true,
})

/**
 * TypeScript types inferred from Zod schemas
 */
export type ${typeName} = z.infer<typeof ${schemaName}>
export type Create${typeName} = z.infer<typeof ${createSchemaName}>
export type Update${typeName} = z.infer<typeof ${updateSchemaName}>
`
  }

  /**
   * Generate error handler utility
   */
  generateErrorHandler(): string {
    return `import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Base API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(\`\${resource} not found\`, 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleAPIError(error: unknown) {
  console.error('API Error:', error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  // Handle custom API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.statusCode }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'Internal server error',
    },
    { status: 500 }
  )
}
`
  }

  /**
   * Generate error type definitions
   */
  generateErrorTypes(): string {
    // Return the error handler code which includes the error classes
    return this.generateErrorHandler()
  }

  /**
   * Process a complete prompt and generate API structure
   */
  processPrompt(prompt: string): ProcessResult {
    // Extract resource name
    const resource = this.extractResource(prompt)

    // Detect operations
    const operations = this.detectOperations(prompt)

    // Infer fields (simplified - would normally parse from context)
    const fields: FieldTypes = {
      id: 'string',
      title: 'string',
      content: 'string',
      published: 'boolean',
      createdAt: 'date',
      updatedAt: 'date',
    }

    // Generate routes
    const routes = this.generateRoutes(resource, operations)

    // Generate schemas
    const schemas = this.generateZodSchema(resource, fields)

    // Generate error handlers
    const errorHandlers = this.generateErrorHandler()

    // Generate types
    const types = this.generateErrorTypes()

    // Create file mappings
    const files: Array<{ path: string; content: string }> = []

    // Add validation schema file
    files.push({
      path: `lib/validations/${this.singularize(resource)}.ts`,
      content: schemas,
    })

    // Add error handling utilities
    files.push({
      path: 'lib/api/errors.ts',
      content: errorHandlers,
    })

    // Add type definitions
    files.push({
      path: 'lib/api/types.ts',
      content: types,
    })

    // Add route files
    const listCreateRoutes = routes.filter((r) => !r.path.includes('[id]'))
    if (listCreateRoutes.length > 0) {
      files.push({
        path: `app/api/${resource}/route.ts`,
        content: listCreateRoutes.map((r) => r.code).join('\n\n'),
      })
    }

    const singleRoutes = routes.filter((r) => r.path.includes('[id]'))
    if (singleRoutes.length > 0) {
      files.push({
        path: `app/api/${resource}/[id]/route.ts`,
        content: singleRoutes.map((r) => r.code).join('\n\n'),
      })
    }

    return {
      resource,
      routes,
      schemas,
      errorHandlers,
      types,
      files,
    }
  }

  // Private helper methods

  private generateListRoute(resource: string): string {
    const singular = this.singularize(resource)

    return `import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { ${resource} } from '@/lib/db/schema'

/**
 * GET /api/${resource}
 * List all ${resource} with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Fetch ${resource} from database
    const items = await db.query.${resource}.findMany({
      limit,
      offset,
      orderBy: (${resource}, { desc }) => [desc(${resource}.createdAt)],
    })

    // Get total count
    const total = await db.query.${resource}.findMany()

    return NextResponse.json({
      data: items,
      page,
      limit,
      total: total.length,
      hasMore: offset + items.length < total.length,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}`
  }

  private generateCreateRoute(resource: string): string {
    const singular = this.singularize(resource)
    const schemaName = `create${this.capitalize(singular)}Schema`

    return `/**
 * POST /api/${resource}
 * Create a new ${singular}
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ${schemaName}.parse(body)

    // Insert into database
    const [item] = await db.insert(${resource}).values(validated).returning()

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}`
  }

  private generateGetRoute(resource: string): string {
    const singular = this.singularize(resource)

    return `import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError, NotFoundError } from '@/lib/api/errors'
import { db } from '@/lib/db'
import { ${resource} } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/${resource}/[id]
 * Get a single ${singular} by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await db.query.${resource}.findFirst({
      where: eq(${resource}.id, id),
    })

    if (!item) {
      throw new NotFoundError('${this.capitalize(singular)}')
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    return handleAPIError(error)
  }
}`
  }

  private generateUpdateRoute(resource: string): string {
    const singular = this.singularize(resource)
    const schemaName = `update${this.capitalize(singular)}Schema`

    return `/**
 * PUT /api/${resource}/[id]
 * Update a ${singular} by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = ${schemaName}.parse(body)

    const [item] = await db
      .update(${resource})
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(${resource}.id, id))
      .returning()

    if (!item) {
      throw new NotFoundError('${this.capitalize(singular)}')
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    return handleAPIError(error)
  }
}`
  }

  private generateDeleteRoute(resource: string): string {
    const singular = this.singularize(resource)

    return `/**
 * DELETE /api/${resource}/[id]
 * Delete a ${singular} by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [item] = await db
      .delete(${resource})
      .where(eq(${resource}.id, id))
      .returning()

    if (!item) {
      throw new NotFoundError('${this.capitalize(singular)}')
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    return handleAPIError(error)
  }
}`
  }

  private getZodType(field: string, type: string): string {
    const lower = field.toLowerCase()
    const isOptional = type.endsWith('?')
    const baseType = type.replace('?', '')

    let zodType = ''

    // Email fields
    if (lower.includes('email')) {
      zodType = 'z.string().email()'
    }
    // URL fields
    else if (lower.includes('url') || lower.includes('website')) {
      zodType = 'z.string().url()'
    }
    // Password fields
    else if (lower.includes('password')) {
      zodType = 'z.string().min(8)'
    }
    // Date fields
    else if (lower.includes('at') || lower.includes('date') || baseType === 'date') {
      zodType = 'z.date()'
    }
    // Boolean fields
    else if (lower.startsWith('is') || lower.startsWith('has') || baseType === 'boolean') {
      zodType = 'z.boolean()'
    }
    // Number fields
    else if (
      lower.includes('age') ||
      lower.includes('count') ||
      lower.includes('quantity') ||
      baseType === 'number'
    ) {
      zodType = 'z.number().int().positive()'
    }
    // Decimal fields
    else if (lower.includes('price') || lower.includes('amount')) {
      zodType = 'z.number().positive()'
    }
    // Array fields
    else if (lower.includes('tags') || lower.includes('categories') || baseType === 'array') {
      zodType = 'z.array(z.string())'
    }
    // Default to string
    else {
      zodType = 'z.string()'

      // Add min length for certain fields
      if (lower.includes('name') || lower.includes('title')) {
        zodType += '.min(1)'
      }
    }

    // Add optional modifier
    if (isOptional) {
      zodType += '.optional()'
    }

    return zodType
  }

  private extractResource(prompt: string): string {
    // Simple extraction - look for common patterns
    const patterns = [
      /api\s+for\s+(?:managing\s+)?(?:\w+\s+)?(\w+)/i,
      /endpoint\s+for\s+(\w+)/i,
      /routes?\s+for\s+(\w+)/i,
      /rest\s+api\s+(?:for\s+)?(?:my\s+)?(?:\w+\s+)?(\w+)/i,
    ]

    for (const pattern of patterns) {
      const matches = prompt.match(pattern)
      if (matches && matches[1]) {
        const resource = matches[1].toLowerCase()
        // Skip common words
        if (!['my', 'the', 'a', 'an', 'blog', 'managing'].includes(resource)) {
          return this.pluralize(resource)
        }
      }
    }

    return 'items'
  }

  private detectOperations(prompt: string): string[] {
    const operations: string[] = []
    const lower = prompt.toLowerCase()

    if (lower.includes('crud') || lower.includes('all operations')) {
      return ['list', 'get', 'create', 'update', 'delete']
    }

    if (lower.includes('list') || lower.includes('fetch') || lower.includes('get all')) {
      operations.push('list')
    }
    if (lower.includes('get single') || lower.includes('get one') || lower.includes('view')) {
      operations.push('get')
    }
    if (lower.includes('create') || lower.includes('add') || lower.includes('post')) {
      operations.push('create')
    }
    if (lower.includes('update') || lower.includes('edit') || lower.includes('modify')) {
      operations.push('update')
    }
    if (lower.includes('delete') || lower.includes('remove')) {
      operations.push('delete')
    }

    // Default to all CRUD operations if none specified
    if (operations.length === 0) {
      return ['list', 'get', 'create', 'update', 'delete']
    }

    return operations
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private pluralize(word: string): string {
    if (word.endsWith('s')) return word
    if (word.endsWith('y')) return word.slice(0, -1) + 'ies'
    return word + 's'
  }

  private singularize(word: string): string {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
    if (word.endsWith('s')) return word.slice(0, -1)
    return word
  }
}
