/**
 * Cross-Platform Monorepo Template
 * Phase 4: Mobile Development - Task 6.2
 *
 * Creates a pnpm workspaces monorepo structure with:
 * - apps/web (Next.js)
 * - apps/mobile (Expo)
 * - packages/shared (API clients, types, utilities)
 * - packages/config (ESLint, TypeScript configs)
 */

export interface MonorepoConfig {
  name: string
  description?: string
  primaryColor?: string
  webPort?: number
}

export interface ProjectFile {
  path: string
  content: string
}

/**
 * Generate root package.json for monorepo
 */
export function generateRootPackageJson(config: MonorepoConfig): string {
  const { name, description = 'A cross-platform monorepo with web and mobile apps' } = config

  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description,
      private: true,
      packageManager: 'pnpm@9.0.0',
      scripts: {
        dev: 'turbo run dev',
        'dev:web': 'pnpm --filter web dev',
        'dev:mobile': 'pnpm --filter mobile start',
        build: 'turbo run build',
        'build:web': 'pnpm --filter web build',
        lint: 'turbo run lint',
        typecheck: 'turbo run typecheck',
        test: 'turbo run test',
        clean: 'turbo run clean && rm -rf node_modules',
        format: 'prettier --write "**/*.{ts,tsx,md,json}"',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        prettier: '^3.2.0',
        turbo: '^2.0.0',
        typescript: '^5.6.0',
      },
      engines: {
        node: '>=18.0.0',
        pnpm: '>=9.0.0',
      },
    },
    null,
    2
  )
}

/**
 * Generate pnpm-workspace.yaml
 */
export function generatePnpmWorkspace(): string {
  return `packages:
  - "apps/*"
  - "packages/*"
`
}

/**
 * Generate turbo.json
 */
export function generateTurboJson(): string {
  return JSON.stringify(
    {
      $schema: 'https://turbo.build/schema.json',
      globalDependencies: ['**/.env.*local'],
      tasks: {
        build: {
          dependsOn: ['^build'],
          outputs: ['.next/**', '!.next/cache/**', 'dist/**'],
        },
        lint: {
          dependsOn: ['^lint'],
        },
        typecheck: {
          dependsOn: ['^typecheck'],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        clean: {
          cache: false,
        },
        test: {
          cache: false,
        },
      },
    },
    null,
    2
  )
}

/**
 * Generate root tsconfig.json (base config)
 */
export function generateRootTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        composite: true,
      },
    },
    null,
    2
  )
}

/**
 * Generate .gitignore for monorepo
 */
export function generateMonorepoGitignore(): string {
  return `# Dependencies
node_modules/

# Build outputs
dist/
.next/
.expo/
web-build/

# Cache
.turbo/
*.tsbuildinfo

# Environment
.env*.local
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# macOS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/

# Expo
*.jks
*.p8
*.p12
*.key
*.mobileprovision
`
}

/**
 * Generate .prettierrc
 */
export function generatePrettierConfig(): string {
  return JSON.stringify(
    {
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 100,
    },
    null,
    2
  )
}

/**
 * Generate root README.md
 */
export function generateMonorepoReadme(config: MonorepoConfig): string {
  return `# ${config.name}

${config.description || 'A cross-platform monorepo with web (Next.js) and mobile (Expo) applications.'}

## Project Structure

\`\`\`
${config.name.toLowerCase().replace(/\s+/g, '-')}/
  apps/
    web/                 # Next.js web application
    mobile/              # Expo mobile application
  packages/
    shared/              # Shared code between web and mobile
      api/               # API clients
      types/             # TypeScript types
      utils/             # Utility functions
    config/              # Shared configuration
      eslint/            # ESLint config
      typescript/        # TypeScript configs
  package.json           # Root package.json
  pnpm-workspace.yaml    # pnpm workspace config
  turbo.json             # Turborepo config
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm 9 or later (\`npm install -g pnpm\`)
- Expo Go app on your mobile device (for mobile testing)

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Development

Run both web and mobile:

\`\`\`bash
pnpm dev
\`\`\`

Run only web:

\`\`\`bash
pnpm dev:web
\`\`\`

Run only mobile:

\`\`\`bash
pnpm dev:mobile
\`\`\`

### Build

\`\`\`bash
pnpm build
\`\`\`

### Lint

\`\`\`bash
pnpm lint
\`\`\`

### Type Check

\`\`\`bash
pnpm typecheck
\`\`\`

## Shared Packages

### @${config.name.toLowerCase().replace(/\s+/g, '-')}/shared

Contains shared code used by both web and mobile:

- **api/**: API client functions
- **types/**: TypeScript type definitions
- **utils/**: Utility functions

### @${config.name.toLowerCase().replace(/\s+/g, '-')}/config

Contains shared configuration:

- **eslint/**: ESLint configuration
- **typescript/**: TypeScript configurations

## Tech Stack

### Web (apps/web)
- Next.js 14
- Tailwind CSS
- shadcn/ui

### Mobile (apps/mobile)
- React Native with Expo
- Expo Router
- NativeWind

### Shared
- TypeScript
- Zod (validation)
- Zustand (state management)

## Adding Shared Code

To add code that should be shared between web and mobile:

1. Add the code to \`packages/shared/\`
2. Export it from the package's index
3. Import in apps using \`@${config.name.toLowerCase().replace(/\s+/g, '-')}/shared\`

Example:

\`\`\`typescript
// In packages/shared/api/users.ts
export async function fetchUsers() {
  // Implementation
}

// In apps/web or apps/mobile
import { fetchUsers } from '@${config.name.toLowerCase().replace(/\s+/g, '-')}/shared/api';
\`\`\`

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
`
}

