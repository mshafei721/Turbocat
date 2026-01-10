/**
 * Database Design Skill Handler
 *
 * Generates Drizzle ORM schemas from natural language descriptions.
 * Extracts entities, detects relationships, and creates TypeScript schema files.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/handlers/database-design.ts
 */

interface FieldTypes {
  [field: string]: string
}

interface Relationship {
  from: string
  to: string
  type: 'many-to-one' | 'one-to-many' | 'many-to-many'
  foreignKey?: string
  joinTable?: string
}

interface Entity {
  name: string
  fields: FieldTypes
}

interface ProcessResult {
  entities: string[]
  schemas: string[]
  relationships: Relationship[]
  types: string[]
  migrations: string[]
}

export class DatabaseDesignHandler {
  /**
   * Extract entity names from natural language prompt
   *
   * Looks for table names, entity keywords, and nouns that represent database tables.
   */
  extractEntities(prompt: string): string[] {
    const entities = new Set<string>()

    // Extract from "table" keyword patterns
    const tablePattern = /(\w+)\s+table/gi
    let match
    while ((match = tablePattern.exec(prompt)) !== null) {
      entities.add(this.pluralize(match[1].toLowerCase()))
    }

    // Extract from common entity keywords
    const entityKeywords = [
      'users',
      'posts',
      'comments',
      'products',
      'orders',
      'customers',
      'roles',
      'permissions',
      'categories',
      'tags',
    ]

    for (const keyword of entityKeywords) {
      if (new RegExp(`\\\\b${keyword}\\\\b`, 'i').test(prompt)) {
        entities.add(keyword.toLowerCase())
      }
    }

    // Extract from "with X and Y" patterns
    const withPattern = /(?:with|have|need|create)\s+(?:a\s+)?(\w+)(?:\s+and\s+(\w+))?/gi
    while ((match = withPattern.exec(prompt)) !== null) {
      if (match[1] && !this.isEntityStopWord(match[1])) {
        entities.add(this.pluralize(match[1].toLowerCase()))
      }
      if (match[2] && !this.isEntityStopWord(match[2])) {
        entities.add(this.pluralize(match[2].toLowerCase()))
      }
    }

    return Array.from(entities)
  }

  /**
   * Extract field names for a specific entity from the prompt
   */
  extractFields(entity: string, prompt: string): string[] {
    const fields = new Set<string>()

    // Extract from parenthetical field lists: "users (id, name, email)" or "users table (id, name, email)"
    // This pattern requires entity name followed immediately by optional "table" and then parentheses
    const entityPattern = new RegExp(`${entity}(?:\\s+table)?\\s*\\(([^)]+)\\)`, 'i')
    const match = entityPattern.exec(prompt)
    if (match) {
      const fieldList = match[1].split(/,\s*/)
      fieldList.forEach((field) => {
        const cleaned = field.trim().replace(/\s+/g, '').replace(/\([^)]*\)/g, '')
        if (cleaned) {
          fields.add(this.toCamelCase(cleaned))
        }
      })
      return Array.from(fields)
    }

