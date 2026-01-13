'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FilePanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function FilePanel({ onInsert, onClose }: FilePanelProps) {
  const [config, setConfig] = useState({
    operations: ['read', 'write'],
    fileTypes: ['text', 'images'],
  });

  const handleSubmit = () => {
    if (config.operations.length === 0 || config.fileTypes.length === 0) {
      return; // Validation: require at least one operation and file type
    }

    const operations = config.operations.join(', ');
    const fileTypes = config.fileTypes.join(', ');
    const prompt = `Add file system access for ${operations} operations on ${fileTypes} files`;
    onInsert(prompt);
  };

  const toggleOperation = (operation: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, operations: [...config.operations, operation] });
    } else {
      setConfig({ ...config, operations: config.operations.filter((o) => o !== operation) });
    }
  };

  const toggleFileType = (fileType: string, checked: boolean) => {
    if (checked) {
      setConfig({ ...config, fileTypes: [...config.fileTypes, fileType] });
    } else {
      setConfig({ ...config, fileTypes: config.fileTypes.filter((f) => f !== fileType) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add File System Access</h3>
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
            <Label className="mb-2 block">Operations:</Label>
            <div className="space-y-2">
              {['read', 'write', 'delete'].map((operation) => (
                <div key={operation} className="flex items-center gap-2">
                  <Checkbox
                    id={`op-${operation}`}
                    checked={config.operations.includes(operation)}
                    onCheckedChange={(checked) => toggleOperation(operation, checked === true)}
                  />
                  <Label htmlFor={`op-${operation}`}>{operation.charAt(0).toUpperCase() + operation.slice(1)}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">File Types:</Label>
            <div className="space-y-2">
              {['text', 'images', 'documents', 'all'].map((fileType) => (
                <div key={fileType} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${fileType}`}
                    checked={config.fileTypes.includes(fileType)}
                    onCheckedChange={(checked) => toggleFileType(fileType, checked === true)}
                  />
                  <Label htmlFor={`type-${fileType}`}>{fileType.charAt(0).toUpperCase() + fileType.slice(1)}</Label>
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
            disabled={config.operations.length === 0 || config.fileTypes.length === 0}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
