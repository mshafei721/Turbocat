'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface AudioPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function AudioPanel({ onInsert, onClose }: AudioPanelProps) {
  const [config, setConfig] = useState({
    type: ['microphone', 'file'],
    maxDuration: 60,
    format: 'mp3',
  });

  const handleSubmit = () => {
    if (config.type.length === 0) {
      return; // Validation: require at least one type
    }

    const types = config.type.join(' and ');
    const prompt = `Add audio recording with ${types} input, max ${config.maxDuration}s duration, ${config.format.toUpperCase()} format`;
    onInsert(prompt);
  };

  const toggleType = (type: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, type: [...config.type, type] });
    } else {
      setConfig({ ...config, type: config.type.filter((t) => t !== type) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Audio Recording</h3>
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
            <Label className="mb-2 block">Type:</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="microphone"
                  checked={config.type.includes('microphone')}
                  onCheckedChange={(checked) => toggleType('microphone', checked === true)}
                />
                <Label htmlFor="microphone">Microphone</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="file-upload"
                  checked={config.type.includes('file')}
                  onCheckedChange={(checked) => toggleType('file', checked === true)}
                />
                <Label htmlFor="file-upload">File Upload</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="maxDuration" className="mb-2 block">Max Duration (seconds):</Label>
            <Input
              id="maxDuration"
              type="number"
              value={config.maxDuration}
              onChange={(e) => setConfig({ ...config, maxDuration: parseInt(e.target.value) || 1 })}
              min={1}
              max={600}
            />
          </div>

          <div>
            <Label className="mb-2 block">Format:</Label>
            <RadioGroup
              value={config.format}
              onValueChange={(value) => setConfig({ ...config, format: value })}
            >
              {['mp3', 'wav', 'aac'].map((format) => (
                <div key={format} className="flex items-center gap-2">
                  <RadioGroupItem value={format} id={`audio-${format}`} />
                  <Label htmlFor={`audio-${format}`}>{format.toUpperCase()}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={config.type.length === 0}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