// ==========================================
// Apps: Web (Next.js)
// ==========================================

/**
 * Generate apps/web/package.json
 */
export function generateWebPackageJson(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify(
    {
      name: 'web',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: `next dev --port ${config.webPort || 3000}`,
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        [`@${slug}/shared`]: 'workspace:*',
        next: '^14.2.0',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        zustand: '^5.0.0',
      },
      devDependencies: {
        [`@${slug}/config`]: 'workspace:*',
        '@types/node': '^20.0.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
        tailwindcss: '^3.4.0',
        typescript: '^5.6.0',
      },
    },
    null,
    2
  )
}

/**
 * Generate apps/web/next.config.js
 */
export function generateWebNextConfig(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@${slug}/shared'],
}

module.exports = nextConfig
`
}

/**
 * Generate apps/web/tsconfig.json
 */
export function generateWebTsConfig(config: MonorepoConfig): string {
  return JSON.stringify(
    {
      extends: '../../tsconfig.json',
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'ES2022'],
        allowJs: true,
        jsx: 'preserve',
        noEmit: true,
        incremental: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./src/*'],
        },
        baseUrl: '.',
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2
  )
}

/**
 * Generate apps/web/tailwind.config.ts
 */
export function generateWebTailwindConfig(): string {
  return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}

export default config
`
}

/**
 * Generate apps/web/postcss.config.js
 */
export function generateWebPostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
}

/**
 * Generate apps/web/src/app/layout.tsx
 */
export function generateWebLayout(config: MonorepoConfig): string {
  return `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${config.name}',
  description: '${config.description || 'A cross-platform application'}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
`
}

/**
 * Generate apps/web/src/app/page.tsx
 */
export function generateWebHomePage(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return `import { formatDate, APP_NAME } from '@${slug}/shared'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-100">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This is the web version of your cross-platform app.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Shared Code Demo
          </h2>
          <p className="text-gray-600">
            Today's date: <span className="font-mono text-primary-600">{formatDate(new Date())}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This date was formatted using a shared utility function from @${slug}/shared
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <h3 className="font-semibold text-primary-900">Web</h3>
            <p className="text-sm text-primary-700">Next.js + Tailwind</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900">Mobile</h3>
            <p className="text-sm text-purple-700">Expo + NativeWind</p>
          </div>
        </div>
      </div>
    </main>
  )
}
`
}

/**
 * Generate apps/web/src/app/globals.css
 */
