'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ImagePanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function ImagePanel({ onInsert, onClose }: ImagePanelProps) {
  const [config, setConfig] = useState({
    source: ['camera', 'gallery'],
    maxSize: 5,
    formats: ['jpg', 'png', 'heic'],
    aspectRatio: '16:9',
  });

  const handleSubmit = () => {
    if (config.source.length === 0 || config.formats.length === 0) {
      return; // Validation: require at least one source and format
    }

    const sources = config.source.join(' and ');
    const formats = config.formats.map((f) => f.toUpperCase()).join('/');
    const prompt = `Add image upload with ${sources} access, max ${config.maxSize}MB, support ${formats} formats, ${config.aspectRatio} aspect ratio`;
    onInsert(prompt);
  };

  const toggleSource = (source: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, source: [...config.source, source] });
    } else {
      setConfig({ ...config, source: config.source.filter((s) => s !== source) });
    }
  };

  const toggleFormat = (format: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, formats: [...config.formats, format] });
    } else {
      setConfig({ ...config, formats: config.formats.filter((f) => f !== format) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Image Upload</h3>
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
            <Label className="mb-2 block">Source:</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="camera"
                  checked={config.source.includes('camera')}
                  onCheckedChange={(checked) => toggleSource('camera', checked === true)}
                />
                <Label htmlFor="camera">Camera</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gallery"
                  checked={config.source.includes('gallery')}
                  onCheckedChange={(checked) => toggleSource('gallery', checked === true)}
                />
                <Label htmlFor="gallery">Gallery</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="maxSize" className="mb-2 block">Max Size (MB):</Label>
            <Input
              id="maxSize"
              type="number"
              value={config.maxSize}
              onChange={(e) => setConfig({ ...config, maxSize: parseInt(e.target.value) || 1 })}
              min={1}
              max={50}
            />
          </div>

          <div>
            <Label className="mb-2 block">Formats:</Label>
            <div className="grid grid-cols-2 gap-2">
              {['jpg', 'png', 'heic', 'gif'].map((format) => (
                <div key={format} className="flex items-center gap-2">
                  <Checkbox
                    id={format}
                    checked={config.formats.includes(format)}
                    onCheckedChange={(checked) => toggleFormat(format, checked === true)}
                  />
                  <Label htmlFor={format}>{format.toUpperCase()}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Aspect Ratio:</Label>
            <RadioGroup
              value={config.aspectRatio}
              onValueChange={(value) => setConfig({ ...config, aspectRatio: value })}
            >
              {['Free', 'Square', '16:9', '4:3'].map((ratio) => (
                <div key={ratio} className="flex items-center gap-2">
                  <RadioGroupItem value={ratio} id={`ratio-${ratio}`} />
                  <Label htmlFor={`ratio-${ratio}`}>{ratio}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={config.source.length === 0 || config.formats.length === 0}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
