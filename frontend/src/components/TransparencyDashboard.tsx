import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  ArrowRight,
  Shield,
  Flame,
  Package,
  Activity,
} from 'lucide-react';
import { useGetTransactionHistory, useGetAllTransactionHistory } from '../hooks/useQueries';
import type { PublicTransactionRecord, TransactionRecord } from '../backend';
import { TransactionType } from '../backend';
import { ExternalBlob } from '../backend';

interface TransparencyDashboardProps {
  open: boolean;
  onClose: () => void;
  adminMode?: boolean;
}

function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) / 1_000_000 : ts;
  return new Date(ms).toLocaleString();
}

function shortPrincipal(p: { toString(): string } | undefined | null): string {
  if (!p) return 'Unknown';
  const s = p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function txTypeLabel(type: TransactionType): string {
  switch (type) {
    case TransactionType.mint: return 'Minted';
    case TransactionType.transfer: return 'Transferred';
    case TransactionType.burn: return 'Redeemed';
    default: return String(type);
  }
}

function txTypeBadgeVariant(type: TransactionType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case TransactionType.mint: return 'default';
    case TransactionType.transfer: return 'secondary';
    case TransactionType.burn: return 'destructive';
    default: return 'outline';
  }
}

function txTypeIcon(type: TransactionType) {
  switch (type) {
    case TransactionType.mint: return <Package className="w-4 h-4 text-primary" />;
    case TransactionType.transfer: return <ArrowRight className="w-4 h-4 text-accent" />;
    case TransactionType.burn: return <Flame className="w-4 h-4 text-destructive" />;
    default: return <Activity className="w-4 h-4" />;
  }
}

function getMediaAssetDisplayUrl(asset: ExternalBlob): string {
  return asset.getDirectURL();
}

function UserTransactionList() {
  const { data: history, isLoading } = useGetTransactionHistory();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-3">
      {sorted.map((tx: PublicTransactionRecord, i: number) => (
        <TransactionCard key={i} tx={tx} />
      ))}
    </div>
  );
}

function AdminTransactionList() {
  const { data: history, isLoading } = useGetAllTransactionHistory();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-3">
      {sorted.map((tx: TransactionRecord, i: number) => (
        <TransactionCard key={i} tx={tx} />
      ))}
    </div>
  );
}

interface TransactionCardProps {
  tx: PublicTransactionRecord | TransactionRecord;
}

function TransactionCard({ tx }: TransactionCardProps) {
  const imageUrl = tx.metadata.media_assets.length > 0
    ? getMediaAssetDisplayUrl(tx.metadata.media_assets[0])
    : null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={tx.metadata.name}
            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border/50"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {txTypeIcon(tx.transactionType)}
            <span className="font-semibold text-foreground truncate">{tx.metadata.name}</span>
            <Badge variant={txTypeBadgeVariant(tx.transactionType)} className="text-xs shrink-0">
              {txTypeLabel(tx.transactionType)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">
            {tx.metadata.collection} · {tx.metadata.product}
          </p>

          {/* Transfer chain */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            {tx.from ? (
              <>
                <span className="font-mono bg-muted/50 rounded px-1.5 py-0.5">
                  {shortPrincipal(tx.from)}
                </span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </>
            ) : null}
            {tx.to ? (
              <span className="font-mono bg-muted/50 rounded px-1.5 py-0.5">
                {shortPrincipal(tx.to)}
              </span>
            ) : (
              <span className="italic text-muted-foreground/60">burned</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</p>
          <p className="text-xs text-muted-foreground mt-1">NFT #{tx.nftId.toString()}</p>
          {tx.metadata.verified && (
            <div className="flex items-center gap-1 justify-end mt-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary">Verified</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransparencyDashboard({ open, onClose, adminMode = false }: TransparencyDashboardProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl bg-background border border-primary/30 shadow-2xl p-0 overflow-hidden">
        <div className="flex flex-col max-h-[85vh]">
          <div className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {adminMode ? 'All Transaction History' : 'My Transaction History'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {adminMode
                  ? 'Complete on-chain provenance record for all NFTs.'
                  : 'Your complete on-chain provenance and transaction record.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            {adminMode ? <AdminTransactionList /> : <UserTransactionList />}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
