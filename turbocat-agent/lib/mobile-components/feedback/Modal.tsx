/**
 * Modal/Dialog Component - Overlay Content Display
 * Phase 4: Mobile Development - Task 5.6
 *
 * A flexible modal/dialog component for displaying content in an overlay.
 * Supports full-screen, centered, and bottom sheet presentations.
 *
 * @example
 * ```tsx
 * import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/mobile/feedback/Modal';
 *
 * export default function SettingsScreen() {
 *   const [showModal, setShowModal] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onPress={() => setShowModal(true)}>Open Modal</Button>
 *       <Modal visible={showModal} onClose={() => setShowModal(false)}>
 *         <ModalHeader title="Confirm Action" onClose={() => setShowModal(false)} />
 *         <ModalContent>
 *           <Text>Are you sure you want to proceed?</Text>
 *         </ModalContent>
 *         <ModalFooter>
 *           <Button variant="outline" onPress={() => setShowModal(false)}>Cancel</Button>
 *           <Button onPress={handleConfirm}>Confirm</Button>
 *         </ModalFooter>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Modal presentation style
 */
export type ModalPresentation = 'center' | 'bottom' | 'fullscreen'

/**
 * Modal animation style
 */
export type ModalAnimation = 'fade' | 'slide' | 'none'

/**
 * Modal component props
 */
