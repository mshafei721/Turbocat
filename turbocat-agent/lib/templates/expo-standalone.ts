/**
 * Standalone Expo Project Template
 * Phase 4: Mobile Development - Task 6.1
 *
 * Creates a standalone Expo project structure with:
 * - Expo Router for file-based navigation
 * - TypeScript configuration
 * - NativeWind (Tailwind for React Native)
 * - Proper folder structure
 */

export interface ExpoProjectConfig {
  name: string
  slug?: string
  version?: string
  description?: string
  primaryColor?: string
}

export interface ProjectFile {
  path: string
  content: string
}

/**
 * Generate app.json for Expo project
 */
export function generateAppJson(config: ExpoProjectConfig): string {
  const { name, slug = name.toLowerCase().replace(/\s+/g, '-'), version = '1.0.0', primaryColor = '#3B82F6' } = config

  return JSON.stringify(
    {
      expo: {
        name,
        slug,
        version,
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
        web: {
          favicon: './assets/favicon.png',
          bundler: 'metro',
        },
        plugins: ['expo-router'],
        experiments: {
          typedRoutes: true,
        },
        scheme: slug,
        extra: {
          primaryColor,
        },
      },
    },
    null,
    2
  )
}

/**
 * Generate package.json for Expo project
 */
export function generatePackageJson(config: ExpoProjectConfig): string {
  const { name, version = '1.0.0', description = 'A React Native Expo app' } = config

  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version,
      description,
      main: 'expo-router/entry',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
        lint: 'eslint . --ext .ts,.tsx',
        'lint:fix': 'eslint . --ext .ts,.tsx --fix',
        typecheck: 'tsc --noEmit',
        test: 'jest',
      },
      dependencies: {
        expo: '~52.0.0',
        'expo-constants': '~17.0.0',
        'expo-font': '~13.0.0',
        'expo-linking': '~7.0.0',
        'expo-router': '~4.0.0',
        'expo-splash-screen': '~0.29.0',
        'expo-status-bar': '~2.0.0',
        'expo-system-ui': '~4.0.0',
        'expo-web-browser': '~14.0.0',
        nativewind: '^4.0.0',
        react: '18.3.1',
        'react-dom': '18.3.1',
        'react-native': '0.76.0',
        'react-native-gesture-handler': '~2.20.0',
        'react-native-reanimated': '~3.16.0',
        'react-native-safe-area-context': '4.12.0',
        'react-native-screens': '~4.0.0',
        'react-native-web': '~0.19.13',
        zustand: '^5.0.0',
        '@react-native-async-storage/async-storage': '2.0.0',
      },
      devDependencies: {
        '@babel/core': '^7.25.0',
        '@types/react': '~18.3.0',
        '@types/react-native': '~0.73.0',
        '@typescript-eslint/eslint-plugin': '^8.0.0',
        '@typescript-eslint/parser': '^8.0.0',
        eslint: '^8.57.0',
        'eslint-config-expo': '~8.0.0',
        jest: '^29.7.0',
        'jest-expo': '~52.0.0',
        tailwindcss: '^3.4.0',
        typescript: '~5.6.0',
      },
      private: true,
    },
    null,
    2
  )
}

/**
 * Generate tsconfig.json for Expo project
 */
export function generateTsConfig(): string {
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
 * Generate tailwind.config.js for NativeWind
 */
export function generateTailwindConfig(): string {
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
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
};
`
}

/**
 * Generate babel.config.js for NativeWind
 */
export function generateBabelConfig(): string {
  return `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
`
}

/**
 * Generate metro.config.js for NativeWind
 */
export function generateMetroConfig(): string {
  return `const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
`
}

/**
 * Generate global.css for NativeWind
 */
export function generateGlobalCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
`
}

/**
 * Generate nativewind-env.d.ts type declaration
 */
export function generateNativewindEnvDts(): string {
  return `/// <reference types="nativewind/types" />
`
}

/**
 * Generate app/_layout.tsx (root layout with tabs)
 */
export function generateRootLayout(): string {
  return `import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
`
}

/**
 * Generate app/(tabs)/_layout.tsx (tab layout)
 */
export function generateTabsLayout(): string {
  return `import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
`
}

/**
 * Generate app/(tabs)/index.tsx (home screen)
 */
