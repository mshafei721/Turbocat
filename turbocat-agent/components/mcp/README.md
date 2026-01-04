# MCP Status UI Components

This directory contains React components for displaying and managing MCP (Model Context Protocol) server status in the Turbocat application.

## Components

### MCPConnectionIndicator

A status indicator component that displays the connection state with appropriate icon and color.

**Features:**
- Color-coded status display (green=connected, red=error, yellow=rate limited, blue=connecting)
- Icon representation (check, x, clock, loader)
- Accessible with ARIA labels
- Optional text labels
- Customizable icon size

**Usage:**
```tsx
import { MCPConnectionIndicator } from '@/components/mcp'

<MCPConnectionIndicator status="connected" />
<MCPConnectionIndicator status="connecting" showLabel={false} />
```

### MCPServerCard

A card component that displays comprehensive information about a single MCP server.

**Features:**
- Server name and connection status
- Request statistics (successful/failed counts)
- Success rate visualization with progress bar
- Rate limit information with usage indicator
- Error message display
- Configure button for disconnected servers
- Responsive design (stacks on mobile)
- Keyboard navigation support
- Selection state

**Usage:**
```tsx
import { MCPServerCard } from '@/components/mcp'

<MCPServerCard
  status={serverStatus}
  onClick={() => handleServerSelect(status.serverName)}
  onConfigure={() => handleConfigure(status.serverName)}
  isSelected={selectedServer === status.serverName}
/>
```

### MCPStatusPanel

A comprehensive panel component that displays all MCP servers in a responsive grid layout.

**Features:**
- Responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- Server status summary badges
- Refresh all functionality
- View logs navigation
- Collapsible panel
- Empty state handling
- Loading state for refresh operation
- Server selection management

**Usage:**
```tsx
import { MCPStatusPanel } from '@/components/mcp'

<MCPStatusPanel
  statuses={allServerStatuses}
  onRefreshAll={handleRefreshAll}
  onViewLogs={() => navigate('/logs')}
  onServerSelect={(name) => setSelectedServer(name)}
  onConfigure={(name) => openConfigDialog(name)}
  selectedServer={selectedServer}
  isRefreshing={isRefreshing}
/>
```

## Design Tokens

All components use design tokens from `@/lib/design-tokens` for consistent theming:

- **Colors**: Semantic status colors (success, error, warning, info)
- **Typography**: Font families, sizes, and weights
- **Spacing**: Consistent spacing scale
- **Shadows**: Elevation and depth
- **Border Radius**: Rounded corners
- **Animations**: Transition timing and easing

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Sufficient color contrast ratios
- Semantic HTML elements

## Testing

Component tests are located in `__tests__/mcp-ui.test.ts`:

1. **MCPStatusPanel renders all server cards** - Verifies grid rendering
2. **MCPServerCard shows correct status indicator color** - Tests color mapping
3. **Connection indicator reflects status changes** - Tests state transitions

Run tests:
```bash
npx tsx __tests__/mcp-ui.test.ts
```

## Storybook

Interactive component documentation is available in Storybook:

- `stories/mcp/MCPConnectionIndicator.stories.tsx`
- `stories/mcp/MCPServerCard.stories.tsx`
- `stories/mcp/MCPStatusPanel.stories.tsx`

View stories:
```bash
pnpm storybook
```

## Type Definitions

All components use TypeScript types from `@/lib/mcp/types`:

- `MCPConnectionStatus` - Server connection status data
- `MCPConnectionStatusType` - Status enum (connected, disconnected, etc.)
- `MCPRateLimit` - Rate limiting information
- `MCPServerTools` - Available capabilities

## Files Created

### Components
- `mcp-connection-indicator.tsx` - Status indicator component
- `mcp-server-card.tsx` - Server card component
- `mcp-status-panel.tsx` - Main status panel
- `index.ts` - Component exports

### Tests
- `__tests__/mcp-ui.test.ts` - Component tests (3 tests, all passing)

### Storybook Stories
- `stories/mcp/MCPConnectionIndicator.stories.tsx` - 12 stories
- `stories/mcp/MCPServerCard.stories.tsx` - 14 stories
- `stories/mcp/MCPStatusPanel.stories.tsx` - 11 stories

## Integration

These components integrate with the MCP Server Manager from `@/lib/mcp/manager`:

```tsx
import { getMCPManager } from '@/lib/mcp/manager'
import { MCPStatusPanel } from '@/components/mcp'

const manager = getMCPManager()
const statuses = manager.getStatus()

<MCPStatusPanel
  statuses={statuses}
  onRefreshAll={async () => {
    await manager.healthCheckAll()
  }}
/>
```

## Phase 3 Integration

These components are part of **Phase 3: Skills & MCP Integration** and serve as the UI foundation for:

- Real-time MCP server health monitoring
- Connection management interface
- Rate limit tracking and visualization
- Error reporting and diagnostics

## Next Steps

- Integration with server configuration dialogs
- Real-time status updates via WebSocket
- Historical metrics and analytics
- Alert notifications for server issues
