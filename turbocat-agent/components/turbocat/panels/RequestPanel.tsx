'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface RequestPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function RequestPanel({ onInsert, onClose }: RequestPanelProps) {
  const [config, setConfig] = useState({
    url: 'https://api.example.com/endpoint',
    method: 'GET',
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '{\n  "key": "value"\n}',
  });

  const handleSubmit = () => {
    if (!config.url.trim()) {
      return; // Validation: require URL
    }

    const includeHeaders = config.headers.trim() && config.headers !== '{}';
    const includeBody = config.body.trim() && config.body !== '{}' && config.method !== 'GET';

    let prompt = `Add ${config.method} request to ${config.url}`;
    if (includeHeaders) {
      prompt += ' with custom headers';
    }
    if (includeBody) {
      prompt += ' and request body';
    }

    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add HTTP Request</h3>
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
            <Label htmlFor="url" className="mb-2 block">URL:</Label>
            <Input
              id="url"
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>

          <div>
            <Label className="mb-2 block">HTTP Method:</Label>
            <RadioGroup
              value={config.method}
              onValueChange={(value) => setConfig({ ...config, method: value })}
            >
              {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <RadioGroupItem value={method} id={`request-${method}`} />
                  <Label htmlFor={`request-${method}`}>{method}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="headers" className="mb-2 block">Headers (JSON):</Label>
            <Textarea
              id="headers"
              value={config.headers}
              onChange={(e) => setConfig({ ...config, headers: e.target.value })}
              placeholder='{\n  "Content-Type": "application/json"\n}'
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {config.method !== 'GET' && (
            <div>
              <Label htmlFor="body" className="mb-2 block">Body (JSON):</Label>
              <Textarea
                id="body"
                value={config.body}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                placeholder='{\n  "key": "value"\n}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!config.url.trim()}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