export interface ModalProps {
  /** Whether modal is visible */
  visible: boolean
  /** Close handler */
  onClose: () => void
  /** Modal content */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Presentation style (default: 'center') */
  presentation?: ModalPresentation
  /** Animation type (default: 'fade') */
  animation?: ModalAnimation
  /** Close on backdrop press */
  closeOnBackdropPress?: boolean
  /** Show backdrop */
  showBackdrop?: boolean
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number
  /** Enable swipe to dismiss (for bottom sheet) */
  swipeToDismiss?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * ModalHeader props
 */
export interface ModalHeaderProps {
  /** Title text */
  title?: string
  /** Subtitle text */
  subtitle?: string
  /** Close button handler */
  onClose?: () => void
  /** Additional NativeWind classes */
  className?: string
  /** Show close button */
  showCloseButton?: boolean
}

/**
 * ModalContent props
 */
export interface ModalContentProps {
  /** Content */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Enable scrolling */
  scrollable?: boolean
}

/**
 * ModalFooter props
 */
export interface ModalFooterProps {
  /** Footer content */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
}

/**
 * Presentation classes
 */
const presentationClasses: Record<ModalPresentation, { backdrop: string; container: string; modal: string }> = {
  center: {
    backdrop: 'items-center justify-center',
    container: 'p-4',
    modal: 'w-full max-w-lg rounded-xl',
  },
  bottom: {
    backdrop: 'items-end justify-end',
    container: '',
    modal: 'w-full rounded-t-2xl',
  },
  fullscreen: {
    backdrop: '',
    container: '',
    modal: 'flex-1 w-full',
  },
}

/**
 * Modal Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ModalTemplate = `import { View, Text, Modal as RNModal, Pressable, ScrollView, Animated, PanResponder } from 'react-native';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Types...

export function Modal({
  visible,
  onClose,
  children,
  className,
  presentation = 'center',
  animation = 'fade',
  closeOnBackdropPress = true,
  showBackdrop = true,
  backdropOpacity = 0.5,
  swipeToDismiss = true,
  testID,
}: ModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const presentationStyle = presentationClasses[presentation];

  // Animation on visibility change
  useEffect(() => {
    if (visible) {
      if (animation === 'fade' || animation === 'slide') {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          presentation === 'bottom' && Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ].filter(Boolean)).start();
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return swipeToDismiss && presentation === 'bottom' && gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 150,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animation === 'none' ? 'none' : 'none'}
      onRequestClose={onClose}
      testID={testID}
    >
      <View className={cn('flex-1', presentationStyle.backdrop)}>
        {/* Backdrop */}
        {showBackdrop && (
          <Animated.View
            className="absolute inset-0 bg-black"
            style={{ opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, backdropOpacity],
            }) }}
          >
            <Pressable
              className="flex-1"
              onPress={closeOnBackdropPress ? onClose : undefined}
            />
          </Animated.View>
        )}

        {/* Modal Container */}
        <Animated.View
          className={cn(
            'bg-background',
            presentationStyle.container,
            presentationStyle.modal,
            className,
          )}
          style={[
            animation === 'fade' && { opacity: fadeAnim },
            presentation === 'bottom' && { transform: [{ translateY: slideAnim }] },
          ]}
          {...(presentation === 'bottom' ? panResponder.panHandlers : {})}
          accessibilityViewIsModal
          accessibilityRole="dialog"
        >
          {/* Drag Handle for Bottom Sheet */}
          {presentation === 'bottom' && swipeToDismiss && (
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full bg-muted" />
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

// ModalHeader component
export function ModalHeader({
  title,
  subtitle,
  onClose,
  className,
  showCloseButton = true,
}: ModalHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between p-4 border-b border-border', className)}>
      <View className="flex-1">
        {title && (
          <Text className="text-lg font-semibold text-foreground">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text className="text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {showCloseButton && onClose && (
        <Pressable
          onPress={onClose}
          className="p-2 -mr-2 rounded-full active:bg-muted"
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Text className="text-xl text-muted-foreground">x</Text>
        </Pressable>
      )}
    </View>
  );
}

// ModalContent component
export function ModalContent({ children, className, scrollable = false }: ModalContentProps) {
  const Wrapper = scrollable ? ScrollView : View;
  return (
    <Wrapper className={cn('p-4', className)}>
      {children}
    </Wrapper>
  );
}

// ModalFooter component
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <View className={cn('flex-row items-center justify-end gap-2 p-4 border-t border-border', className)}>
      {children}
    </View>
  );
}
`

/**
 * Modal component for React Native Web preview
 */
export function Modal({
  visible,
  onClose,
  children,
  className,
  presentation = 'center',
  closeOnBackdropPress = true,
  showBackdrop = true,
  backdropOpacity = 0.5,
  swipeToDismiss = true,
  testID,
}: ModalProps) {
  if (!visible) return null

  const presentationStyle = presentationClasses[presentation]

  return (
    <div className="fixed inset-0 z-50" data-testid={testID} role="dialog" aria-modal="true">
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="absolute inset-0 bg-black transition-opacity"
          style={{ opacity: backdropOpacity }}
          onClick={closeOnBackdropPress ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Modal Container */}
      <div className={cn('flex h-full', presentationStyle.backdrop)}>
        <div
          className={cn('bg-background relative', presentationStyle.container, presentationStyle.modal, className)}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for Bottom Sheet */}
          {presentation === 'bottom' && swipeToDismiss && (
            <div className="flex items-center justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * ModalHeader component for React Native Web preview
 */
export function ModalHeader({ title, subtitle, onClose, className, showCloseButton = true }: ModalHeaderProps) {
  return (
    <div className={cn('flex flex-row items-center justify-between p-4 border-b border-border', className)}>
      <div className="flex-1">
        {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <span className="text-xl text-muted-foreground">x</span>
        </button>
      )}
    </div>
  )
}

/**
 * ModalContent component for React Native Web preview
 */
export function ModalContent({ children, className, scrollable = false }: ModalContentProps) {
  return <div className={cn('p-4', scrollable && 'overflow-y-auto max-h-96', className)}>{children}</div>
}

/**
 * ModalFooter component for React Native Web preview
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={cn('flex flex-row items-center justify-end gap-2 p-4 border-t border-border', className)}>{children}</div>
}

/**
 * Component metadata for Component Gallery
 */
export const ModalMetadata = {
  name: 'Modal',
  description: 'Overlay dialog with center, bottom sheet, and fullscreen presentations.',
  category: 'Feedback',
  platform: 'mobile' as const,
  props: [
    { name: 'visible', type: 'boolean', required: true, description: 'Whether modal is visible' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Modal content' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'presentation', type: "'center' | 'bottom' | 'fullscreen'", required: false, default: "'center'", description: 'Presentation style' },
    { name: 'animation', type: "'fade' | 'slide' | 'none'", required: false, default: "'fade'", description: 'Animation type' },
    { name: 'closeOnBackdropPress', type: 'boolean', required: false, default: 'true', description: 'Close on backdrop tap' },
    { name: 'showBackdrop', type: 'boolean', required: false, default: 'true', description: 'Show backdrop' },
    { name: 'backdropOpacity', type: 'number', required: false, default: '0.5', description: 'Backdrop opacity (0-1)' },
    { name: 'swipeToDismiss', type: 'boolean', required: false, default: 'true', description: 'Swipe to dismiss (bottom sheet)' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['ModalHeader', 'ModalContent', 'ModalFooter'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Modal',
      code: `<Modal visible={show} onClose={() => setShow(false)}>
  <ModalHeader title="Modal Title" onClose={() => setShow(false)} />
  <ModalContent>
    <Text>Modal content goes here</Text>
  </ModalContent>
</Modal>`,
    },
    {
      title: 'Confirmation Dialog',
      code: `<Modal visible={showConfirm} onClose={closeConfirm}>
  <ModalHeader title="Confirm Delete" onClose={closeConfirm} />
  <ModalContent>
    <Text>Are you sure you want to delete this item?</Text>
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onPress={closeConfirm}>Cancel</Button>
    <Button variant="destructive" onPress={handleDelete}>Delete</Button>
  </ModalFooter>
</Modal>`,
    },
    {
      title: 'Bottom Sheet',
      code: `<Modal
  visible={showSheet}
  onClose={() => setShowSheet(false)}
  presentation="bottom"
>
  <ModalHeader title="Options" />
  <ModalContent>
    <ListItem title="Edit" onPress={handleEdit} />
    <ListItem title="Share" onPress={handleShare} />
    <ListItem title="Delete" onPress={handleDelete} />
  </ModalContent>
</Modal>`,
    },
  ],
}

export default Modal
