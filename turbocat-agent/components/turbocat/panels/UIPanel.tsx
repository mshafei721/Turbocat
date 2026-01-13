'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface UIPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function UIPanel({ onInsert, onClose }: UIPanelProps) {
  const [config, setConfig] = useState({
    type: 'button',
    variant: 'primary',
  });

  const handleSubmit = () => {
    const prompt = `Add ${config.type} UI component with ${config.variant} variant`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add UI Component</h3>
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
            <Label className="mb-2 block">Component Type:</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              {['button', 'input', 'card', 'modal', 'drawer'].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <RadioGroupItem value={type} id={`ui-type-${type}`} />
                  <Label htmlFor={`ui-type-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Variant:</Label>
            <RadioGroup
              value={config.variant}
              onValueChange={(value) => setConfig({ ...config, variant: value })}
            >
              {['primary', 'secondary', 'outline'].map((variant) => (
                <div key={variant} className="flex items-center gap-2">
                  <RadioGroupItem value={variant} id={`ui-variant-${variant}`} />
                  <Label htmlFor={`ui-variant-${variant}`}>{variant.charAt(0).toUpperCase() + variant.slice(1)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </div>
      </div>
    </div>
  );
}
