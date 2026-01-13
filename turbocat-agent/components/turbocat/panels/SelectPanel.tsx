'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SelectPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function SelectPanel({ onInsert, onClose }: SelectPanelProps) {
  const [config, setConfig] = useState({
    type: 'dropdown',
    options: 'Option 1\nOption 2\nOption 3',
  });

  const handleSubmit = () => {
    if (!config.options.trim()) {
      return; // Validation: require at least one option
    }

    const optionList = config.options
      .split('\n')
      .filter((o) => o.trim())
      .join(', ');
    const prompt = `Add ${config.type} selection control with options: ${optionList}`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Selection Control</h3>
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
            <Label className="mb-2 block">Control Type:</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              {['dropdown', 'radio', 'checkbox', 'toggle'].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <RadioGroupItem value={type} id={`select-${type}`} />
                  <Label htmlFor={`select-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="options" className="mb-2 block">
              Options (one per line):
            </Label>
            <Textarea
              id="options"
              value={config.options}
              onChange={(e) => setConfig({ ...config, options: e.target.value })}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={6}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!config.options.trim()}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
