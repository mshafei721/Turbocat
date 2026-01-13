'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface LogsPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function LogsPanel({ onInsert, onClose }: LogsPanelProps) {
  const [config, setConfig] = useState({
    levels: ['info', 'error'],
    targets: ['console'],
  });

  const handleSubmit = () => {
    if (config.levels.length === 0 || config.targets.length === 0) {
      return; // Validation: require at least one level and target
    }

    const levels = config.levels.join(', ');
    const targets = config.targets.join(', ');
    const prompt = `Add logging with ${levels} levels to ${targets} output`;
    onInsert(prompt);
  };

  const toggleLevel = (level: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, levels: [...config.levels, level] });
    } else {
      setConfig({ ...config, levels: config.levels.filter((l) => l !== level) });
    }
  };

  const toggleTarget = (target: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, targets: [...config.targets, target] });
    } else {
      setConfig({ ...config, targets: config.targets.filter((t) => t !== target) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Console Logs</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label className="mb-2 block">Log Levels:</Label>
            <div className="space-y-2">
              {['info', 'warn', 'error', 'debug'].map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={config.levels.includes(level)}
                    onCheckedChange={(checked) => toggleLevel(level, checked === true)}
                  />
                  <Label htmlFor={`level-${level}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Log Targets:</Label>
            <div className="space-y-2">
              {['console', 'file', 'remote'].map((target) => (
                <div key={target} className="flex items-center gap-2">
                  <Checkbox
                    id={`target-${target}`}
                    checked={config.targets.includes(target)}
                    onCheckedChange={(checked) => toggleTarget(target, checked === true)}
                  />
                  <Label htmlFor={`target-${target}`}>{target.charAt(0).toUpperCase() + target.slice(1)}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={config.levels.length === 0 || config.targets.length === 0}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
