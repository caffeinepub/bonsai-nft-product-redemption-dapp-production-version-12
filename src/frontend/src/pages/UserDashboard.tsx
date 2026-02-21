import { useUserNFTs, useGetRedemptionHistory, useGetLeaderboard, useIsLeaderboardVisible, useBurnNFT, useGetCallerUserProfile, getMediaAssetDisplayUrl } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Gift, History, Trophy, CheckCircle, AlertCircle, Flame, Shield, Package, Hash, Wallet, Copy, Check, User, BookUser, Activity, Edit } from 'lucide-react';
import { useState } from 'react';
import type { NFTData } from '../backend';
import { Separator } from '@/components/ui/separator';
import SVGForgeLayer from '../components/SVGForgeLayer';
import ProfileEditModal from '../components/ProfileEditModal';
import AddressBookModal from '../components/AddressBookModal';
import TransparencyDashboard from '../components/TransparencyDashboard';
import { toast } from 'sonner';

type View = 'home' | 'admin' | 'user' | 'trophy';

interface UserDashboardProps {
  onNavigate: (view: View) => void;
}

export default function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userNFTs, isLoading: nftsLoading, error: nftsError } = useUserNFTs();
  const { data: redemptionHistory, isLoading: redemptionLoading } = useGetRedemptionHistory();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard();
  const { data: leaderboardVisible } = useIsLeaderboardVisible();
  const { mutate: burnNFT, isPending: isBurning } = useBurnNFT();

  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showAddressBookModal, setShowAddressBookModal] = useState(false);
  const [showTransparencyDashboard, setShowTransparencyDashboard] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const principalId = identity?.getPrincipal().toString() || '';

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(principalId);
    setCopiedPrincipal(true);
    toast.success('Principal ID copied to clipboard');
    setTimeout(() => setCopiedPrincipal(false), 2000);
  };

  const handleRedeemNFT = () => {
    if (selectedNFT) {
      burnNFT(selectedNFT.id, {
        onSuccess: () => {
          setShowRedeemDialog(false);
          setSelectedNFT(null);
        },
      });
    }
  };

  const NFTCard = ({ nft }: { nft: NFTData }) => {
    const imageUrl = nft.media_assets && nft.media_assets.length > 0 
      ? getMediaAssetDisplayUrl(nft.media_assets[0])
      : '/assets/generated/mystery-box.dim_300x300.jpg';

    return (
      <Card className="group relative overflow-hidden border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                {nft.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {nft.collection}
              </CardDescription>
            </div>
            {nft.verified && (
              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border/50">
            <img
              src={imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-medium">Product:</span>
              <span>{nft.product}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4 text-primary" />
              <span className="font-medium">Token ID:</span>
              <span className="font-mono">{nft.id.toString()}</span>
            </div>

            {nft.provenance && (
              <>
                <Separator className="my-2" />
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3 text-primary" />
                    Provenance Details
                  </div>
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="font-medium">{nft.provenance.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch:</span>
                      <span className="font-mono text-xs">{nft.provenance.batchNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-xs">
                        {new Date(Number(nft.provenance.creationDate) / 1000000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {nft.discountCode && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md border border-primary/20">
                  <span className="text-xs font-medium text-muted-foreground">Discount Code:</span>
                  <code className="text-sm font-bold text-primary">{nft.discountCode}</code>
                </div>
              </>
            )}
          </div>

          <Button
            onClick={() => {
              setSelectedNFT(nft);
              setShowRedeemDialog(true);
            }}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            <Gift className="h-4 w-4 mr-2" />
            Redeem NFT
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SVGForgeLayer />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              My Forge Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your NFT collection and rewards</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileEditModal(true)}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressBookModal(true)}
              className="border-primary/30 hover:bg-primary/10"
            >
              <BookUser className="h-4 w-4 mr-2" />
              Address Book
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransparencyDashboard(true)}
              className="border-primary/30 hover:bg-primary/10"
            >
              <Activity className="h-4 w-4 mr-2" />
              Transparency
            </Button>
          </div>
        </div>

        <Card className="mb-8 border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  {userProfile?.profileImage ? (
                    <AvatarImage src={getMediaAssetDisplayUrl(userProfile.profileImage)} alt={userProfile.displayName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {userProfile?.displayName || 'Anonymous Forger'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono break-all max-w-md">
                    {principalId}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPrincipal}
                className="hover:bg-primary/10"
              >
                {copiedPrincipal ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">NFTs Owned</p>
                <p className="text-3xl font-bold text-primary">{userNFTs?.length || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground mb-1">NFTs Redeemed</p>
                <p className="text-3xl font-bold text-accent">{redemptionHistory?.length || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Rewards</p>
                <p className="text-3xl font-bold text-secondary">{(userNFTs?.length || 0) + (redemptionHistory?.length || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="collection" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gift className="h-4 w-4 mr-2" />
              My Collection
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4 mr-2" />
              Redemption History
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-4">
            {nftsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : nftsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load your NFT collection. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            ) : userNFTs && userNFTs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userNFTs.map((nft) => (
                  <NFTCard key={nft.id.toString()} nft={nft} />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-border/50 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Gift className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No NFTs in your collection yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Start your journey by acquiring your first NFT. Check back soon for new drops!
                  </p>
                  <Button
                    onClick={() => onNavigate('home')}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Explore NFTs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {redemptionLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : redemptionHistory && redemptionHistory.length > 0 ? (
              <div className="space-y-4">
                {redemptionHistory.map((record, index) => (
                  <Card key={index} className="border-2 border-border/50 bg-card/80 backdrop-blur-sm hover:border-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-accent" />
                            {record.metadata.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Redeemed on {new Date(Number(record.timestamp) / 1000000).toLocaleDateString()}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-accent/30 text-accent">
                              {record.metadata.collection}
                            </Badge>
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {record.metadata.product}
                            </Badge>
                          </div>
                        </div>
                        {record.metadata.media_assets && record.metadata.media_assets.length > 0 && (
                          <div className="ml-4 w-20 h-20 rounded-lg overflow-hidden border-2 border-border/50">
                            <img
                              src={getMediaAssetDisplayUrl(record.metadata.media_assets[0])}
                              alt={record.metadata.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-border/50 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No redemption history</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You haven't redeemed any NFTs yet. Redeem your NFTs to unlock exclusive rewards!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            {!leaderboardVisible ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The leaderboard is currently hidden by the administrator.
                </AlertDescription>
              </Alert>
            ) : leaderboardLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ) : leaderboard && leaderboard.length > 0 ? (
              <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-primary" />
                    Top Forgers
                  </CardTitle>
                  <CardDescription>Users ranked by total NFTs redeemed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map(([principal, count], index) => (
                      <div
                        key={principal.toString()}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          index === 0
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30'
                            : 'bg-muted/50 border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                              index === 0
                                ? 'bg-primary text-primary-foreground'
                                : index === 1
                                ? 'bg-accent text-accent-foreground'
                                : index === 2
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-mono text-sm text-muted-foreground break-all max-w-xs">
                              {principal.toString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                          {count.toString()} NFTs
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-border/50 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No leaderboard data</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Be the first to redeem NFTs and claim your spot on the leaderboard!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Redeem NFT
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this NFT? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedNFT && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {selectedNFT.media_assets && selectedNFT.media_assets.length > 0 && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-border/50">
                    <img
                      src={getMediaAssetDisplayUrl(selectedNFT.media_assets[0])}
                      alt={selectedNFT.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">{selectedNFT.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedNFT.collection}</p>
                </div>
              </div>
              {selectedNFT.discountCode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your discount code: <code className="font-bold text-primary">{selectedNFT.discountCode}</code>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRedeemDialog(false)}
              disabled={isBurning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeemNFT}
              disabled={isBurning}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isBurning ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileEditModal
        open={showProfileEditModal}
        onOpenChange={setShowProfileEditModal}
      />

      <AddressBookModal
        open={showAddressBookModal}
        onOpenChange={setShowAddressBookModal}
      />

      <TransparencyDashboard
        open={showTransparencyDashboard}
        onOpenChange={setShowTransparencyDashboard}
      />
    </div>
  );
}
