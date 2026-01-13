'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentPanelProps {
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export function PaymentPanel({ onInsert, onClose }: PaymentPanelProps) {
  const [config, setConfig] = useState({
    provider: 'Stripe',
    currency: 'USD',
    products: 'subscription plans',
  });

  const handleSubmit = () => {
    if (!config.products.trim()) {
      return; // Validation: require products description
    }

    const prompt = `Add ${config.provider} payment processing in ${config.currency} for ${config.products}`;
    onInsert(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Payment Processing</h3>
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
            <Label className="mb-2 block">Payment Provider:</Label>
            <RadioGroup
              value={config.provider}
              onValueChange={(value) => setConfig({ ...config, provider: value })}
            >
              {['Stripe', 'PayPal'].map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  <RadioGroupItem value={provider} id={`provider-${provider}`} />
                  <Label htmlFor={`provider-${provider}`}>{provider}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="currency" className="mb-2 block">Currency:</Label>
            <Select value={config.currency} onValueChange={(value) => setConfig({ ...config, currency: value })}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="products" className="mb-2 block">Products/Services:</Label>
            <Input
              id="products"
              type="text"
              value={config.products}
              onChange={(e) => setConfig({ ...config, products: e.target.value })}
              placeholder="e.g., subscription plans, one-time purchases"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!config.products.trim()}>
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
