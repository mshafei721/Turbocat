'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface APIPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function APIPanel({ onInsert, onClose }: APIPanelProps) {
  const [config, setConfig] = useState({
    baseUrl: 'https://api.example.com',
    authType: 'none',
    method: 'GET',
  });

  const handleSubmit = () => {
    if (!config.baseUrl.trim()) {
      return; // Validation: require base URL
    }

    const authText = config.authType === 'none' ? 'no' : config.authType;
    const prompt = `Add API integration for ${config.baseUrl} with ${authText} authentication using ${config.method} method`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add API Integration</h3>
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
            <Label htmlFor="baseUrl" className="mb-2 block">Base URL:</Label>
            <Input
              id="baseUrl"
              type="url"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <Label className="mb-2 block">Authentication Type:</Label>
            <RadioGroup
              value={config.authType}
              onValueChange={(value) => setConfig({ ...config, authType: value })}
            >
              {[
                { value: 'none', label: 'None' },
                { value: 'API Key', label: 'API Key' },
                { value: 'Bearer Token', label: 'Bearer Token' },
                { value: 'OAuth', label: 'OAuth' },
              ].map((auth) => (
                <div key={auth.value} className="flex items-center gap-2">
                  <RadioGroupItem value={auth.value} id={`auth-${auth.value}`} />
                  <Label htmlFor={`auth-${auth.value}`}>{auth.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">HTTP Method:</Label>
            <RadioGroup
              value={config.method}
              onValueChange={(value) => setConfig({ ...config, method: value })}
            >
              {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <RadioGroupItem value={method} id={`method-${method}`} />
                  <Label htmlFor={`method-${method}`}>{method}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!config.baseUrl.trim()}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
