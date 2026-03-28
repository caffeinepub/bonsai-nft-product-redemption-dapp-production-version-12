import React from 'react';
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
import {
  Shield,
  Clock,
  User,
  ArrowRight,
  Package,
  Hash,
  Award,
  Loader2,
} from 'lucide-react';
import type { PublicNFTData, PublicTransactionRecord } from '../backend';
import { TransactionType } from '../backend';
import { useGetNFTTransactionHistory } from '../hooks/useQueries';

interface NFTDetailModalProps {
  open: boolean;
  onClose: () => void;
  nft: PublicNFTData | null;
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

export default function NFTDetailModal({ open, onClose, nft }: NFTDetailModalProps) {
  const nftId = nft ? nft.id : null;
  const { data: txHistory, isLoading: txLoading } = useGetNFTTransactionHistory(nftId);

  if (!nft) return null;

  const imageUrl = nft.media_assets.length > 0
    ? nft.media_assets[0].getDirectURL()
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl bg-background border border-primary/30 shadow-2xl p-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header with image */}
          <div className="relative">
            {imageUrl ? (
              <div className="h-40 overflow-hidden">
                <img
                  src={imageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
            ) : (
              <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground drop-shadow-lg">
                  {nft.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {nft.collection} · {nft.product}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            <div className="space-y-5 pt-2">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {nft.verified && (
                  <Badge variant="default" className="gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </Badge>
                )}
                {nft.redeemed && (
                  <Badge variant="destructive" className="gap-1">
                    Redeemed
                  </Badge>
                )}
                {nft.mystery && (
                  <Badge variant="secondary" className="gap-1">
                    Mystery
                  </Badge>
                )}
                <Badge variant="outline">{nft.asset_class}</Badge>
                <Badge variant="outline">{nft.certification}</Badge>
              </div>

              <Separator className="bg-border/50" />

              {/* NFT Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">NFT ID</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground">#{nft.id.toString()}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Issued</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{nft.issue_date}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Batch</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {nft.provenance.batchNumber}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Provenance ID</span>
                  </div>
                  <p className="font-mono text-xs font-semibold text-foreground truncate">
                    {nft.provenance_id}
                  </p>
                </div>
              </div>

              {/* Current Owner */}
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Current Owner</span>
                </div>
                <p className="font-mono text-sm text-foreground break-all">{nft.owner.toString()}</p>
              </div>

              {/* Manufacturer Details */}
              {nft.manufacturer_details && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Manufacturer</p>
                  <p className="text-sm text-foreground">{nft.manufacturer_details}</p>
                </div>
              )}

              {/* Provenance Attributes */}
              {nft.provenance.attributes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Attributes</p>
                  <div className="flex flex-wrap gap-2">
                    {nft.provenance.attributes.map((attr, i) => (
                      <div key={i} className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
                        <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                        <p className="text-sm font-semibold text-foreground">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Transaction / Provenance History */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Provenance History
                </h3>

                {txLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading history…</span>
                  </div>
                ) : !txHistory || txHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transaction history found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {txHistory.map((tx: PublicTransactionRecord, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg bg-muted/20 border border-border/50 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={txTypeBadgeVariant(tx.transactionType)} className="text-xs">
                            {txTypeLabel(tx.transactionType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(tx.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
