import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Check, Tag, Flame, Gift } from 'lucide-react';

interface RedemptionConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  discountCode: string;
  nftName: string;
  nftProduct: string;
  redemptionTimestamp?: number;
}

export default function RedemptionConfirmationModal({
  open,
  onClose,
  discountCode,
  nftName,
  nftProduct,
  redemptionTimestamp,
}: RedemptionConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = discountCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedTime = redemptionTimestamp
    ? new Date(redemptionTimestamp / 1_000_000).toLocaleString()
    : new Date().toLocaleString();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md bg-background border border-primary/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                NFT Redeemed!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Your discount code is ready to use
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT Info */}
          <div className="rounded-lg bg-muted/40 border border-border p-3 flex items-center gap-3">
            <Gift className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="font-semibold text-foreground text-sm">{nftName}</p>
              <p className="text-xs text-muted-foreground">{nftProduct}</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              Redeemed
            </Badge>
          </div>

          {/* Discount Code */}
          <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Your Discount Code
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background rounded-lg border border-primary/30 px-4 py-3">
                <span className="font-mono text-lg font-bold tracking-widest text-foreground select-all">
                  {discountCode}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="border-primary/40 hover:bg-primary/10 shrink-0"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-primary mt-1 ml-1">Copied to clipboard!</p>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">How to use your code:</p>
                <p>Enter this code at checkout to receive your exclusive discount on your next purchase.</p>
                <p className="text-muted-foreground/70">
                  Redeemed: {formattedTime}
                </p>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Save this code now — it will not be shown again after closing this window.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
