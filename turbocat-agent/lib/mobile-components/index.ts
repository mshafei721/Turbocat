/**
 * Mobile Component Library - Main Entry Point
 * Phase 4: Mobile Development - Tasks 5.1-5.6
 *
 * Complete collection of 21 mobile components using NativeWind (Tailwind for React Native).
 * All components are designed to work with Expo and React Native, matching the web design tokens.
 *
 * Categories:
 * - Layout: Screen, Container, Card, Divider, Spacer (5 components)
 * - Navigation: Header, TabBar, Drawer, BackButton (4 components)
 * - Input: Button, TextInput, Checkbox, Radio, Switch (5 components)
 * - Data Display: List, Avatar, Badge, Chip (4 components)
 * - Feedback: Modal, Loading, Toast (3 components)
 *
 * Total: 21 components
 */

// Configuration
export {
  colorPalette,
  typography,
  spacing,
  borderRadius,
  shadows,
  nativewindConfig,
  babelConfig,
  generateTailwindConfig,
  generateThemeVariables,
} from './nativewind.config'

// Utilities
export { cn, createVariants, getPlatform, createAccessibilityProps, hslToRgb, hslToHex, debounce, throttle } from './utils'

// Layout Components (5)
export {
  Screen,
  ScreenTemplate,
  ScreenMetadata,
  Container,
  ContainerTemplate,
  ContainerMetadata,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTemplate,
  CardMetadata,
  Divider,
  DividerTemplate,
  DividerMetadata,
  Spacer,
  VSpacer,
  HSpacer,
  FlexSpacer,
  SpacerTemplate,
  SpacerMetadata,
  layoutComponentMetadata,
} from './layout'

export type {
  ScreenProps,
  ContainerProps,
  ContainerPadding,
  CardProps,
  CardVariant,
  DividerProps,
  DividerOrientation,
  DividerThickness,
  DividerColor,
  SpacerProps,
  SpacerSize,
} from './layout'

// Navigation Components (4)
export {
  Header,
  HeaderTemplate,
  HeaderMetadata,
  TabBar,
  TabBarItem,
  TabBarTemplate,
  TabBarMetadata,
  Drawer,
  DrawerItem,
  DrawerHeader,
  DrawerTemplate,
  DrawerMetadata,
  BackButton,
  IOSBackButton,
  AndroidBackButton,
  BackButtonTemplate,
  BackButtonMetadata,
  navigationComponentMetadata,
} from './navigation'

export type {
  HeaderProps,
  HeaderVariant,
  HeaderSize,
  TabBarProps,
  TabBarItemProps,
  TabBarVariant,
  DrawerProps,
  DrawerItemProps,
  DrawerPosition,
  BackButtonProps,
  BackButtonVariant,
  BackButtonSize,
} from './navigation'

// Input Components (5)
export {
  Button,
  ButtonTemplate,
  ButtonMetadata,
  TextInput,
  TextInputTemplate,
  TextInputMetadata,
  Checkbox,
  CheckboxTemplate,
  CheckboxMetadata,
  RadioGroup,
  RadioItem,
  RadioTemplate,
  RadioMetadata,
  Switch,
  SwitchTemplate,
  SwitchMetadata,
  inputComponentMetadata,
} from './input'

export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  TextInputProps,
  TextInputVariant,
  TextInputSize,
  KeyboardType,
  CheckboxProps,
  CheckboxSize,
  RadioGroupProps,
  RadioItemProps,
  RadioSize,
  SwitchProps,
  SwitchSize,
} from './input'

// Data Display Components (4)
export {
  List,
  ListItem,
  ListSectionHeader,
  ListTemplate,
  ListMetadata,
  Avatar,
  AvatarGroup,
  AvatarTemplate,
  AvatarMetadata,
  Badge,
  BadgeWrapper,
  BadgeTemplate,
  BadgeMetadata,
  Chip,
  ChipGroup,
  ChipTemplate,
  ChipMetadata,
  dataDisplayComponentMetadata,
} from './data-display'

export type {
  ListProps,
  ListItemProps,
  AvatarProps,
  AvatarGroupProps,
  AvatarSize,
  AvatarShape,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  ChipProps,
  ChipGroupProps,
  ChipVariant,
  ChipSize,
} from './data-display'

// Feedback Components (3)
export {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalTemplate,
  ModalMetadata,
  Loading,
  Spinner,
  LoadingOverlay,
  Skeleton,
  LoadingTemplate,
  LoadingMetadata,
  Toast,
  ToastProvider,
  useToast,
  toast,
  setToastHandler,
  ToastTemplate,
  ToastMetadata,
  feedbackComponentMetadata,
} from './feedback'

export type {
  ModalProps,
  ModalHeaderProps,
  ModalContentProps,
  ModalFooterProps,
  ModalPresentation,
  ModalAnimation,
  LoadingProps,
  SpinnerProps,
  LoadingOverlayProps,
  SpinnerSize,
  SpinnerColor,
  ToastData,
  ToastProps,
  ToastProviderProps,
  ToastVariant,
  ToastPosition,
} from './feedback'

/**
 * All component metadata for Component Gallery
 */
export const allMobileComponentMetadata = {
  layout: () => import('./layout').then((m) => m.layoutComponentMetadata),
  navigation: () => import('./navigation').then((m) => m.navigationComponentMetadata),
  input: () => import('./input').then((m) => m.inputComponentMetadata),
  dataDisplay: () => import('./data-display').then((m) => m.dataDisplayComponentMetadata),
  feedback: () => import('./feedback').then((m) => m.feedbackComponentMetadata),
}

/**
 * Get all component metadata as a flat array
 */
export async function getAllComponentMetadata() {
  const [layout, navigation, input, dataDisplay, feedback] = await Promise.all([
    allMobileComponentMetadata.layout(),
    allMobileComponentMetadata.navigation(),
    allMobileComponentMetadata.input(),
    allMobileComponentMetadata.dataDisplay(),
    allMobileComponentMetadata.feedback(),
  ])

  return [...layout, ...navigation, ...input, ...dataDisplay, ...feedback]
}

/**
 * Component categories for filtering
 */
export const mobileComponentCategories = [
  { id: 'layout', label: 'Layout', count: 5 },
  { id: 'navigation', label: 'Navigation', count: 4 },
  { id: 'input', label: 'Input & Forms', count: 5 },
  { id: 'dataDisplay', label: 'Data Display', count: 4 },
  { id: 'feedback', label: 'Feedback', count: 3 },
] as const

/**
 * Total component count
 */
export const TOTAL_MOBILE_COMPONENTS = 21