export function generateWebGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 255, 255, 255;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}
`
}

// ==========================================
// Apps: Mobile (Expo)
// ==========================================

/**
 * Generate apps/mobile/package.json
 */
export function generateMobilePackageJson(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify(
    {
      name: 'mobile',
      version: '1.0.0',
      private: true,
      main: 'expo-router/entry',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
        lint: 'eslint . --ext .ts,.tsx',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        [`@${slug}/shared`]: 'workspace:*',
        expo: '~52.0.0',
        'expo-constants': '~17.0.0',
        'expo-linking': '~7.0.0',
        'expo-router': '~4.0.0',
        'expo-splash-screen': '~0.29.0',
        'expo-status-bar': '~2.0.0',
        nativewind: '^4.0.0',
        react: '18.3.1',
        'react-native': '0.76.0',
        'react-native-gesture-handler': '~2.20.0',
        'react-native-reanimated': '~3.16.0',
        'react-native-safe-area-context': '4.12.0',
        'react-native-screens': '~4.0.0',
        zustand: '^5.0.0',
      },
      devDependencies: {
        [`@${slug}/config`]: 'workspace:*',
        '@babel/core': '^7.25.0',
        '@types/react': '~18.3.0',
        tailwindcss: '^3.4.0',
        typescript: '~5.6.0',
      },
    },
    null,
    2
  )
}

/**
 * Generate apps/mobile/app.json
 */
export function generateMobileAppJson(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify(
    {
      expo: {
        name: config.name,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'automatic',
        splash: {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
        assetBundlePatterns: ['**/*'],
        ios: {
          supportsTablet: true,
          bundleIdentifier: `com.${slug.replace(/-/g, '')}.app`,
        },
        android: {
          adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff',
          },
          package: `com.${slug.replace(/-/g, '')}.app`,
        },
        plugins: ['expo-router'],
        experiments: {
          typedRoutes: true,
        },
        scheme: slug,
      },
    },
    null,
    2
  )
}

/**
 * Generate apps/mobile/tsconfig.json
 */
export function generateMobileTsConfig(): string {
  return JSON.stringify(
    {
      extends: 'expo/tsconfig.base',
      compilerOptions: {
        strict: true,
        paths: {
          '@/*': ['./*'],
        },
        baseUrl: '.',
      },
      include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
    },
    null,
    2
  )
}

/**
 * Generate apps/mobile/tailwind.config.js
 */
export function generateMobileTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
`
}

/**
 * Generate apps/mobile/babel.config.js
 */
export function generateMobileBabelConfig(): string {
  return `module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
`
}

/**
 * Generate apps/mobile/metro.config.js
 */
export function generateMobileMetroConfig(): string {
  return `const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

// Find workspace root
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all workspace packages
config.watchFolders = [workspaceRoot]

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
`
}

/**
 * Generate apps/mobile/global.css
 */
export function generateMobileGlobalCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
`
}

/**
 * Generate apps/mobile/nativewind-env.d.ts
 */
export function generateMobileNativewindEnv(): string {
  return `/// <reference types="nativewind/types" />
`
}

/**
 * Generate apps/mobile/app/_layout.tsx
 */
export function generateMobileRootLayout(): string {
  return `import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import '../global.css'

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}
`
}

/**
 * Generate apps/mobile/app/index.tsx
 */
export function generateMobileHomePage(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return `import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { formatDate, APP_NAME } from '@${slug}/shared'

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome to {APP_NAME}
          </Text>
          <Text className="mt-2 text-base text-gray-600">
            This is the mobile version of your cross-platform app.
          </Text>

          <View className="mt-6 rounded-lg bg-primary-50 p-4">
            <Text className="font-semibold text-primary-900">
              Shared Code Demo
            </Text>
            <Text className="mt-2 text-sm text-primary-700">
              Today's date: {formatDate(new Date())}
            </Text>
            <Text className="mt-1 text-xs text-primary-600">
              Formatted using @${slug}/shared
            </Text>
          </View>

          <View className="mt-4 flex-row gap-4">
            <View className="flex-1 rounded-lg bg-blue-50 p-4">
              <Text className="font-semibold text-blue-900">Web</Text>
              <Text className="text-xs text-blue-700">Next.js</Text>
            </View>
            <View className="flex-1 rounded-lg bg-purple-50 p-4">
              <Text className="font-semibold text-purple-900">Mobile</Text>
              <Text className="text-xs text-purple-700">Expo</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
`
}

// ==========================================
// Packages: Shared
// ==========================================

/**
 * Generate packages/shared/package.json
 */
export function generateSharedPackageJson(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify(
    {
      name: `@${slug}/shared`,
      version: '1.0.0',
      main: './src/index.ts',
      types: './src/index.ts',
      exports: {
        '.': './src/index.ts',
        './api': './src/api/index.ts',
        './types': './src/types/index.ts',
        './utils': './src/utils/index.ts',
      },
      scripts: {
        lint: 'eslint src --ext .ts,.tsx',
        typecheck: 'tsc --noEmit',
      },
      dependencies: {
        zod: '^3.23.0',
      },
      devDependencies: {
        typescript: '^5.6.0',
      },
    },
    null,
    2
  )
}

/**
 * Generate packages/shared/tsconfig.json
 */
export function generateSharedTsConfig(): string {
  return JSON.stringify(
    {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  )
}

/**
 * Generate packages/shared/src/index.ts
 */
export function generateSharedIndex(config: MonorepoConfig): string {
  return `// Re-export all shared modules
