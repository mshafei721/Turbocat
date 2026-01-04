/**
 * Supabase Setup Skill Handler
 *
 * Configures Supabase database, authentication, storage, and realtime features.
 * Generates SQL migrations, RLS policies, and client/server integration code.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/handlers/supabase-setup.ts
 */

interface Column {
  name: string
  type: string
  primaryKey?: boolean
  unique?: boolean
  notNull?: boolean
  default?: string
  references?: string
}

interface TableDefinition {
  name: string
  columns: Column[]
}

interface RLSPolicy {
  table: string
  name: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  using?: string
  withCheck?: string
}

interface StorageBucket {
  name: string
  public: boolean
  fileSizeLimit?: number
  allowedMimeTypes?: string[]
}

interface AuthConfig {
  providers: string[]
  envVars: string[]
}

interface MCPCommand {
  action: string
  [key: string]: unknown
}

interface ProcessResult {
  tables: string[]
  authProviders: string[]
  storageBuckets: string[]
  realtimeTables: string[]
  files: Array<{
    path: string
    content: string
  }>
}

export class SupabaseSetupHandler {
  /**
   * Generate table creation command
   */
  generateTableCommand(table: TableDefinition): MCPCommand & { sql: string; tableName: string; columns: Column[] } {
    const columnDefs = table.columns.map((col) => {
      let def = `  ${col.name} ${col.type.toUpperCase()}`

      if (col.primaryKey) {
        def += ' PRIMARY KEY'
      }
      if (col.unique) {
        def += ' UNIQUE'
      }
      if (col.notNull) {
        def += ' NOT NULL'
      }
      if (col.default) {
        def += ` DEFAULT ${col.default}`
      }
      if (col.references) {
        def += ` REFERENCES ${col.references}`
      }

      return def
    })

    const sql = `CREATE TABLE ${table.name} (\n${columnDefs.join(',\n')}\n);`

    return {
      action: 'create_table',
      tableName: table.name,
      columns: table.columns,
      sql,
    }
  }

  /**
   * Generate RLS policy creation command
   */
  generateRLSPolicy(policy: RLSPolicy): MCPCommand & { sql: string; table: string; name: string } {
    let sql = `CREATE POLICY "${policy.name}"\n  ON ${policy.table}\n  FOR ${policy.operation}`

    if (policy.using) {
      sql += `\n  USING (${policy.using})`
    }

    if (policy.withCheck) {
      sql += `\n  WITH CHECK (${policy.withCheck})`
    }

    sql += ';'

    return {
      action: 'create_policy',
      table: policy.table,
      name: policy.name,
      sql,
    }
  }

  /**
   * Enable RLS on table
   */
  enableRLS(tableName: string): MCPCommand & { sql: string; table: string } {
    return {
      action: 'enable_rls',
      table: tableName,
      sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
    }
  }

  /**
   * Generate migration from schema definition
   */
  generateMigration(schema: { tables: TableDefinition[] }): { commands: MCPCommand[]; sql: string } {
    const commands: MCPCommand[] = []
    let sql = '-- Supabase Migration\n\n'

    for (const table of schema.tables) {
      const cmd = this.generateTableCommand(table)
      commands.push(cmd)
      sql += cmd.sql + '\n\n'
    }

    return { commands, sql }
  }

  /**
   * Generate auth configuration
   */
  generateAuthConfig(providers: string[]): AuthConfig {
    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    // Add provider-specific env vars
    for (const provider of providers) {
      const upper = provider.toUpperCase()
      envVars.push(`${upper}_CLIENT_ID`)
      envVars.push(`${upper}_CLIENT_SECRET`)
    }

    return {
      providers,
      envVars,
    }
  }

  /**
   * Generate client-side auth integration code
   */
  generateClientAuthCode(config: { providers: string[] }): string {
    const signInFunctions = config.providers
      .map((provider) => {
        return `/**
 * Sign in with ${this.capitalize(provider)}
 */
export async function signInWith${this.capitalize(provider)}() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: '${provider}',
    options: {
      redirectTo: \`\${location.origin}/auth/callback\`,
    },
  })
  return { data, error }
}`
      })
      .join('\n\n')

    return `import { createBrowserClient } from '@supabase/ssr'

/**
 * Create Supabase browser client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

${signInFunctions}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
`
  }

  /**
   * Generate server-side auth integration code
   */
  generateServerAuthCode(config: { providers: string[] }): string {
    return `import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create Supabase server client
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie setting errors
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}

/**
 * Get current user server-side
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get current session server-side
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
`
  }

  /**
   * Generate auth callback route handler
   */
  generateAuthCallbackRoute(): { path: string; code: string } {
    return {
      path: 'app/auth/callback/route.ts',
      code: `import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Auth callback route handler
 * Exchanges OAuth code for session
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home or specified URL
  return NextResponse.redirect(origin)
}
`,
    }
  }

  /**
   * Generate storage bucket creation command
   */
  generateStorageBucket(bucket: StorageBucket): MCPCommand & { name: string; public: boolean; config: string } {
    const config = JSON.stringify(
      {
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      },
      null,
      2
    )

    return {
      action: 'create_bucket',
      name: bucket.name,
      public: bucket.public,
      config,
      sql: `INSERT INTO storage.buckets (id, name, public) VALUES ('${bucket.name}', '${bucket.name}', ${bucket.public});`,
    }
  }

