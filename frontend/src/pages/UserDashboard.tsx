import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useUserNFTs,
  useGetRedemptionHistory,
  useGetLeaderboard,
  useBurnNFT,
  useTransferNFT,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import type { PublicNFTData, RedemptionRecord } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Flame,
  Trophy,
  Package,
  Clock,
  Loader2,
  Shield,
  Send,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import NFTDetailModal from '../components/NFTDetailModal';
import RedemptionConfirmationModal from '../components/RedemptionConfirmationModal';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

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

export default function UserDashboard() {
  const { identity } = useInternetIdentity();
  const { data: userNFTs, isLoading: nftsLoading } = useUserNFTs();
  const { data: redemptionHistory, isLoading: historyLoading } = useGetRedemptionHistory();
  const { data: leaderboard } = useGetLeaderboard();
  const { data: userProfile } = useGetCallerUserProfile();

  const burnMutation = useBurnNFT();
  const transferMutation = useTransferNFT();

  // NFT detail modal
  const [selectedNFT, setSelectedNFT] = useState<PublicNFTData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Burn/redeem confirmation dialog
  const [burnConfirmNFT, setBurnConfirmNFT] = useState<PublicNFTData | null>(null);
  const [burnDialogOpen, setBurnDialogOpen] = useState(false);

  // Redemption success modal — discount code shown ONLY here
  const [redemptionResult, setRedemptionResult] = useState<{
    discountCode: string;
    nftName: string;
    nftProduct: string;
    timestamp: number;
  } | null>(null);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);

  // Transfer dialog
  const [transferNFT, setTransferNFT] = useState<PublicNFTData | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');

  const handleOpenDetail = (nft: PublicNFTData) => {
    setSelectedNFT(nft);
    setDetailModalOpen(true);
  };

  const handleBurnClick = (nft: PublicNFTData) => {
    setBurnConfirmNFT(nft);
    setBurnDialogOpen(true);
  };

  const handleConfirmBurn = async () => {
    if (!burnConfirmNFT) return;
    try {
      const discountCode = await burnMutation.mutateAsync(burnConfirmNFT.id);
      setBurnDialogOpen(false);
      setRedemptionResult({
        discountCode,
        nftName: burnConfirmNFT.name,
        nftProduct: burnConfirmNFT.product,
        timestamp: Date.now(),
      });
      setRedemptionModalOpen(true);
      setBurnConfirmNFT(null);
    } catch {
      // error handled by mutation onError toast
    }
  };

  const handleTransferClick = (nft: PublicNFTData) => {
    setTransferNFT(nft);
    setTransferAddress('');
    setTransferDialogOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!transferNFT || !transferAddress.trim()) return;
    try {
      const principal = Principal.fromText(transferAddress.trim());
      await transferMutation.mutateAsync({ nftId: transferNFT.id, to: principal });
      setTransferDialogOpen(false);
      setTransferNFT(null);
      setTransferAddress('');
    } catch (err: any) {
      if (err?.message?.includes('Invalid')) {
        toast.error('Invalid Principal ID format');
      }
      // other errors handled by mutation onError
    }
  };

  const principalStr = identity?.getPrincipal().toString() ?? '';

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Flame className="w-8 h-8 text-primary" />
            My Forge Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back,{' '}
            <span className="text-foreground font-semibold">
              {userProfile?.displayName ?? shortPrincipal(identity?.getPrincipal())}
            </span>
          </p>
        </div>

        <Tabs defaultValue="collection">
          <TabsList className="mb-6 bg-muted/40">
            <TabsTrigger value="collection">
              <Package className="w-4 h-4 mr-2" />
              My Collection
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              Redemption History
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Collection Tab */}
          <TabsContent value="collection">
            {nftsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : !userNFTs || userNFTs.length === 0 ? (
              <Card className="border-dashed border-primary/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold text-foreground">No NFTs in your collection</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    NFTs minted by admins will appear here once assigned to your wallet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userNFTs.map((nft) => (
                  <NFTCard
                    key={nft.id.toString()}
                    nft={nft}
                    onViewDetail={handleOpenDetail}
                    onBurn={handleBurnClick}
                    onTransfer={handleTransferClick}
                    isBurning={burnMutation.isPending && burnConfirmNFT?.id === nft.id}
                    isTransferring={transferMutation.isPending && transferNFT?.id === nft.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Redemption History Tab */}
          <TabsContent value="history">
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : !redemptionHistory || redemptionHistory.length === 0 ? (
              <Card className="border-dashed border-primary/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold text-foreground">No redemptions yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Redeemed NFTs will appear here with their discount codes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {redemptionHistory.map((record, i) => (
                  <RedemptionHistoryCard key={i} record={record} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Top Redeemers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!leaderboard || leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Leaderboard is empty or hidden.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 20).map(([principal, count], i) => {
                      const isMe = principal.toString() === principalStr;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                            isMe
                              ? 'bg-primary/15 border border-primary/30'
                              : 'bg-muted/30'
                          }`}
                        >
                          <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                            {i + 1}
                          </span>
                          <span className="font-mono text-sm text-foreground flex-1 truncate">
                            {isMe ? (
                              <span className="text-primary font-semibold">
                                {userProfile?.displayName ?? 'You'}
                              </span>
                            ) : (
                              shortPrincipal(principal)
                            )}
                          </span>
                          <Badge variant="secondary">
                            {count.toString()} redeemed
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* NFT Detail Modal — provenance only, no discount code */}
      <NFTDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedNFT(null);
        }}
        nft={selectedNFT}
      />

      {/* Burn Confirmation Dialog */}
      <Dialog
        open={burnDialogOpen}
        onOpenChange={(o) => {
          if (!o) setBurnDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-sm bg-background border border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Redeem NFT
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem{' '}
              <span className="font-semibold text-foreground">{burnConfirmNFT?.name}</span>? This
              action is irreversible. Your discount code will be revealed upon confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBurnDialogOpen(false)}
              disabled={burnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBurn}
              disabled={burnMutation.isPending}
            >
              {burnMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redeeming…
                </>
              ) : (
                'Redeem & Reveal Code'
              )}
            </Button>
          </DialogFooter>
          {burnMutation.isError && (
            <p className="text-xs text-destructive mt-2">
              {(burnMutation.error as Error)?.message ?? 'Redemption failed. Please try again.'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialogOpen}
        onOpenChange={(o) => {
          if (!o) setTransferDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-sm bg-background border border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Transfer NFT
            </DialogTitle>
            <DialogDescription>
              Transfer{' '}
              <span className="font-semibold text-foreground">{transferNFT?.name}</span> to another
              wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="transfer-address" className="text-sm text-muted-foreground mb-1 block">
                Recipient Principal ID
              </Label>
              <Input
                id="transfer-address"
                placeholder="e.g. aaaaa-aa"
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                className="font-mono text-sm"
                disabled={transferMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTransferDialogOpen(false)}
              disabled={transferMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={transferMutation.isPending || !transferAddress.trim()}
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Transferring…
                </>
              ) : (
                'Transfer'
              )}
            </Button>
          </DialogFooter>
          {transferMutation.isError && (
            <p className="text-xs text-destructive mt-2">
              {(transferMutation.error as Error)?.message ?? 'Transfer failed. Please try again.'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Redemption Confirmation Modal — discount code shown ONLY here */}
      {redemptionResult && (
        <RedemptionConfirmationModal
          open={redemptionModalOpen}
          onClose={() => {
            setRedemptionModalOpen(false);
            setRedemptionResult(null);
          }}
          discountCode={redemptionResult.discountCode}
          nftName={redemptionResult.nftName}
          nftProduct={redemptionResult.nftProduct}
          redemptionTimestamp={redemptionResult.timestamp * 1_000_000}
        />
      )}
    </div>
  );
}

// ─── NFT Card ────────────────────────────────────────────────────────────────

interface NFTCardProps {
  nft: PublicNFTData;
  onViewDetail: (nft: PublicNFTData) => void;
  onBurn: (nft: PublicNFTData) => void;
  onTransfer: (nft: PublicNFTData) => void;
  isBurning: boolean;
  isTransferring: boolean;
}

function NFTCard({ nft, onViewDetail, onBurn, onTransfer, isBurning, isTransferring }: NFTCardProps) {
  const imageUrl = nft.media_assets.length > 0 ? nft.media_assets[0].getDirectURL() : null;

  return (
    <Card
      className="border border-primary/20 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={() => onViewDetail(nft)}
    >
      {/* Image */}
      <div className="relative h-44 bg-muted/30 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        {nft.mystery && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-2xl">🎁</span>
          </div>
        )}
        {nft.redeemed && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="text-xs">
              Redeemed
            </Badge>
          </div>
        )}
        {nft.verified && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="text-xs gap-1">
              <Shield className="w-2.5 h-2.5" /> Verified
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-foreground truncate">{nft.name}</h3>
        <p className="text-xs text-muted-foreground truncate mb-1">{nft.collection}</p>
        <p className="text-xs text-muted-foreground truncate mb-3">{nft.product}</p>

        {/* Actions — stop propagation so card click doesn't fire */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onViewDetail(nft)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Provenance
          </Button>
          {!nft.redeemed && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onTransfer(nft)}
                disabled={isTransferring}
              >
                <Send className="w-3 h-3" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => onBurn(nft)}
                disabled={isBurning}
              >
                {isBurning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Flame className="w-3 h-3" />
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Redemption History Card ──────────────────────────────────────────────────

function RedemptionHistoryCard({ record }: { record: RedemptionRecord }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.discountCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="border border-border/50 bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground truncate">{record.metadata.name}</p>
              <Badge variant="destructive" className="text-xs shrink-0">
                Redeemed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{record.metadata.product}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(record.timestamp)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowCode((v) => !v)}
            >
              {showCode ? 'Hide Code' : 'Show Code'}
            </Button>
          </div>
        </div>

        {showCode && (
          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-widest text-foreground flex-1 select-all">
              {record.discountCode}
            </span>
            <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={handleCopy}>
              {copied ? <span className="text-primary">Copied!</span> : 'Copy'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
