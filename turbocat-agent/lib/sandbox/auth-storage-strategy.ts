/**
 * Authentication & Storage Strategy Logic
 * Phase 4: Mobile Development - Task 4.5
 *
 * Provides decision logic for authentication and storage recommendations
 * based on project type (mobile-only vs cross-platform).
 */

export type ProjectType = 'mobile-only' | 'cross-platform' | 'web-only'
export type StorageDataType =
  | 'user-preferences'
  | 'local-cache'
  | 'user-data'
  | 'credentials'
  | 'media'
  | 'analytics'
  | 'unknown'
export type DataSize = 'small' | 'medium' | 'large'

export interface ProjectContext {
  platform: 'web' | 'mobile'
  hasLinkedWebProject?: boolean
  isMonorepo?: boolean
  userRequest?: string
}

export interface AuthStrategy {
  recommendation: string
  oauth: {
    package: string
    description: string
  }
  tokenStorage: {
    package: string
    secure: boolean
    description: string
  }
  sessionSharing?: {
    strategy: string
    description: string
  }
  sharedApiClient: boolean
  codeExample: string
  appJsonConfig?: string
}

export interface StorageStrategy {
  recommendation: string
  localData: {
    package: string
    description: string
    useCase: string[]
  }
  sharedData: {
    useBackend: boolean
    description: string
    useCase: string[]
  }
  offlineSync?: {
    strategy: string
    description: string
  }
  apiPattern?: {
    description: string
    codeExample: string
  }
}

export interface StorageDataConfig {
  dataType: StorageDataType
  isShared: boolean
  needsOfflineAccess: boolean
  dataSize: DataSize
  requiresServerProcessing?: boolean
  isSensitive?: boolean
}

export interface StorageRecommendation {
  storage: 'AsyncStorage' | 'SecureStore' | 'Backend' | 'AsyncStorage+Sync' | 'FileSystem'
  reason: string
  package?: string
  syncStrategy?: string
  codeExample?: string
}

/**
 * Cross-platform request keywords
 */
const CROSS_PLATFORM_KEYWORDS = [
  'cross-platform',
  'cross platform',
  'web and mobile',
  'mobile and web',
  'both platforms',
  'add mobile to',
  'add web to',
  'both ios and web',
  'ios and web',
  'both android and web',
  'android and web',
  'monorepo',
  'shared code',
]

/**
 * Detect project type from context
 */
export function detectProjectType(context: ProjectContext): ProjectType {
  // Handle undefined/null context
  if (!context) {
    return 'mobile-only'
  }

  // Web-only detection
  if (context.platform === 'web' && !context.hasLinkedWebProject && !context.isMonorepo) {
    return 'web-only'
  }

  // Explicit cross-platform indicators
  if (context.hasLinkedWebProject || context.isMonorepo) {
    return 'cross-platform'
  }

  // Check user request for cross-platform keywords
  if (context.userRequest) {
    const lowerRequest = context.userRequest.toLowerCase()
    const hasCrossPlatformKeyword = CROSS_PLATFORM_KEYWORDS.some(keyword =>
      lowerRequest.includes(keyword)
    )
    if (hasCrossPlatformKeyword) {
      return 'cross-platform'
    }
  }

  // Default based on platform
  if (context.platform === 'mobile') {
    return 'mobile-only'
  }

  return 'mobile-only'
}

/**
 * Get authentication strategy based on project type
 */
