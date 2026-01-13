'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EnvPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function EnvPanel({ onInsert, onClose }: EnvPanelProps) {
  const [config, setConfig] = useState({
    variables: 'API_KEY\nDB_URL\nSECRET_TOKEN',
    encryption: true,
  });

  const handleSubmit = () => {
    if (!config.variables.trim()) {
      return; // Validation: require at least one variable
    }

    const varList = config.variables
      .split('\n')
      .filter((v) => v.trim())
      .join(', ');
    const encryptionText = config.encryption ? 'encrypted' : 'plain text';
    const prompt = `Add environment variables: ${varList} with ${encryptionText} storage`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Environment Variables</h3>
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
            <Label htmlFor="variables" className="mb-2 block">
              Variables (one per line):
            </Label>
            <Textarea
              id="variables"
              value={config.variables}
              onChange={(e) => setConfig({ ...config, variables: e.target.value })}
              placeholder="API_KEY&#10;DB_URL&#10;SECRET_TOKEN"
              rows={6}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="encryption"
              checked={config.encryption}
              onCheckedChange={(checked) => setConfig({ ...config, encryption: checked === true })}
            />
            <Label htmlFor="encryption">Enable encryption</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!config.variables.trim()}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