export * from './api'
export * from './types'
export * from './utils'

// App-wide constants
export const APP_NAME = '${config.name}'
export const APP_VERSION = '1.0.0'
`
}

/**
 * Generate packages/shared/src/api/index.ts
 */
export function generateSharedApiIndex(): string {
  return `/**
 * Shared API client
 * Used by both web and mobile applications
 */

export interface ApiConfig {
  baseUrl: string
  timeout?: number
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiClient {
  private baseUrl: string
  private timeout: number
  private token: string | null = null

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`
    }

    return headers
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError
    }

    return response.json()
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError
    }

    return response.json()
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError
    }

    return response.json()
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError
    }

    return response.json()
  }
}

// Default API client instance
// Configure with your actual API URL
export const apiClient = new ApiClient({
  baseUrl: process.env.API_URL || 'https://api.example.com',
})

export { ApiClient }
`
}

/**
 * Generate packages/shared/src/types/index.ts
 */
export function generateSharedTypesIndex(): string {
  return `import { z } from 'zod'

/**
 * User schema and type
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

/**
 * Pagination types
 */
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Error types
 */
export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Common form validation schemas
 */
export const EmailSchema = z.string().email('Invalid email address')
export const PasswordSchema = z.string().min(8, 'Password must be at least 8 characters')

export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
})

export type LoginFormData = z.infer<typeof LoginFormSchema>

export const RegisterFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export type RegisterFormData = z.infer<typeof RegisterFormSchema>
`
}

/**
 * Generate packages/shared/src/utils/index.ts
 */
export function generateSharedUtilsIndex(): string {
  return `/**
 * Shared utility functions
 * Used by both web and mobile applications
 */

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date, locale = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date, locale = 'en-US'): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return \`\${diffMins} minute\${diffMins === 1 ? '' : 's'} ago\`
  if (diffHours < 24) return \`\${diffHours} hour\${diffHours === 1 ? '' : 's'} ago\`
  if (diffDays < 7) return \`\${diffDays} day\${diffDays === 1 ? '' : 's'} ago\`

  return formatDate(date)
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Generate a random ID
 */
export function generateId(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
`
}

// ==========================================
// Packages: Config
// ==========================================

/**
 * Generate packages/config/package.json
 */
export function generateConfigPackageJson(config: MonorepoConfig): string {
  const slug = config.name.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify(
    {
      name: `@${slug}/config`,
      version: '1.0.0',
      main: './index.js',
      files: ['eslint', 'typescript'],
      devDependencies: {
        '@typescript-eslint/eslint-plugin': '^8.0.0',
        '@typescript-eslint/parser': '^8.0.0',
        eslint: '^8.57.0',
        'eslint-config-prettier': '^9.1.0',
        typescript: '^5.6.0',
      },
    },
    null,
    2
  )
}

/**
 * Generate packages/config/eslint/base.js
 */
export function generateConfigEslintBase(): string {
  return `module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['node_modules', 'dist', '.next', '.expo'],
}
`
}

/**
 * Generate packages/config/typescript/base.json
 */
export function generateConfigTsBase(): string {
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/tsconfig',
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
      },
    },
    null,
    2
  )
}

// ==========================================
// Generate all files
// ==========================================

/**
 * Generate all files for a cross-platform monorepo
 */