    // Extract from "with" patterns: "users table with id, name, email"
    const withPattern = new RegExp(`${entity}\\s+(?:table\\s+)?with\\s+([^\\n]+)`, 'i')
    const withMatch = withPattern.exec(prompt)
    if (withMatch) {
      const fieldList = withMatch[1].split(/,\s*(?:and\s+)?/)
      fieldList.forEach((field) => {
        const cleaned = field.trim().replace(/\([^)]*\)/g, '').trim()
        if (cleaned && !this.isStopWord(cleaned)) {
          fields.add(this.toCamelCase(cleaned))
        }
      })
      return Array.from(fields)
    }

    // Extract from "have an X, Y, and Z" patterns: "users have an email (string), age (number)"
    const havePattern = new RegExp(`${entity}\\s+have\\s+an?\\s+([^.]+)`, 'i')
    const haveMatch = havePattern.exec(prompt)
    if (haveMatch) {
      const fieldList = haveMatch[1].split(/,\s*(?:and\s+)?/)
      fieldList.forEach((fieldStr) => {
        // Remove type annotations in parentheses: "email (string)" -> "email"
        const cleaned = fieldStr.trim().replace(/\s*\([^)]*\)\s*/g, '').trim()
        if (cleaned && !this.isStopWord(cleaned)) {
          fields.add(this.toCamelCase(cleaned))
        }
      })
      return Array.from(fields)
    }

    // Default: return standard fields
    return ['id', 'createdAt', 'updatedAt']
  }

  /**
   * Infer Drizzle field types from field names and context
   */
  inferFieldTypes(entity: string, prompt: string): FieldTypes {
    const fields = this.extractFields(entity, prompt)
    const types: FieldTypes = {}

    for (const field of fields) {
      types[field] = this.inferType(field, prompt)
    }

    return types
  }

  /**
   * Detect relationships between entities
   */
  detectRelationships(prompt: string, entities: string[]): Relationship[] {
    const relationships: Relationship[] = []

    // Detect "X write/have/own Y" patterns (one-to-many)
    for (const from of entities) {
      for (const to of entities) {
        if (from === to) continue

        const singular = this.singularize(from)
        const relationshipVerbs = [
          'write',
          'create',
          'own',
          'author',
          'publish',
          'have',
          'has',
          'contain',
        ]

        for (const verb of relationshipVerbs) {
          const pattern = new RegExp(`${singular}s?\\s+${verb}s?\\s+${to}`, 'i')
          if (pattern.test(prompt)) {
            relationships.push({
              from: to,
              to: from,
              type: 'many-to-one',
              foreignKey: `${this.singularize(from)}Id`,
            })
          }
        }

        // Detect "X have many Y" patterns
        const haveManyPattern = new RegExp(`${singular}s?\\s+have\\s+many\\s+${to}`, 'i')
        if (haveManyPattern.test(prompt)) {
          relationships.push({
            from: to,
            to: from,
            type: 'many-to-one',
            foreignKey: `${this.singularize(from)}Id`,
          })
        }

        // Detect "Y belong to X" patterns
        const belongPattern = new RegExp(`${to}\\s+belong\\s+to\\s+${singular}s?`, 'i')
        if (belongPattern.test(prompt)) {
          relationships.push({
            from: to,
            to: from,
            type: 'many-to-one',
            foreignKey: `${this.singularize(from)}Id`,
          })
        }
      }
    }

    // Detect many-to-many relationships
    for (const entity1 of entities) {
      for (const entity2 of entities) {
        if (entity1 === entity2) continue

        const manyToManyPattern = new RegExp(
          `${entity1}\\s+can\\s+have\\s+many\\s+${entity2}.*${entity2}\\s+can\\s+have\\s+many\\s+${entity1}`,
          'i'
        )
        if (manyToManyPattern.test(prompt)) {
          relationships.push({
            from: entity1,
            to: entity2,
            type: 'many-to-many',
            joinTable: `${this.singularize(entity1)}${this.capitalize(this.singularize(entity2))}s`,
          })
        }
      }
    }

    // Remove duplicates
    return this.deduplicateRelationships(relationships)
  }

  /**
   * Generate Drizzle schema code for a single entity
   */
  generateDrizzleSchema(
    entity: string,
    fields: FieldTypes,
    relationships: Relationship[] = []
  ): string {
    const imports = new Set(['pgTable'])
    const fieldDefinitions: string[] = []

    // Generate field definitions
    for (const [field, type] of Object.entries(fields)) {
      imports.add(this.getDrizzleImport(type))
      const sqlName = this.toSnakeCase(field)
      let definition = `    ${field}: ${type}('${sqlName}')`

      // Add primary key
      if (field === 'id') {
        definition += '.primaryKey()'
      }

      // Add not null for required fields
      if (this.isRequiredField(field)) {
        definition += '.notNull()'
      }

      // Add default values
      if (field === 'createdAt' || field === 'updatedAt') {
        definition += '.defaultNow()'
        if (!definition.includes('.notNull()')) {
          definition += '.notNull()'
        }
      }

      // Add foreign key references
      const rel = relationships.find((r) => r.from === entity && r.foreignKey === field)
      if (rel) {
        const refTable = rel.to
        definition += `.references(() => ${refTable}.id, { onDelete: 'cascade' })`
      }

      definition += ','
      fieldDefinitions.push(definition)
    }

    // Generate import statement
    const importList = Array.from(imports).join(', ')
    const importStatement = `import { ${importList} } from 'drizzle-orm/pg-core'\n`

    // Generate schema
    const schema = `${importStatement}
export const ${entity} = pgTable('${entity}', {
${fieldDefinitions.join('\n')}
})
`

    return schema
  }

  /**
   * Generate complete schema file with all entities
   */
  generateSchemaFile(entities: Entity[]): string {
    const imports = new Set(['pgTable', 'text', 'timestamp'])
    let schemas = ''

    // Collect all field types
    for (const entity of entities) {
      for (const type of Object.values(entity.fields)) {
        imports.add(this.getDrizzleImport(type))
      }
    }

    // Generate import statement
    const importList = Array.from(imports).join(', ')
    const importStatement = `import { ${importList} } from 'drizzle-orm/pg-core'\n\n`

    // Generate each schema
    for (const entity of entities) {
      schemas += `export const ${entity.name} = pgTable('${entity.name}', {\n`

      for (const [field, type] of Object.entries(entity.fields)) {
        const sqlName = this.toSnakeCase(field)
        let definition = `  ${field}: ${type}('${sqlName}')`

        if (field === 'id') {
          definition += '.primaryKey()'
        }

        if (this.isRequiredField(field)) {
          definition += '.notNull()'
        }

        if (field === 'createdAt' || field === 'updatedAt') {
          definition += '.defaultNow()'
          if (!definition.includes('.notNull()')) {
            definition += '.notNull()'
          }
        }

        definition += ','
        schemas += `${definition}\n`
      }

      schemas += '})\n\n'
    }

    return importStatement + schemas
  }

  /**
   * Generate TypeScript types for Insert and Select operations
   */
  generateTypes(entity: string, fields: FieldTypes): string {
    const typeName = this.capitalize(this.singularize(entity))

    return `export type ${typeName} = typeof ${entity}.$inferSelect
export type Insert${typeName} = typeof ${entity}.$inferInsert
`
  }

  /**
   * Generate PostgreSQL migration SQL
   */
  generateMigrationSQL(
    entity: string,
    fields: FieldTypes,
    relationships: Relationship[] = []
  ): string {
    const columns: string[] = []

    for (const [field, type] of Object.entries(fields)) {
      const sqlName = this.toSnakeCase(field)
      let sqlType = this.toSQLType(type)
      let definition = `  ${sqlName} ${sqlType}`

      if (field === 'id') {
        definition += ' PRIMARY KEY'
      }

      if (this.isRequiredField(field)) {
        definition += ' NOT NULL'
      }

      if (field === 'createdAt' || field === 'updatedAt') {
        definition += ' DEFAULT NOW()'
      }

      // Add foreign key constraint
      const rel = relationships.find((r) => r.from === entity && r.foreignKey === field)
      if (rel) {
        const refTable = rel.to
        definition += ` REFERENCES ${refTable}(id) ON DELETE CASCADE`
      }

      columns.push(definition)
    }

    return `CREATE TABLE ${entity} (
${columns.join(',\n')}
);
`
  }

  /**
   * Process a complete prompt and generate all schemas
   */
  processPrompt(prompt: string): ProcessResult {
    const entities = this.extractEntities(prompt)
    const relationships = this.detectRelationships(prompt, entities)
    const schemas: string[] = []
    const types: string[] = []
    const migrations: string[] = []

    for (const entity of entities) {
      const fieldTypes = this.inferFieldTypes(entity, prompt)
      const schema = this.generateDrizzleSchema(entity, fieldTypes, relationships)
      const typeDefinition = this.generateTypes(entity, fieldTypes)
      const migration = this.generateMigrationSQL(entity, fieldTypes, relationships)

      schemas.push(schema)
      types.push(typeDefinition)
      migrations.push(migration)
    }

    return {
      entities,
      schemas,
      relationships,
      types,
      migrations,
    }
  }

  // Helper methods

  private inferType(field: string, prompt: string): string {
    const lower = field.toLowerCase()

    // Check explicit type mentions in prompt
    const typePattern = new RegExp(`${field}\\s*\\(([^)]+)\\)`, 'i')
    const match = typePattern.exec(prompt)
    if (match) {
      const explicitType = match[1].toLowerCase()
      if (explicitType.includes('string') || explicitType.includes('text')) return 'text'
      if (explicitType.includes('number') || explicitType.includes('int')) return 'integer'
      if (explicitType.includes('bool')) return 'boolean'
      if (explicitType.includes('date') || explicitType.includes('time')) return 'timestamp'
    }

    // Infer from field name
    if (lower === 'id' || lower.endsWith('id')) return 'text'
    if (lower.includes('email') || lower.includes('name') || lower.includes('title'))
      return 'text'
    if (lower.includes('content') || lower.includes('description') || lower.includes('bio'))
      return 'text'
    if (
      lower.includes('age') ||
      lower.includes('count') ||
      lower.includes('quantity') ||
      lower.includes('number')
    )
      return 'integer'
    if (lower.includes('price') || lower.includes('amount')) return 'decimal'
    if (lower.startsWith('is') || lower.startsWith('has') || lower.includes('enabled'))
      return 'boolean'
    if (
      lower.includes('at') ||
      lower.includes('date') ||
      lower.includes('time') ||
      lower === 'createdat' ||
      lower === 'updatedat'
    )
      return 'timestamp'
    if (lower.includes('tags') || lower.includes('roles')) return 'jsonb'

    return 'text' // Default to text
  }

  private getDrizzleImport(type: string): string {
    return type
  }

  private toSQLType(drizzleType: string): string {
    const typeMap: { [key: string]: string } = {
      text: 'TEXT',
      integer: 'INTEGER',
      decimal: 'DECIMAL',
      boolean: 'BOOLEAN',
      timestamp: 'TIMESTAMP',
      jsonb: 'JSONB',
    }
    return typeMap[drizzleType] || 'TEXT'
  }

  private isRequiredField(field: string): boolean {
    return field === 'id' || field === 'email' || field === 'name'
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
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

  private isEntityStopWord(word: string): boolean {
    const stopWords = [
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'with',
      'for',
      'to',
      'of',
      'in',
      'on',
      'at',
      'schema',
      'schemas',
      'database',
      'databases',
      'table',
      'tables',
      'blog', // descriptor, not entity (e.g., "blog schema")
      'app', // descriptor, not entity (e.g., "app database")
      'id', // field name, not entity
      'name', // field name, not entity
      'title', // field name, not entity
      'text', // field name, not entity
      'content', // field name, not entity
      'email', // field name, not entity
    ]
    return stopWords.includes(word.toLowerCase())
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'with',
      'for',
      'to',
      'of',
      'in',
      'on',
      'at',
      'schema',
      'schemas',
      'database',
      'databases',
      'table',
      'tables',
    ]
    return stopWords.includes(word.toLowerCase())
  }

  private deduplicateRelationships(relationships: Relationship[]): Relationship[] {
    const seen = new Set<string>()
    const result: Relationship[] = []

    for (const rel of relationships) {
      const key = `${rel.from}-${rel.to}-${rel.type}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(rel)
      }
    }

    return result
  }
}
