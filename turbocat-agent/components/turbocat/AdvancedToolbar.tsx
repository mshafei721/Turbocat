'use client';

import { useState, useEffect } from 'react';
import {
  Image,
  Microphone,
  CloudArrowUp,
  CreditCard,
  Cloud,
  Vibrate,
  File,
  Lock,
  FileText,
  Palette,
  CheckSquare,
  Globe,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImagePanel } from './panels/ImagePanel';
import { AudioPanel } from './panels/AudioPanel';
import { APIPanel } from './panels/APIPanel';
import { PaymentPanel } from './panels/PaymentPanel';
import { CloudPanel } from './panels/CloudPanel';
import { HapticsPanel } from './panels/HapticsPanel';
import { FilePanel } from './panels/FilePanel';
import { EnvPanel } from './panels/EnvPanel';
import { LogsPanel } from './panels/LogsPanel';
import { UIPanel } from './panels/UIPanel';
import { SelectPanel } from './panels/SelectPanel';
import { RequestPanel } from './panels/RequestPanel';

interface ToolbarIcon {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  disabled?: boolean;
  panel: React.ComponentType<PanelProps>;
}

interface PanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function AdvancedToolbar({
  platform,
  onInsert,
}: {
  platform: string;
  onInsert: (prompt: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const icons: ToolbarIcon[] = [
    {
      id: 'image',
      icon: <Image size={24} />,
      label: 'Add Image Upload',
      shortcut: 'Cmd+Shift+I',
      panel: ImagePanel,
    },
    {
      id: 'audio',
      icon: <Microphone size={24} />,
      label: 'Add Audio',
      shortcut: 'Cmd+Shift+A',
      panel: AudioPanel,
    },
    {
      id: 'api',
      icon: <CloudArrowUp size={24} />,
      label: 'Add API Integration',
      shortcut: 'Cmd+Shift+P',
      panel: APIPanel,
    },
    {
      id: 'payment',
      icon: <CreditCard size={24} />,
      label: 'Add Payments',
      shortcut: 'Cmd+Shift+$',
      panel: PaymentPanel,
    },
    {
      id: 'cloud',
      icon: <Cloud size={24} />,
      label: 'Add Cloud Storage',
      shortcut: 'Cmd+Shift+C',
      panel: CloudPanel,
    },
    {
      id: 'haptics',
      icon: <Vibrate size={24} />,
      label: 'Add Haptic Feedback',
      shortcut: 'Cmd+Shift+H',
      panel: HapticsPanel,
      disabled: platform === 'web',
    },
    {
      id: 'file',
      icon: <File size={24} />,
      label: 'Add File System',
      shortcut: 'Cmd+Shift+F',
      panel: FilePanel,
    },
    {
      id: 'env',
      icon: <Lock size={24} />,
      label: 'Add Environment Variables',
      shortcut: 'Cmd+Shift+E',
      panel: EnvPanel,
    },
    {
      id: 'logs',
      icon: <FileText size={24} />,
      label: 'Add Console Logs',
      shortcut: 'Cmd+Shift+L',
      panel: LogsPanel,
    },
    {
      id: 'ui',
      icon: <Palette size={24} />,
      label: 'Add UI Component',
      shortcut: 'Cmd+Shift+U',
      panel: UIPanel,
    },
    {
      id: 'select',
      icon: <CheckSquare size={24} />,
      label: 'Add Selection Control',
      shortcut: 'Cmd+Shift+S',
      panel: SelectPanel,
    },
    {
      id: 'request',
      icon: <Globe size={24} />,
      label: 'Add HTTP Request',
      shortcut: 'Cmd+Shift+R',
      panel: RequestPanel,
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const icon = icons.find((i) =>
          i.shortcut.endsWith(e.key.toUpperCase())
        );
        if (icon && !icon.disabled) {
          e.preventDefault();
          setActivePanel(icon.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [platform]);

  if (collapsed) {
    return (
      <div className="flex justify-center p-2 border-t">
        <button
          onClick={() => setCollapsed(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Expand toolbar"
        >
          <CaretUp size={20} />
        </button>
      </div>
    );
  }

  const ActivePanelComponent = activePanel
    ? icons.find((i) => i.id === activePanel)?.panel
    : null;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-4 px-4 py-3 border-t bg-background">
        {icons.map((icon) => (
          <Tooltip key={icon.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => !icon.disabled && setActivePanel(icon.id)}
                disabled={icon.disabled}
                className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={icon.label}
              >
                {icon.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {icon.label} ({icon.shortcut})
            </TooltipContent>
          </Tooltip>
        ))}
        <button
          onClick={() => setCollapsed(true)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Collapse toolbar"
        >
          <CaretDown size={20} />
        </button>
      </div>

      {ActivePanelComponent && (
        <ActivePanelComponent
          onInsert={(prompt) => {
            onInsert(prompt);
            setActivePanel(null);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
    </TooltipProvider>
  );
}
