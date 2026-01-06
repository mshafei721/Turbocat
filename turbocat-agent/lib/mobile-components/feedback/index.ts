/**
 * Feedback Components - Mobile Component Library
 * Phase 4: Mobile Development - Task 5.6
 *
 * Re-exports all feedback components for convenient importing.
 */

export {
  default as Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalTemplate,
  ModalMetadata,
} from './Modal'
export type {
  ModalProps,
  ModalHeaderProps,
  ModalContentProps,
  ModalFooterProps,
  ModalPresentation,
  ModalAnimation,
} from './Modal'

export {
  default as Loading,
  Spinner,
  LoadingOverlay,
  Skeleton,
  LoadingTemplate,
  LoadingMetadata,
} from './Loading'
export type {
  LoadingProps,
  SpinnerProps,
  LoadingOverlayProps,
  SpinnerSize,
  SpinnerColor,
} from './Loading'

export {
  default as Toast,
  ToastProvider,
  useToast,
  toast,
  setToastHandler,
  ToastTemplate,
  ToastMetadata,
} from './Toast'
export type {
  ToastData,
  ToastProps,
  ToastProviderProps,
  ToastVariant,
  ToastPosition,
} from './Toast'

/**
 * All feedback component metadata for Component Gallery
 */
export const feedbackComponentMetadata = [
  { component: 'Modal', metadata: () => import('./Modal').then((m) => m.ModalMetadata) },
  { component: 'Loading', metadata: () => import('./Loading').then((m) => m.LoadingMetadata) },
  { component: 'Toast', metadata: () => import('./Toast').then((m) => m.ToastMetadata) },
]
