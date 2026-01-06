/**
 * Container Component - Content Wrapper
 * Phase 4: Mobile Development - Task 5.2
 *
 * A flexible container component for wrapping content with consistent padding and layout.
 * Supports horizontal and vertical centering, and various padding sizes.
 *
 * @example
 * ```tsx
 * import { Container } from '@/components/mobile/layout/Container';
 *
 * export default function ProfileScreen() {
 *   return (
 *     <Container padding="lg" center>
 *       <Avatar />
 *       <Text className="text-xl font-semibold">John Doe</Text>
 *     </Container>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Container padding variants
 */
export type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Container component props
 */
export interface ContainerProps {
  /** Child elements to render */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Padding size (default: 'md') */
  padding?: ContainerPadding
  /** Whether to center content horizontally */
  centerHorizontal?: boolean
  /** Whether to center content vertically */
  centerVertical?: boolean
  /** Shorthand for centering both horizontally and vertically */
  center?: boolean
  /** Whether container should take full height */
  fullHeight?: boolean
  /** Whether container should take full width */
  fullWidth?: boolean
  /** Background color class (e.g., 'bg-white') */
  background?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * Padding class mapping
 */
const paddingClasses: Record<ContainerPadding, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
}

/**
 * Container Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ContainerTemplate = `import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  padding?: ContainerPadding;
  centerHorizontal?: boolean;
  centerVertical?: boolean;
  center?: boolean;
  fullHeight?: boolean;
  fullWidth?: boolean;
  background?: string;
  testID?: string;
}

const paddingClasses: Record<ContainerPadding, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function Container({
  children,
  className,
  padding = 'md',
  centerHorizontal = false,
  centerVertical = false,
  center = false,
  fullHeight = false,
  fullWidth = true,
  background,
  testID,
  ...props
}: ContainerProps) {
  const shouldCenterH = center || centerHorizontal;
  const shouldCenterV = center || centerVertical;

  return (
    <View
      className={cn(
        paddingClasses[padding],
        shouldCenterH && 'items-center',
        shouldCenterV && 'justify-center',
        fullHeight && 'flex-1',
        fullWidth && 'w-full',
        background,
        className,
      )}
      testID={testID}
      {...props}
    >
      {children}
    </View>
  );
}
`

/**
 * Container component for React Native Web preview
 */
export function Container({
  children,
  className,
  padding = 'md',
  centerHorizontal = false,
  centerVertical = false,
  center = false,
  fullHeight = false,
  fullWidth = true,
  background,
  testID,
}: ContainerProps) {
  const shouldCenterH = center || centerHorizontal
  const shouldCenterV = center || centerVertical

  return (
    <div
      className={cn(
        'flex flex-col',
        paddingClasses[padding],
        shouldCenterH && 'items-center',
        shouldCenterV && 'justify-center',
        fullHeight && 'flex-1 h-full',
        fullWidth && 'w-full',
        background,
        className,
      )}
      data-testid={testID}
    >
      {children}
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const ContainerMetadata = {
  name: 'Container',
  description: 'Flexible content wrapper with consistent padding and centering options.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Child elements to render' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'padding', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", required: false, default: "'md'", description: 'Padding size' },
    { name: 'center', type: 'boolean', required: false, default: 'false', description: 'Center content both horizontally and vertically' },
    { name: 'centerHorizontal', type: 'boolean', required: false, default: 'false', description: 'Center content horizontally' },
    { name: 'centerVertical', type: 'boolean', required: false, default: 'false', description: 'Center content vertically' },
    { name: 'fullHeight', type: 'boolean', required: false, default: 'false', description: 'Container takes full available height' },
    { name: 'fullWidth', type: 'boolean', required: false, default: 'true', description: 'Container takes full width' },
    { name: 'background', type: 'string', required: false, description: 'Background color class' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Container with padding',
      code: `<Container padding="lg">
  <Text>Content with large padding</Text>
</Container>`,
    },
    {
      title: 'Centered Container',
      code: `<Container center fullHeight background="bg-gray-100">
  <Text className="text-2xl font-bold">Centered Content</Text>
</Container>`,
    },
    {
      title: 'Container with custom background',
      code: `<Container padding="xl" background="bg-primary">
  <Text className="text-white">Primary Background</Text>
</Container>`,
    },
  ],
}

export default Container
