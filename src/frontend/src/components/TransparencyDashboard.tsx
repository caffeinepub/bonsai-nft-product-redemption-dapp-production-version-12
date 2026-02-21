import { useGetTransactionHistory, useGetAllTransactionHistory, useIsCallerAdmin, getMediaAssetDisplayUrl } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Flame, Send, Sparkles } from 'lucide-react';
import type { TransactionRecord, TransactionType } from '../backend';

interface TransparencyDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransparencyDashboard({ open, onOpenChange }: TransparencyDashboardProps) {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: userTransactions, isLoading: userLoading } = useGetTransactionHistory();
  const { data: allTransactions, isLoading: allLoading } = useGetAllTransactionHistory();

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'mint':
        return <Sparkles className="h-4 w-4 text-primary animate-flicker" />;
      case 'burn':
        return <Flame className="h-4 w-4 text-destructive animate-flicker" />;
      case 'transfer':
        return <Send className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionBadgeVariant = (type: TransactionType): "default" | "destructive" | "secondary" => {
    switch (type) {
      case 'mint':
        return 'default';
      case 'burn':
        return 'destructive';
      case 'transfer':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const renderTransactionList = (transactions: TransactionRecord[] | undefined, loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!transactions || transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-ember-float" />
          <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p className="text-sm text-muted-foreground">
            Transaction history will appear here once NFTs are minted, burned, or transferred
          </p>
        </div>
      );
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => 
      Number(b.timestamp) - Number(a.timestamp)
    );

    return (
      <div className="space-y-3">
        {sortedTransactions.map((tx, index) => (
          <Card
            key={`${tx.nftId}-${tx.timestamp}-${index}`}
            className="border-primary/20 card-fiery-hover animate-glow-entrance"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="py-4">
              <div className="space-y-3">
                {/* Transaction Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getTransactionIcon(tx.transactionType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getTransactionBadgeVariant(tx.transactionType)} className="capitalize">
                          {tx.transactionType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          NFT #{tx.nftId.toString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NFT Details */}
                <div className="bg-muted/50 p-3 rounded-lg space-y-2 border border-primary/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{tx.metadata.name}</h4>
                      <p className="text-xs text-muted-foreground">{tx.metadata.collection}</p>
                    </div>
                    {tx.metadata.media_assets.length > 0 && (
                      <img
                        src={getMediaAssetDisplayUrl(tx.metadata.media_assets[0])}
                        alt={tx.metadata.name}
                        className="w-12 h-12 object-cover rounded border border-primary/20"
                      />
                    )}
                  </div>

                  {/* Provenance Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground">Product: </span>
                      <span className="font-medium">{tx.metadata.provenance.productName || tx.metadata.product}</span>
                    </div>
                    {tx.metadata.provenance.batchNumber && (
                      <div>
                        <span className="text-muted-foreground">Batch: </span>
                        <span className="font-mono">{tx.metadata.provenance.batchNumber}</span>
                      </div>
                    )}
                    {tx.metadata.provenance_id && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Provenance ID: </span>
                        <span className="font-mono">{tx.metadata.provenance_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Participants */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex-1">
                    <span className="text-muted-foreground">User: </span>
                    <span className="font-mono">{tx.user.toString().slice(0, 12)}...</span>
                  </div>
                  {tx.from && (
                    <div className="flex-1">
                      <span className="text-muted-foreground">From: </span>
                      <span className="font-mono">{tx.from.toString().slice(0, 12)}...</span>
                    </div>
                  )}
                  {tx.to && (
                    <div className="flex-1">
                      <span className="text-muted-foreground">To: </span>
                      <span className="font-mono">{tx.to.toString().slice(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl border-primary/20 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-ember-float" />
            Transparency Dashboard
          </DialogTitle>
          <DialogDescription>
            Complete chronological history of all NFT transactions with provenance data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={isAdmin ? "all" : "mine"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-primary/20">
            <TabsTrigger value="mine">My Transactions</TabsTrigger>
            {isAdmin && <TabsTrigger value="all">All Transactions</TabsTrigger>}
          </TabsList>

          <TabsContent value="mine" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {renderTransactionList(userTransactions, userLoading)}
            </ScrollArea>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {renderTransactionList(allTransactions, allLoading)}
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
