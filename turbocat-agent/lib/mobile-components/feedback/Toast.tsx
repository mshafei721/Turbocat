/**
 * Toast/Snackbar Component - Temporary Notification
 * Phase 4: Mobile Development - Task 5.6
 *
 * A temporary notification component for displaying brief messages.
 * Auto-dismisses after a timeout with support for actions.
 *
 * @example
 * ```tsx
 * import { useToast, ToastProvider } from '@/components/mobile/feedback/Toast';
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <MainContent />
 *     </ToastProvider>
 *   );
 * }
 *
 * function MainContent() {
 *   const { showToast } = useToast();
 *
 *   const handleSave = async () => {
 *     await saveData();
 *     showToast({
 *       message: 'Changes saved successfully',
 *       variant: 'success',
 *     });
 *   };
 *
 *   return <Button onPress={handleSave}>Save</Button>;
 * }
 * ```
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cn } from '../utils'

/**
 * Toast variant
 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

/**
 * Toast position
 */
export type ToastPosition = 'top' | 'bottom'

/**
 * Toast data
 */
export interface ToastData {
  /** Unique ID */
  id: string
  /** Toast message */
  message: string
  /** Toast variant */
  variant?: ToastVariant
  /** Duration in ms (0 = no auto-dismiss) */
  duration?: number
  /** Action button text */
  action?: string
  /** Action callback */
  onAction?: () => void
}

/**
 * Toast context
 */