export function getAuthStrategy(projectType: ProjectType): AuthStrategy {
  const strategies: Record<ProjectType, AuthStrategy> = {
    'mobile-only': {
      recommendation: 'For mobile-only projects, use Expo-native authentication packages that provide seamless OAuth flows and secure token storage.',
      oauth: {
        package: 'expo-auth-session',
        description: 'OAuth authentication for mobile apps - handles browser-based auth flows, works with Google, Apple, Facebook, and custom OAuth providers.',
      },
      tokenStorage: {
        package: 'expo-secure-store',
        secure: true,
        description: 'Securely stores authentication tokens in the device keychain (iOS) or Keystore (Android).',
      },
      sharedApiClient: false,
      codeExample: `import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

// OAuth configuration
const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

const [request, response, promptAsync] = AuthSession.useAuthRequest({
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: AuthSession.makeRedirectUri({ scheme: 'myapp' }),
  scopes: ['openid', 'profile', 'email'],
}, discovery);

// Handle auth response
useEffect(() => {
  if (response?.type === 'success') {
    const { code } = response.params;
    // Exchange code for tokens
    exchangeCodeForTokens(code).then(async (tokens) => {
      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', tokens.access_token);
      await SecureStore.setItemAsync('refreshToken', tokens.refresh_token);
    });
  }
}, [response]);

// Retrieve stored token
async function getStoredToken() {
  return await SecureStore.getItemAsync('accessToken');
}`,
      appJsonConfig: `{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.myapp"
    },
    "android": {
      "package": "com.yourcompany.myapp"
    }
  }
}`,
    },

    'cross-platform': {
      recommendation: 'For cross-platform projects, reuse your web authentication infrastructure and share API clients between platforms. Store tokens securely on each platform.',
      oauth: {
        package: 'expo-auth-session',
        description: 'Use shared OAuth configuration with your web app. Same OAuth provider, same client (or platform-specific client IDs).',
      },
      tokenStorage: {
        package: 'expo-secure-store',
        secure: true,
        description: 'Store tokens in expo-secure-store on mobile, and httpOnly cookies or secure storage on web.',
      },
      sessionSharing: {
        strategy: 'shared-backend',
        description: 'Share session through backend API. Mobile app sends same JWT/session token as web app to authenticate API requests.',
      },
      sharedApiClient: true,
      codeExample: `// packages/shared/api/auth.ts - Shared authentication logic
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return response.json();
}

// apps/mobile/lib/auth.ts - Mobile-specific token storage
import * as SecureStore from 'expo-secure-store';
import { AuthTokens, refreshAccessToken } from '@shared/api/auth';

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync('accessToken', tokens.accessToken);
  await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
  await SecureStore.setItemAsync('expiresAt', String(tokens.expiresAt));
}

export async function getAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync('accessToken');
  const expiresAt = await SecureStore.getItemAsync('expiresAt');

  if (!token || !expiresAt) return null;

  // Check expiration and refresh if needed
  if (Date.now() > parseInt(expiresAt)) {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      const newTokens = await refreshAccessToken(refreshToken);
      await storeTokens(newTokens);
      return newTokens.accessToken;
    }
    return null;
  }

  return token;
}`,
      appJsonConfig: `{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.myapp",
      "associatedDomains": ["webcredentials:yourapp.com"]
    },
    "android": {
      "package": "com.yourcompany.myapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": { "host": "yourapp.com" },
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}`,
    },

    'web-only': {
      recommendation: 'For web-only projects, use NextAuth.js or similar web authentication libraries. Store tokens in httpOnly cookies for security.',
      oauth: {
        package: 'next-auth',
        description: 'NextAuth.js provides complete authentication solution for Next.js with built-in OAuth providers.',
      },
      tokenStorage: {
        package: 'cookies',
        secure: true,
        description: 'Use httpOnly secure cookies for session management. NextAuth handles this automatically.',
      },
      sharedApiClient: false,
      codeExample: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };`,
    },
  }

  return strategies[projectType]
}

/**
 * Get storage strategy based on project type
 */
export function getStorageStrategy(projectType: ProjectType): StorageStrategy {
  const strategies: Record<ProjectType, StorageStrategy> = {
    'mobile-only': {
      recommendation: 'For mobile-only apps, use AsyncStorage for local data and preferences, and backend APIs for shared or persistent data that needs to survive app reinstalls.',
      localData: {
        package: '@react-native-async-storage/async-storage',
        description: 'Key-value storage for local data like user preferences, cached data, and app state.',
        useCase: [
          'User preferences (theme, language, notifications)',
          'Cached API responses',
          'Draft content before submission',
          'Onboarding completion status',
          'Feature flags',
        ],
      },
      sharedData: {
        useBackend: true,
        description: 'Use backend API with database for data that needs to be shared across devices or persisted beyond app lifecycle.',
        useCase: [
          'User profile data',
          'User-generated content',
          'Purchase history',
          'Synced settings across devices',
        ],
      },
      offlineSync: {
        strategy: 'optimistic-sync',
        description: 'Store changes locally with AsyncStorage, sync to backend when connection available. Use queue for pending changes.',
      },
    },

    'cross-platform': {
      recommendation: 'For cross-platform apps, use backend API for all shared data to ensure consistency across web and mobile. Use AsyncStorage only for mobile-specific local caching.',
      localData: {
        package: '@react-native-async-storage/async-storage',
        description: 'Use only for mobile-specific caching and offline support. Core data should come from shared backend.',
        useCase: [
          'API response cache',
          'Offline queue for pending operations',
          'Mobile-specific preferences',
        ],
      },
      sharedData: {
        useBackend: true,
        description: 'All user data flows through shared backend API. Same endpoints used by web and mobile apps.',
        useCase: [
          'All user data',
          'All user-generated content',
          'Cross-platform settings',
          'Shared state',
        ],
      },
      apiPattern: {
        description: 'Shared API client in monorepo packages/shared folder, used by both web and mobile apps.',
        codeExample: `// packages/shared/api/client.ts
export class ApiClient {
  constructor(private baseUrl: string, private getToken: () => Promise<string | null>) {}

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: \`Bearer \${token}\` }),
        ...options?.headers,
      },
    });
    if (!response.ok) throw new Error(\`API error: \${response.status}\`);
    return response.json();
  }
}

// apps/mobile/lib/api.ts
import { ApiClient } from '@shared/api/client';
import { getAccessToken } from './auth';

export const api = new ApiClient(
  process.env.EXPO_PUBLIC_API_URL!,
  getAccessToken
);`,
      },
    },

    'web-only': {
      recommendation: 'For web-only apps, use server-side storage and browser APIs. Database for persistence, cookies for sessions.',
      localData: {
        package: 'localStorage',
        description: 'Use localStorage for client-side preferences, sessionStorage for temporary data.',
        useCase: [
          'UI preferences',
          'Form drafts',
          'Feature flags',
        ],
      },
      sharedData: {
        useBackend: true,
        description: 'All persistent data stored in database, accessed via API routes.',
        useCase: [
          'User data',
          'Application data',
        ],
      },
    },
  }

  return strategies[projectType]
}

