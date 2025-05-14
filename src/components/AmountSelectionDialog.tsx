import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { CreditCard, Check, AlertTriangle } from 'lucide-react';

interface AmountSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: string, ratePerSecond: string) => void;
  isLoading: boolean;
}

const AmountSelectionDialog: React.FC<AmountSelectionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}) => {
  const [amount, setAmount] = useState('0.1');
  const [ratePerSecond, setRatePerSecond] = useState('0.0001');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Validate amount is a number and within reasonable range
    if (value === '' || isNaN(Number(value))) {
      setError('Please enter a valid number');
    } else if (Number(value) <= 0) {
      setError('Amount must be greater than 0');
    } else if (Number(value) > 10) {
      setError('For safety, maximum amount is 10 ETH');
    } else {
      setError(null);
    }
    setAmount(value);
  };

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0].toString());
    setError(null);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isNaN(Number(value))) {
      setError('Please enter a valid number for rate');
    } else if (Number(value) <= 0) {
      setError('Rate must be greater than 0');
    } else {
      setError(null);
    }
    setRatePerSecond(value);
  };

  const handleConfirm = () => {
    if (error) return;
    
    // Convert to appropriate values
    const amountValue = amount || '0.1';
    const rateValue = ratePerSecond || '0.0001';
    
    onConfirm(amountValue, rateValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Set AI Delegation Amount</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose how much ETH the AI can use for trading on your behalf
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-700/50 rounded-md space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>Maximum Amount (ETH)</span>
              <span className="text-blue-300">{amount} ETH</span>
            </label>
            <Slider
              value={[Number(amount)]}
              max={1}
              min={0.01}
              step={0.01}
              onValueChange={handleSliderChange}
              className="my-4"
            />
            <Input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.1"
              className="bg-gray-700 border-gray-600 mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the maximum amount of ETH that the AI can use for trading
            </p>
          </div>
          
          <div className="p-4 bg-gray-700/50 rounded-md space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>Rate Per Second (ETH/s)</span>
              <span className="text-blue-300">{ratePerSecond} ETH/s</span>
            </label>
            <Input
              type="number"
              value={ratePerSecond}
              onChange={handleRateChange}
              placeholder="0.0001"
              className="bg-gray-700 border-gray-600 mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              This limits how fast the AI can use your funds
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/30 rounded-md border border-red-700/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          
          <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/30">
            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">What does this mean?</p>
                <p>By granting this permission, the AI can use up to {amount} ETH for trading, at a maximum rate of {ratePerSecond} ETH per second.</p>
                <p className="mt-1">You can revoke this permission at any time.</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleConfirm}
            disabled={!!error || isLoading}
            isLoading={isLoading}
            loadingText="Confirming..."
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Delegation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AmountSelectionDialog; 