interface ToastContextValue {
  toasts: ToastData[]
  showToast: (options: Omit<ToastData, 'id'>) => void
  hideToast: (id: string) => void
  hideAllToasts: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Toast provider props
 */
export interface ToastProviderProps {
  /** App content */
  children: React.ReactNode
  /** Toast position (default: 'bottom') */
  position?: ToastPosition
  /** Maximum visible toasts */
  maxToasts?: number
}

/**
 * Toast component props
 */
export interface ToastProps {
  /** Toast data */
  toast: ToastData
  /** Dismiss handler */
  onDismiss: () => void
  /** Additional NativeWind classes */
  className?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-foreground text-background',
  success: 'bg-green-600 text-white',
  error: 'bg-destructive text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
}

/**
 * Variant icon mapping
 */
const variantIcons: Record<ToastVariant, string> = {
  default: '',
  success: 'check',
  error: 'x',
  warning: '!',
  info: 'i',
}

/**
 * Toast Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ToastTemplate = `import { View, Text, Pressable, Animated } from 'react-native';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

// Types and context...

export function ToastProvider({
  children,
  position = 'bottom',
  maxToasts = 3,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((options: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      duration: 3000,
      variant: 'default',
      ...options,
    };

    setToasts((current) => {
      const updated = [...current, newToast];
      return updated.slice(-maxToasts);
    });

    // Auto dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, hideAllToasts }}>
      {children}
      {/* Toast Container */}
      <View
        className={cn(
          'absolute left-4 right-4',
          position === 'top' ? 'top-0' : 'bottom-0',
        )}
        style={{
          paddingTop: position === 'top' ? insets.top + 8 : 0,
          paddingBottom: position === 'bottom' ? insets.bottom + 8 : 0,
        }}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={() => hideToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Individual Toast component
function Toast({ toast, onDismiss, className }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Animate in
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const icon = variantIcons[toast.variant || 'default'];

  return (
    <Animated.View
      className={cn(
        'flex-row items-center rounded-lg px-4 py-3 mb-2 shadow-lg',
        variantClasses[toast.variant || 'default'],
        className,
      )}
      style={{ transform: [{ translateY }], opacity }}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Icon */}
      {icon && (
        <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center mr-3">
          <Text className="text-xs font-bold">{icon}</Text>
        </View>
      )}

      {/* Message */}
      <Text className="flex-1 font-medium" numberOfLines={2}>
        {toast.message}
      </Text>

      {/* Action Button */}
      {toast.action && (
        <Pressable
          onPress={() => {
            toast.onAction?.();
            onDismiss();
          }}
          className="ml-3"
        >
          <Text className="font-semibold underline">
            {toast.action}
          </Text>
        </Pressable>
      )}

      {/* Dismiss Button */}
      <Pressable
        onPress={onDismiss}
        className="ml-2 p-1"
        accessibilityLabel="Dismiss"
      >
        <Text className="text-lg opacity-70">x</Text>
      </Pressable>
    </Animated.View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
`

/**
 * Toast Provider for React Native Web preview
 */
export function ToastProvider({ children, position = 'bottom', maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback(
    (options: Omit<ToastData, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: ToastData = {
        id,
        duration: 3000,
        variant: 'default',
        ...options,
      }

      setToasts((current) => {
        const updated = [...current, newToast]
        return updated.slice(-maxToasts)
      })
    },
    [maxToasts],
  )

  const hideToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const hideAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Auto-dismiss effect
  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          hideToast(toast.id)
        }, toast.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [toasts, hideToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, hideAllToasts }}>
      {children}
      {/* Toast Container */}
      <div
        className={cn(
          'fixed left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none',
          position === 'top' ? 'top-4' : 'bottom-4',
        )}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Individual Toast component for React Native Web preview
 */
export function Toast({ toast, onDismiss, className }: ToastProps) {
  const icon = variantIcons[toast.variant || 'default']

  return (
    <div
      className={cn(
        'flex flex-row items-center rounded-lg px-4 py-3 shadow-lg pointer-events-auto animate-in slide-in-from-bottom-2',
        variantClasses[toast.variant || 'default'],
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      {icon && (
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-3">
          <span className="text-xs font-bold">{icon}</span>
        </span>
      )}

      {/* Message */}
      <span className="flex-1 font-medium">{toast.message}</span>

      {/* Action Button */}
      {toast.action && (
        <button
          onClick={() => {
            toast.onAction?.()
            onDismiss()
          }}
          className="ml-3 font-semibold underline hover:opacity-80"
        >
          {toast.action}
        </button>
      )}

      {/* Dismiss Button */}
      <button onClick={onDismiss} className="ml-2 p-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
        <span className="text-lg">x</span>
      </button>
    </div>
  )
}

/**
 * useToast hook
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

/**
 * Standalone toast function (for simple use cases)
 */
let toastFn: ((options: Omit<ToastData, 'id'>) => void) | null = null

export function setToastHandler(handler: (options: Omit<ToastData, 'id'>) => void) {
  toastFn = handler
}

export function toast(options: Omit<ToastData, 'id'> | string) {
  if (typeof options === 'string') {
    toastFn?.({ message: options })
  } else {
    toastFn?.(options)
  }
}

// Shorthand methods
toast.success = (message: string) => toast({ message, variant: 'success' })
toast.error = (message: string) => toast({ message, variant: 'error' })
toast.warning = (message: string) => toast({ message, variant: 'warning' })
toast.info = (message: string) => toast({ message, variant: 'info' })

/**
 * Component metadata for Component Gallery
 */
export const ToastMetadata = {
  name: 'Toast',
  description: 'Temporary notification messages with auto-dismiss and action support.',
  category: 'Feedback',
  platform: 'mobile' as const,
  props: [
    { name: 'message', type: 'string', required: true, description: 'Toast message' },
    { name: 'variant', type: "'default' | 'success' | 'error' | 'warning' | 'info'", required: false, default: "'default'", description: 'Toast style variant' },
    { name: 'duration', type: 'number', required: false, default: '3000', description: 'Auto-dismiss duration (ms, 0 = no auto-dismiss)' },
    { name: 'action', type: 'string', required: false, description: 'Action button text' },
    { name: 'onAction', type: '() => void', required: false, description: 'Action button callback' },
  ],
  hooks: ['useToast'],
  subcomponents: ['ToastProvider'],
  dependencies: ['react-native-safe-area-context', 'nativewind'],
  examples: [
    {
      title: 'Setup ToastProvider',
      code: `function App() {
  return (
    <ToastProvider position="bottom">
      <YourApp />
    </ToastProvider>
  );
}`,
    },
    {
      title: 'Show Toast',
      code: `function MyComponent() {
  const { showToast } = useToast();

  return (
    <Button onPress={() => showToast({ message: 'Hello World!' })}>
      Show Toast
    </Button>
  );
}`,
    },
    {
      title: 'Success Toast',
      code: `showToast({
  message: 'Profile updated successfully',
  variant: 'success',
});`,
    },
    {
      title: 'Error Toast',
      code: `showToast({
  message: 'Failed to save changes',
  variant: 'error',
  duration: 5000,
});`,
    },
    {
      title: 'Toast with Action',
      code: `showToast({
  message: 'Item deleted',
  variant: 'default',
  action: 'Undo',
  onAction: () => restoreItem(),
});`,
    },
    {
      title: 'Shorthand Functions',
      code: `// Using shorthand
toast.success('Saved!');
toast.error('Something went wrong');
toast.warning('Low battery');
toast.info('New update available');`,
    },
  ],
}

export default Toast