  /**
   * Generate storage upload client code
   */
  generateStorageUploadCode(bucketName: string): string {
    return `import { createClient } from './client'

/**
 * Upload file to ${bucketName} bucket
 */
export async function uploadTo${this.capitalize(bucketName)}(
  path: string,
  file: File
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('${bucketName}')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return data
}

/**
 * Get public URL for file in ${bucketName} bucket
 */
export function get${this.capitalize(bucketName)}PublicUrl(path: string) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from('${bucketName}')
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Delete file from ${bucketName} bucket
 */
export async function deleteFrom${this.capitalize(bucketName)}(path: string) {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from('${bucketName}')
    .remove([path])

  if (error) throw error
}
`
  }

  /**
   * Enable realtime for table
   */
  enableRealtime(tableName: string): MCPCommand & { sql: string; table: string } {
    return {
      action: 'enable_realtime',
      table: tableName,
      sql: `ALTER PUBLICATION supabase_realtime ADD TABLE ${tableName};`,
    }
  }

  /**
   * Generate realtime subscription client code
   */
  generateRealtimeSubscription(table: string, events: string[]): string {
    const eventListeners = events
      .map((event) => {
        return `      .on(
        'postgres_changes',
        {
          event: '${event}',
          schema: 'public',
          table: '${table}',
        },
        (payload) => {
          console.log('${event}:', payload)
          // Handle ${event} event
        }
      )`
      })
      .join('\n')

    return `import { createClient } from './client'
import { useEffect, useState } from 'react'

/**
 * Subscribe to realtime changes on ${table} table
 */
export function use${this.capitalize(table)}Subscription() {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('${table}_changes')
${eventListeners}
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return data
}
`
  }

  /**
   * Process a complete prompt and generate Supabase configuration
   */
  processPrompt(prompt: string): ProcessResult {
    const tables = this.extractTables(prompt)
    const authProviders = this.extractAuthProviders(prompt)
    const storageBuckets = this.extractStorageBuckets(prompt)
    const realtimeTables = this.extractRealtimeTables(prompt, tables)

    const files: Array<{ path: string; content: string }> = []

    // Generate auth files if providers specified
    if (authProviders.length > 0) {
      const authConfig = this.generateAuthConfig(authProviders)
      const clientCode = this.generateClientAuthCode({ providers: authProviders })
      const serverCode = this.generateServerAuthCode({ providers: authProviders })
      const callbackRoute = this.generateAuthCallbackRoute()

      files.push({
        path: 'lib/supabase/client.ts',
        content: clientCode,
      })

      files.push({
        path: 'lib/supabase/server.ts',
        content: serverCode,
      })

      files.push({
        path: callbackRoute.path,
        content: callbackRoute.code,
      })

      // Add env example
      const envExample = authConfig.envVars.map((v) => `${v}=`).join('\n')
      files.push({
        path: '.env.local.example',
        content: envExample,
      })
    }

    // Generate storage files
    for (const bucket of storageBuckets) {
      const storageCode = this.generateStorageUploadCode(bucket)
      files.push({
        path: `lib/supabase/storage-${bucket}.ts`,
        content: storageCode,
      })
    }

    // Generate realtime files
    for (const table of realtimeTables) {
      const realtimeCode = this.generateRealtimeSubscription(table, ['INSERT', 'UPDATE', 'DELETE'])
      files.push({
        path: `lib/supabase/realtime-${table}.ts`,
        content: realtimeCode,
      })
    }

    return {
      tables,
      authProviders,
      storageBuckets,
      realtimeTables,
      files,
    }
  }

  // Private helper methods

  private extractTables(prompt: string): string[] {
    const tables: string[] = []
    const lower = prompt.toLowerCase()

    // Use match instead of regex with while loop
    const tableMatches = lower.match(/tables?\s+(?:for\s+)?(\w+)(?:\s+and\s+(\w+))?/gi) || []
    const withMatches = lower.match(/with\s+(\w+)\s+and\s+(\w+)\s+tables?/gi) || []

    const allMatches = [...tableMatches, ...withMatches]
    for (const matchStr of allMatches) {
      const words = matchStr.split(/\s+/)
      for (const word of words) {
        if (word && !['table', 'tables', 'for', 'with', 'and'].includes(word)) {
          tables.push(word.toLowerCase())
        }
      }
    }

    return [...new Set(tables)]
  }

  private extractAuthProviders(prompt: string): string[] {
    const providers: string[] = []
    const commonProviders = ['google', 'github', 'facebook', 'twitter', 'discord', 'apple']

    for (const provider of commonProviders) {
      if (new RegExp(`\\b${provider}\\b`, 'i').test(prompt)) {
        providers.push(provider.toLowerCase())
      }
    }

    return providers
  }

  private extractStorageBuckets(prompt: string): string[] {
    const buckets: string[] = []
    const lower = prompt.toLowerCase()

    const matches = lower.match(/(?:storage|bucket)\s+(?:bucket\s+)?(?:for\s+)?(\w+)/gi) || []
    for (const matchStr of matches) {
      const words = matchStr.split(/\s+/)
      const lastWord = words[words.length - 1]
      if (lastWord && !['storage', 'bucket', 'for'].includes(lastWord)) {
        buckets.push(lastWord.toLowerCase())
      }
    }

    return [...new Set(buckets)]
  }

  private extractRealtimeTables(prompt: string, tables: string[]): string[] {
    const realtimeTables: string[] = []

    if (prompt.toLowerCase().includes('realtime')) {
      // If realtime is mentioned, check which tables
      for (const table of tables) {
        if (new RegExp(`realtime.*${table}|${table}.*realtime`, 'i').test(prompt)) {
          realtimeTables.push(table)
        }
      }

      // If no specific tables mentioned, enable for all
      if (realtimeTables.length === 0 && tables.length > 0) {
        return tables
      }
    }

    return realtimeTables
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