export function generateHomeScreen(config: ExpoProjectConfig): string {
  return `import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome to ${config.name}
          </Text>
          <Text className="mt-2 text-base text-gray-600">
            Your app is ready for development!
          </Text>

          <View className="mt-6 rounded-lg bg-primary-50 p-4">
            <Text className="font-semibold text-primary-900">
              Getting Started
            </Text>
            <Text className="mt-2 text-sm text-primary-700">
              Edit app/(tabs)/index.tsx to start building your app.
            </Text>
          </View>

          <View className="mt-4 rounded-lg bg-secondary-50 p-4">
            <Text className="font-semibold text-secondary-900">
              Features Included
            </Text>
            <View className="mt-2">
              <Text className="text-sm text-secondary-700">
                - Expo Router (file-based navigation)
              </Text>
              <Text className="text-sm text-secondary-700">
                - NativeWind (Tailwind for React Native)
              </Text>
              <Text className="text-sm text-secondary-700">
                - TypeScript support
              </Text>
              <Text className="text-sm text-secondary-700">
                - Zustand state management
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`
}

/**
 * Generate app/(tabs)/settings.tsx (settings screen)
 */
export function generateSettingsScreen(): string {
  return `import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function SettingItem({ icon, title, subtitle, onPress }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500">{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
            Account
          </Text>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="Manage your profile"
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Configure notifications"
          />
        </View>

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
            Preferences
          </Text>
          <SettingItem
            icon="moon"
            title="Appearance"
            subtitle="Dark mode, theme"
          />
          <SettingItem
            icon="language"
            title="Language"
            subtitle="English"
          />
        </View>

        <View className="mt-4">
          <Text className="px-4 py-2 text-xs font-semibold uppercase text-gray-500">
            About
          </Text>
          <SettingItem
            icon="information-circle"
            title="About"
            subtitle="Version 1.0.0"
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
`
}

/**
 * Generate app/+not-found.tsx (404 screen)
 */
export function generateNotFoundScreen(): string {
  return `import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-4 bg-white">
        <Text className="text-2xl font-bold text-gray-900">
          Page Not Found
        </Text>
        <Text className="mt-2 text-center text-gray-600">
          The page you're looking for doesn't exist.
        </Text>
        <Link href="/" className="mt-6">
          <Text className="text-primary-600 font-semibold">
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}
`
}

/**
 * Generate components/ui/Button.tsx
 */
export function generateButtonComponent(): string {
  return `import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { forwardRef } from 'react';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variants = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  outline: 'border-2 border-primary-500 active:bg-primary-50',
  ghost: 'active:bg-gray-100',
};

const textVariants = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-500',
  ghost: 'text-gray-900',
};

const sizes = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2.5',
  lg: 'px-6 py-3.5',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      icon,
      className = '',
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={isDisabled}
        className={\`flex-row items-center justify-center rounded-lg \${variants[variant]} \${sizes[size]} \${isDisabled ? 'opacity-50' : ''} \${className}\`}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? '#fff' : '#3b82f6'}
          />
        ) : (
          <>
            {icon && <View className="mr-2">{icon}</View>}
            <Text
              className={\`font-semibold \${textVariants[variant]} \${textSizes[size]}\`}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
`
}

/**
 * Generate lib/utils.ts
 */
export function generateUtilsFile(): string {
  return `import { Platform } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Platform.OS as 'ios' | 'android' | 'web';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Platform-specific value selection
 */
export function platformSelect<T>(options: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T {
  const platform = Platform.OS;
  return options[platform as keyof typeof options] ?? options.default;
}
`
}

/**
 * Generate constants/Colors.ts
 */
export function generateColorsFile(): string {
  return `/**
 * App color palette
 * Matches the NativeWind/Tailwind configuration
 */

export const Colors = {
  light: {
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#8b5cf6',
    secondaryForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    muted: '#f3f4f6',
    mutedForeground: '#6b7280',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#3b82f6',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
  },
  dark: {
    primary: '#60a5fa',
    primaryForeground: '#111827',
    secondary: '#a78bfa',
    secondaryForeground: '#111827',
    background: '#111827',
    foreground: '#f9fafb',
    card: '#1f2937',
    cardForeground: '#f9fafb',
    muted: '#374151',
    mutedForeground: '#9ca3af',
    border: '#374151',
    input: '#374151',
    ring: '#60a5fa',
    destructive: '#f87171',
    destructiveForeground: '#111827',
  },
};

export type ColorScheme = keyof typeof Colors;
`
}

/**
 * Generate .gitignore
 */
export function generateGitignore(): string {
  return `# Expo
node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/

# macOS
.DS_Store
*.pem

# Local env files
.env*.local

# TypeScript
*.tsbuildinfo

# Testing
coverage/

# IDE
.vscode/
.idea/

# Temporary files
*.log
*.tmp
`
}

/**
 * Generate .eslintrc.js
 */
export function generateEslintConfig(): string {
  return `module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
`
}

/**
 * Generate README.md
 */
