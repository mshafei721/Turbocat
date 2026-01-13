'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface HapticsPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function HapticsPanel({ onInsert, onClose }: HapticsPanelProps) {
  const [config, setConfig] = useState({
    type: 'medium',
    events: ['tap', 'success'],
  });

  const handleSubmit = () => {
    if (config.events.length === 0) {
      return; // Validation: require at least one event
    }

    const events = config.events.join(', ');
    const prompt = `Add ${config.type} haptic feedback for ${events} events`;
    onInsert(prompt);
  };

  const toggleEvent = (event: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, events: [...config.events, event] });
    } else {
      setConfig({ ...config, events: config.events.filter((e) => e !== event) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Haptic Feedback</h3>
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
            <Label className="mb-2 block">Haptic Type:</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              {['light', 'medium', 'heavy'].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <RadioGroupItem value={type} id={`haptic-${type}`} />
                  <Label htmlFor={`haptic-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Events:</Label>
            <div className="space-y-2">
              {['tap', 'success', 'error', 'warning'].map((event) => (
                <div key={event} className="flex items-center gap-2">
                  <Checkbox
                    id={`event-${event}`}
                    checked={config.events.includes(event)}
                    onCheckedChange={(checked) => toggleEvent(event, checked === true)}
                  />
                  <Label htmlFor={`event-${event}`}>{event.charAt(0).toUpperCase() + event.slice(1)}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={config.events.length === 0}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