/**
 * Get storage recommendation based on data characteristics
 */
export function getStorageRecommendation(config: StorageDataConfig): StorageRecommendation {
  const { dataType, isShared, needsOfflineAccess, dataSize, requiresServerProcessing, isSensitive } = config

  // Sensitive data always goes to SecureStore
  if (isSensitive) {
    return {
      storage: 'SecureStore',
      reason: 'Sensitive data like credentials and tokens should be stored securely using expo-secure-store.',
      package: 'expo-secure-store',
      codeExample: `import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('secretKey', 'secretValue');
const value = await SecureStore.getItemAsync('secretKey');`,
    }
  }

  // Server-processed data goes to Backend (check BEFORE large file check)
  if (requiresServerProcessing) {
    return {
      storage: 'Backend',
      reason: 'Data requiring server processing should be stored on the backend because it needs server-side computation.',
    }
  }

  // Large files go to FileSystem
  if (dataSize === 'large' && !isShared) {
    return {
      storage: 'FileSystem',
      reason: 'Large files like media should be stored using expo-file-system for better performance.',
      package: 'expo-file-system',
      codeExample: `import * as FileSystem from 'expo-file-system';

const fileUri = FileSystem.documentDirectory + 'data.json';
await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data));`,
    }
  }


  // Shared data with offline access needs sync strategy
  if (isShared && needsOfflineAccess) {
    return {
      storage: 'AsyncStorage+Sync',
      reason: 'Shared data with offline access requires local storage with sync to backend when online.',
      package: '@react-native-async-storage/async-storage',
      syncStrategy: 'optimistic-update',
      codeExample: `import AsyncStorage from '@react-native-async-storage/async-storage';

// Save locally first
await AsyncStorage.setItem('key', JSON.stringify(data));

// Queue for sync
await AsyncStorage.setItem('syncQueue', JSON.stringify([...queue, { key, data }]));

// Sync when online
async function syncToBackend() {
  const queue = JSON.parse(await AsyncStorage.getItem('syncQueue') || '[]');
  for (const item of queue) {
    await api.post('/sync', item);
  }
  await AsyncStorage.removeItem('syncQueue');
}`,
    }
  }

  // Shared data without offline -> Backend only
  if (isShared) {
    return {
      storage: 'Backend',
      reason: 'Shared data that must be accessible across devices should be stored on the backend.',
    }
  }

  // Local-only data
  return {
    storage: 'AsyncStorage',
    reason: 'Local data like user preferences and cache should use AsyncStorage for simple key-value storage.',
    package: '@react-native-async-storage/async-storage',
    codeExample: `import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('preferences', JSON.stringify(prefs));
const prefs = JSON.parse(await AsyncStorage.getItem('preferences') || '{}');`,
  }
}