export function generateMonorepoProject(config: MonorepoConfig): ProjectFile[] {
  const files: ProjectFile[] = [
    // Root configuration
    { path: 'package.json', content: generateRootPackageJson(config) },
    { path: 'pnpm-workspace.yaml', content: generatePnpmWorkspace() },
    { path: 'turbo.json', content: generateTurboJson() },
    { path: 'tsconfig.json', content: generateRootTsConfig() },
    { path: '.gitignore', content: generateMonorepoGitignore() },
    { path: '.prettierrc', content: generatePrettierConfig() },
    { path: 'README.md', content: generateMonorepoReadme(config) },

    // Web app
    { path: 'apps/web/package.json', content: generateWebPackageJson(config) },
    { path: 'apps/web/next.config.js', content: generateWebNextConfig(config) },
    { path: 'apps/web/tsconfig.json', content: generateWebTsConfig(config) },
    { path: 'apps/web/tailwind.config.ts', content: generateWebTailwindConfig() },
    { path: 'apps/web/postcss.config.js', content: generateWebPostcssConfig() },
    { path: 'apps/web/src/app/layout.tsx', content: generateWebLayout(config) },
    { path: 'apps/web/src/app/page.tsx', content: generateWebHomePage(config) },
    { path: 'apps/web/src/app/globals.css', content: generateWebGlobalsCss() },

    // Mobile app
    { path: 'apps/mobile/package.json', content: generateMobilePackageJson(config) },
    { path: 'apps/mobile/app.json', content: generateMobileAppJson(config) },
    { path: 'apps/mobile/tsconfig.json', content: generateMobileTsConfig() },
    { path: 'apps/mobile/tailwind.config.js', content: generateMobileTailwindConfig() },
    { path: 'apps/mobile/babel.config.js', content: generateMobileBabelConfig() },
    { path: 'apps/mobile/metro.config.js', content: generateMobileMetroConfig() },
    { path: 'apps/mobile/global.css', content: generateMobileGlobalCss() },
    { path: 'apps/mobile/nativewind-env.d.ts', content: generateMobileNativewindEnv() },
    { path: 'apps/mobile/app/_layout.tsx', content: generateMobileRootLayout() },
    { path: 'apps/mobile/app/index.tsx', content: generateMobileHomePage(config) },
    { path: 'apps/mobile/assets/.gitkeep', content: '# Placeholder for mobile assets\n' },

    // Shared package
    { path: 'packages/shared/package.json', content: generateSharedPackageJson(config) },
    { path: 'packages/shared/tsconfig.json', content: generateSharedTsConfig() },
    { path: 'packages/shared/src/index.ts', content: generateSharedIndex(config) },
    { path: 'packages/shared/src/api/index.ts', content: generateSharedApiIndex() },
    { path: 'packages/shared/src/types/index.ts', content: generateSharedTypesIndex() },
    { path: 'packages/shared/src/utils/index.ts', content: generateSharedUtilsIndex() },

    // Config package
    { path: 'packages/config/package.json', content: generateConfigPackageJson(config) },
    { path: 'packages/config/eslint/base.js', content: generateConfigEslintBase() },
    { path: 'packages/config/typescript/base.json', content: generateConfigTsBase() },
  ]

  return files
}

/**
 * Get list of all file paths in the monorepo template
 */
export function getMonorepoFilePaths(): string[] {
  return [
    'package.json',
    'pnpm-workspace.yaml',
    'turbo.json',
    'tsconfig.json',
    '.gitignore',
    '.prettierrc',
    'README.md',
    'apps/web/package.json',
    'apps/web/next.config.js',
    'apps/web/tsconfig.json',
    'apps/web/tailwind.config.ts',
    'apps/web/postcss.config.js',
    'apps/web/src/app/layout.tsx',
    'apps/web/src/app/page.tsx',
    'apps/web/src/app/globals.css',
    'apps/mobile/package.json',
    'apps/mobile/app.json',
    'apps/mobile/tsconfig.json',
    'apps/mobile/tailwind.config.js',
    'apps/mobile/babel.config.js',
    'apps/mobile/metro.config.js',
    'apps/mobile/global.css',
    'apps/mobile/nativewind-env.d.ts',
    'apps/mobile/app/_layout.tsx',
    'apps/mobile/app/index.tsx',
    'apps/mobile/assets/.gitkeep',
    'packages/shared/package.json',
    'packages/shared/tsconfig.json',
    'packages/shared/src/index.ts',
    'packages/shared/src/api/index.ts',
    'packages/shared/src/types/index.ts',
    'packages/shared/src/utils/index.ts',
    'packages/config/package.json',
    'packages/config/eslint/base.js',
    'packages/config/typescript/base.json',
  ]
}

/**
 * Template metadata for documentation
 */
export const monorepoTemplateMetadata = {
  name: 'Cross-Platform Monorepo',
  description: 'A pnpm workspaces monorepo with Next.js web app, Expo mobile app, and shared packages',
  version: '1.0.0',
  buildTool: 'Turborepo',
  packageManager: 'pnpm',
  apps: [
    { name: 'web', framework: 'Next.js', styling: 'Tailwind CSS' },
    { name: 'mobile', framework: 'Expo', styling: 'NativeWind' },
  ],
  packages: [
    { name: 'shared', description: 'API clients, types, utilities' },
    { name: 'config', description: 'ESLint, TypeScript configs' },
  ],
  features: [
    'pnpm workspaces for package management',
    'Turborepo for build orchestration',
    'Shared TypeScript types',
    'Shared API client',
    'Shared utility functions',
    'Consistent ESLint configuration',
    'Cross-project TypeScript paths',
  ],
}
