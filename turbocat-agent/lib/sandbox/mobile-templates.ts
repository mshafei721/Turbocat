/**
 * React Native / Expo Code Generation Templates
 * Phase 4: Mobile Development - Task 4.2
 *
 * This module provides code templates for common React Native/Expo patterns
 * to guide AI code generation and provide quick scaffolding.
 */

export interface TemplateContext {
  name: string
  [key: string]: string | boolean | number
}

/**
 * Template: Basic Screen with NativeWind styling
 */
export function basicScreenTemplate(context: { screenName: string }): string {
  const { screenName } = context

  return `import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ${screenName}() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-900">
          ${screenName}
        </Text>
        <Text className="mt-2 text-base text-gray-600">
          Your screen content goes here
        </Text>
      </View>
    </SafeAreaView>
  );
}
`
}

/**
 * Template: Functional Component with Hooks
 */
export function functionalComponentTemplate(context: { componentName: string }): string {
  const { componentName } = context

  return `import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface ${componentName}Props {
  title?: string;
  onPress?: () => void;
}

export function ${componentName}({ title, onPress }: ${componentName}Props) {
  const [count, setCount] = useState(0);

  const handlePress = () => {
    setCount(prev => prev + 1);
    onPress?.();
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-semibold">{title}</Text>
      <Pressable
        onPress={handlePress}
        className="mt-2 bg-blue-500 px-4 py-2 rounded-lg active:bg-blue-600"
      >
        <Text className="text-white text-center">
          Pressed {count} times
        </Text>
      </Pressable>
    </View>
  );
}
`
}

/**
 * Template: Expo Router Layout (file-based navigation)
 */
export function expoRouterLayoutTemplate(): string {
  return `import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: 'Details',
        }}
      />
    </Stack>
  );
}
`
}

/**
 * Template: React Navigation Stack Navigator
 */
export function stackNavigatorTemplate(): string {
  return `import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { itemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`
}

/**
 * Template: React Navigation Tab Navigator
 */
export function tabNavigatorTemplate(): string {
  return `import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';

export type TabParamList = {
  Home: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
`
}

/**
 * Template: Zustand State Management Store
 */
export function zustandStoreTemplate(context: { storeName: string }): string {
  const { storeName } = context

  return `import { create } from 'zustand';

interface ${storeName}State {
  count: number;
  items: string[];
  isLoading: boolean;
  increment: () => void;
  decrement: () => void;
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
  setLoading: (loading: boolean) => void;
}

export const use${storeName} = create<${storeName}State>((set) => ({
  count: 0,
  items: [],
  isLoading: false,

  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));

// Usage in a component:
// const { count, increment } = use${storeName}();
`
}

/**
 * Template: AsyncStorage Persistence
 */
export function asyncStorageTemplate(): string {
  return `import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

// Load data
export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

// Remove data
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

// Usage:
// await saveData('user', { name: 'John', email: 'john@example.com' });
// const user = await loadData<{ name: string; email: string }>('user');
`
}

/**
 * Template: API Client with Fetch
 */
export function apiClientTemplate(context: { baseUrl: string }): string {
  const { baseUrl } = context

  return `const API_BASE_URL = '${baseUrl}';

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw {
        message: await response.text(),
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Usage:
// const users = await apiClient.get<User[]>('/users');
// const user = await apiClient.post<User>('/users', { name: 'John' });
`
}

/**
 * Get template by name with optional context
 */
export function getTemplate(templateName: string, context: TemplateContext = { name: '' }): string {
  const templates: Record<string, (ctx: any) => string> = {
    'basic-screen': basicScreenTemplate,
    'functional-component': functionalComponentTemplate,
    'expo-router-layout': expoRouterLayoutTemplate,
    'stack-navigator': stackNavigatorTemplate,
    'tab-navigator': tabNavigatorTemplate,
    'zustand-store': zustandStoreTemplate,
    'async-storage': asyncStorageTemplate,
    'api-client': apiClientTemplate,
  }

  const templateFn = templates[templateName]
  if (!templateFn) {
    throw new Error(`Template "${templateName}" not found`)
  }

  return templateFn(context)
}

/**
 * Get all available template names
 */
export function getAvailableTemplates(): string[] {
  return [
    'basic-screen',
    'functional-component',
    'expo-router-layout',
    'stack-navigator',
    'tab-navigator',
    'zustand-store',
    'async-storage',
    'api-client',
  ]
}

/**
 * Template metadata for documentation
 */
export interface TemplateMetadata {
  name: string
  description: string
  category: 'screen' | 'component' | 'navigation' | 'state' | 'storage' | 'api'
  requiredPackages: string[]
  requiredContext: string[]
}

export const templateMetadata: Record<string, TemplateMetadata> = {
  'basic-screen': {
    name: 'Basic Screen',
    description: 'A basic screen component with NativeWind styling and SafeAreaView',
    category: 'screen',
    requiredPackages: ['react-native', 'react-native-safe-area-context', 'nativewind'],
    requiredContext: ['screenName'],
  },
  'functional-component': {
    name: 'Functional Component',
    description: 'A functional component with hooks and TypeScript props',
    category: 'component',
    requiredPackages: ['react', 'react-native', 'nativewind'],
    requiredContext: ['componentName'],
  },
  'expo-router-layout': {
    name: 'Expo Router Layout',
    description: 'An Expo Router layout with Stack navigation',
    category: 'navigation',
    requiredPackages: ['expo-router'],
    requiredContext: [],
  },
  'stack-navigator': {
    name: 'Stack Navigator',
    description: 'React Navigation stack navigator with TypeScript types',
    category: 'navigation',
    requiredPackages: ['@react-navigation/native', '@react-navigation/native-stack'],
    requiredContext: [],
  },
  'tab-navigator': {
    name: 'Tab Navigator',
    description: 'React Navigation bottom tab navigator with icons',
    category: 'navigation',
    requiredPackages: ['@react-navigation/native', '@react-navigation/bottom-tabs', '@expo/vector-icons'],
    requiredContext: [],
  },
  'zustand-store': {
    name: 'Zustand Store',
    description: 'A Zustand state management store with TypeScript',
    category: 'state',
    requiredPackages: ['zustand'],
    requiredContext: ['storeName'],
  },
  'async-storage': {
    name: 'AsyncStorage Utilities',
    description: 'Helper functions for AsyncStorage with TypeScript',
    category: 'storage',
    requiredPackages: ['@react-native-async-storage/async-storage'],
    requiredContext: [],
  },
  'api-client': {
    name: 'API Client',
    description: 'A typed API client with fetch and authentication',
    category: 'api',
    requiredPackages: [],
    requiredContext: ['baseUrl'],
  },
}