/**
 * Build AI prompt with strategy recommendations
 */
export function buildStrategyPrompt(projectType: ProjectType, strategyType: 'auth' | 'storage'): string {
  if (strategyType === 'auth') {
    const strategy = getAuthStrategy(projectType)

    let prompt = `## Authentication Strategy for ${projectType} Project\n\n`
    prompt += `${strategy.recommendation}\n\n`
    prompt += `### Recommended Packages\n\n`
    prompt += `**OAuth:** ${strategy.oauth.package}\n`
    prompt += `${strategy.oauth.description}\n\n`
    prompt += `**Token Storage:** ${strategy.tokenStorage.package}\n`
    prompt += `${strategy.tokenStorage.description}\n\n`

    if (strategy.sessionSharing) {
      prompt += `### Session Sharing Strategy\n\n`
      prompt += `${strategy.sessionSharing.description}\n\n`
    }

    prompt += `### Code Example\n\n`
    prompt += '```typescript\n'
    prompt += strategy.codeExample
    prompt += '\n```\n\n'

    if (strategy.appJsonConfig) {
      prompt += `### Required app.json Configuration\n\n`
      prompt += '```json\n'
      prompt += strategy.appJsonConfig
      prompt += '\n```\n'
    }

    return prompt
  }

  // Storage strategy
  const strategy = getStorageStrategy(projectType)

  let prompt = `## Storage Strategy for ${projectType} Project\n\n`
  prompt += `${strategy.recommendation}\n\n`
  prompt += `### Local Data Storage\n\n`
  prompt += `**Package:** ${strategy.localData.package}\n`
  prompt += `${strategy.localData.description}\n\n`
  prompt += `**Use Cases:**\n`
  strategy.localData.useCase.forEach(use => {
    prompt += `- ${use}\n`
  })
  prompt += `\n`

  prompt += `### Shared/Persistent Data\n\n`
  prompt += `${strategy.sharedData.description}\n\n`
  prompt += `I recommend using backend API because shared data needs to be accessible across devices and survive app reinstalls.\n\n`
  prompt += `**Use Cases:**\n`
  strategy.sharedData.useCase.forEach(use => {
    prompt += `- ${use}\n`
  })

  if (strategy.offlineSync) {
    prompt += `\n### Offline Sync Strategy\n\n`
    prompt += `${strategy.offlineSync.description}\n`
  }

  if (strategy.apiPattern) {
    prompt += `\n### API Pattern\n\n`
    prompt += `${strategy.apiPattern.description}\n\n`
    prompt += '```typescript\n'
    prompt += strategy.apiPattern.codeExample
    prompt += '\n```\n'
  }

  return prompt
}

/**
 * Get complete strategy for project
 */
export function getCompleteStrategy(context: ProjectContext): {
  projectType: ProjectType
  auth: AuthStrategy
  storage: StorageStrategy
  prompt: string
} {
  const projectType = detectProjectType(context)
  const auth = getAuthStrategy(projectType)
  const storage = getStorageStrategy(projectType)

  const prompt = `${buildStrategyPrompt(projectType, 'auth')}\n\n${buildStrategyPrompt(projectType, 'storage')}`

  return {
    projectType,
    auth,
    storage,
    prompt,
  }
}