export function generateReadme(config: ExpoProjectConfig): string {
  return `# ${config.name}

${config.description || 'A React Native Expo app built with Turbocat'}

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm
- Expo Go app on your mobile device (for testing)

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

Start the development server:

\`\`\`bash
npm start
\`\`\`

Then, scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Platform-Specific Commands

\`\`\`bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
\`\`\`

## Project Structure

\`\`\`
${config.name.toLowerCase().replace(/\s+/g, '-')}/
  app/                    # Expo Router screens
    (tabs)/              # Tab-based navigation
      index.tsx          # Home screen
      settings.tsx       # Settings screen
      _layout.tsx        # Tab layout
    _layout.tsx          # Root layout
    +not-found.tsx       # 404 screen
  components/
    ui/                  # Reusable UI components
      Button.tsx
  lib/
    utils.ts             # Utility functions
  assets/                # Images, fonts, etc.
  constants/
    Colors.ts            # Color palette
  app.json               # Expo configuration
  package.json
  tsconfig.json
  tailwind.config.js     # NativeWind configuration
  babel.config.js
  metro.config.js
\`\`\`

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Language**: TypeScript

## Scripts

- \`npm start\` - Start development server
- \`npm run android\` - Run on Android
- \`npm run ios\` - Run on iOS
- \`npm run web\` - Run on web
- \`npm run lint\` - Run ESLint
- \`npm run typecheck\` - Run TypeScript check
- \`npm test\` - Run tests

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Expo Router Documentation](https://expo.github.io/router/docs/)
`
}

/**
 * Generate all files for a standalone Expo project
 */
export function generateExpoProject(config: ExpoProjectConfig): ProjectFile[] {
  const files: ProjectFile[] = [
    // Configuration files
    { path: 'app.json', content: generateAppJson(config) },
    { path: 'package.json', content: generatePackageJson(config) },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: 'tailwind.config.js', content: generateTailwindConfig() },
    { path: 'babel.config.js', content: generateBabelConfig() },
    { path: 'metro.config.js', content: generateMetroConfig() },
    { path: 'global.css', content: generateGlobalCss() },
    { path: 'nativewind-env.d.ts', content: generateNativewindEnvDts() },
    { path: '.gitignore', content: generateGitignore() },
    { path: '.eslintrc.js', content: generateEslintConfig() },
    { path: 'README.md', content: generateReadme(config) },

    // App screens (Expo Router)
    { path: 'app/_layout.tsx', content: generateRootLayout() },
    { path: 'app/(tabs)/_layout.tsx', content: generateTabsLayout() },
    { path: 'app/(tabs)/index.tsx', content: generateHomeScreen(config) },
    { path: 'app/(tabs)/settings.tsx', content: generateSettingsScreen() },
    { path: 'app/+not-found.tsx', content: generateNotFoundScreen() },

    // Components
    { path: 'components/ui/Button.tsx', content: generateButtonComponent() },

    // Lib
    { path: 'lib/utils.ts', content: generateUtilsFile() },

    // Constants
    { path: 'constants/Colors.ts', content: generateColorsFile() },

    // Assets placeholders (empty files - actual assets would be binary)
    { path: 'assets/.gitkeep', content: '# Placeholder for assets directory\n' },
  ]

  return files
}

/**
 * Get list of all file paths in the project template
 */
export function getExpoProjectFilePaths(): string[] {
  return [
    'app.json',
    'package.json',
    'tsconfig.json',
    'tailwind.config.js',
    'babel.config.js',
    'metro.config.js',
    'global.css',
    'nativewind-env.d.ts',
    '.gitignore',
    '.eslintrc.js',
    'README.md',
    'app/_layout.tsx',
    'app/(tabs)/_layout.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/settings.tsx',
    'app/+not-found.tsx',
    'components/ui/Button.tsx',
    'lib/utils.ts',
    'constants/Colors.ts',
    'assets/.gitkeep',
  ]
}

/**
 * Template metadata for documentation
 */
export const expoStandaloneTemplateMetadata = {
  name: 'Standalone Expo Project',
  description: 'A complete Expo project template with Expo Router, NativeWind, and TypeScript',
  version: '1.0.0',
  framework: 'React Native with Expo',
  styling: 'NativeWind (Tailwind CSS)',
  navigation: 'Expo Router (file-based)',
  stateManagement: 'Zustand',
  features: [
    'Expo Router file-based navigation',
    'NativeWind (Tailwind for React Native)',
    'TypeScript configuration',
    'Tab-based navigation layout',
    'Reusable UI components',
    'Light/dark mode support',
    'ESLint configuration',
    'Ready for Expo Go development',
  ],
}
