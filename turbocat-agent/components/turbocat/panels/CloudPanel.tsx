'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CloudPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function CloudPanel({ onInsert, onClose }: CloudPanelProps) {
  const [config, setConfig] = useState({
    provider: 'AWS S3',
    features: ['upload', 'download'],
    maxSize: 10,
  });

  const handleSubmit = () => {
    if (config.features.length === 0) {
      return; // Validation: require at least one feature
    }

    const features = config.features.join(', ');
    const prompt = `Add ${config.provider} cloud storage with ${features} support, max ${config.maxSize}MB file size`;
    onInsert(prompt);
  };

  const toggleFeature = (feature: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, features: [...config.features, feature] });
    } else {
      setConfig({ ...config, features: config.features.filter((f) => f !== feature) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Cloud Storage</h3>
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
            <Label className="mb-2 block">Cloud Provider:</Label>
            <RadioGroup
              value={config.provider}
              onValueChange={(value) => setConfig({ ...config, provider: value })}
            >
              {['AWS S3', 'Google Cloud', 'Azure'].map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  <RadioGroupItem value={provider} id={`cloud-${provider}`} />
                  <Label htmlFor={`cloud-${provider}`}>{provider}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Features:</Label>
            <div className="space-y-2">
              {['upload', 'download', 'delete'].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Checkbox
                    id={`feature-${feature}`}
                    checked={config.features.includes(feature)}
                    onCheckedChange={(checked) => toggleFeature(feature, checked === true)}
                  />
                  <Label htmlFor={`feature-${feature}`}>{feature.charAt(0).toUpperCase() + feature.slice(1)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="maxSize" className="mb-2 block">Max File Size (MB):</Label>
            <Input
              id="maxSize"
              type="number"
              value={config.maxSize}
              onChange={(e) => setConfig({ ...config, maxSize: parseInt(e.target.value) || 1 })}
              min={1}
              max={100}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={config.features.length === 0}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
