import { useGetOwnedNFTs, useGetRedemptionHistory, useGetLeaderboard, useIsLeaderboardVisible, useBurnNFT, useGetCallerUserProfile, getMediaAssetDisplayUrl } from '../hooks/useQueries';
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
import type { ORIGYNMetadata } from '../backend';
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
  const { data: ownedNFTs, isLoading: nftsLoading } = useGetOwnedNFTs();
  const { data: redemptionHistory, isLoading: historyLoading } = useGetRedemptionHistory();
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard();
  const { data: leaderboardVisible } = useIsLeaderboardVisible();
  const { mutate: burnNFT, isPending: isBurning } = useBurnNFT();

  const [selectedNFT, setSelectedNFT] = useState<ORIGYNMetadata | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showProvenanceDialog, setShowProvenanceDialog] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);

  const handleRedeemClick = (nft: ORIGYNMetadata) => {
    setSelectedNFT(nft);
    setShowRedeemDialog(true);
  };

  const handleViewProvenance = (nft: ORIGYNMetadata) => {
    setSelectedNFT(nft);
    setShowProvenanceDialog(true);
  };

  const handleConfirmRedeem = () => {
    if (selectedNFT) {
      burnNFT(selectedNFT.id);
      setShowRedeemDialog(false);
      setSelectedNFT(null);
    }
  };

  const handleCopyPrincipal = async () => {
    if (userPrincipal) {
      try {
        await navigator.clipboard.writeText(userPrincipal);
        setCopiedPrincipal(true);
        toast.success('Principal ID copied to clipboard');
        setTimeout(() => setCopiedPrincipal(false), 2000);
      } catch (error) {
        toast.error('Failed to copy Principal ID');
      }
    }
  };

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const userPrincipal = isAuthenticated ? identity.getPrincipal().toString() : undefined;
  const userRank = leaderboard?.findIndex(([principal]) => principal.toString() === userPrincipal) ?? -1;
  const userRedemptions = redemptionHistory?.length ?? 0;

  const getNFTImage = (nft: ORIGYNMetadata) => {
    if (nft.media_assets.length > 0) {
      return getMediaAssetDisplayUrl(nft.media_assets[0]);
    }
    return nft.mystery
      ? '/assets/generated/mystery-box.dim_300x300.jpg'
      : '/assets/generated/discount-coupon.dim_600x400.jpg';
  };

  const maskPhysicalHash = (hash: string) => {
    if (!hash) return 'N/A';
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const profileImageUrl = userProfile?.profileImage?.getDirectURL();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert className="border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please login to view your NFT collection.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative">
      <SVGForgeLayer variant="subtle" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Profile Card */}
        <Card className="mb-8 border-primary/20 card-fiery-hover animate-glow-entrance">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/50">
                  <AvatarImage src={profileImageUrl} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{userProfile?.displayName || 'User'}</CardTitle>
                  {userProfile?.bio && (
                    <CardDescription className="mt-1">{userProfile.bio}</CardDescription>
                  )}
                  {userProfile?.forgeTheme && userProfile.forgeTheme !== 'default' && (
                    <Badge variant="outline" className="mt-2 capitalize">
                      {userProfile.forgeTheme} Theme
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileEdit(true)}
                className="gap-2 ember-glow"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-auto py-4 gap-3 border-primary/20 hover:border-primary card-fiery-hover"
            onClick={() => setShowAddressBook(true)}
          >
            <BookUser className="h-5 w-5 text-primary animate-ember-float" />
            <div className="text-left">
              <div className="font-semibold">Address Book</div>
              <div className="text-xs text-muted-foreground">Manage contacts</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 gap-3 border-primary/20 hover:border-primary card-fiery-hover"
            onClick={() => setShowTransparency(true)}
          >
            <Activity className="h-5 w-5 text-primary animate-flicker" />
            <div className="text-left">
              <div className="font-semibold">Transaction History</div>
              <div className="text-xs text-muted-foreground">View all transactions</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 gap-3 border-primary/20 hover:border-primary card-fiery-hover"
            onClick={handleCopyPrincipal}
          >
            {copiedPrincipal ? (
              <Check className="h-5 w-5 text-primary" />
            ) : (
              <Copy className="h-5 w-5 text-primary" />
            )}
            <div className="text-left">
              <div className="font-semibold">Copy Principal ID</div>
              <div className="text-xs text-muted-foreground">For receiving NFTs</div>
            </div>
          </Button>
        </div>

        {/* Wallet View */}
        <Card className="mb-8 border-primary/20 card-fiery-hover animate-glow-entrance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary animate-ember-float" />
              Your Wallet
            </CardTitle>
            <CardDescription>Your Internet Identity Principal ID for receiving NFT airdrops and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-primary/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
                <p className="font-mono text-sm break-all">{userPrincipal}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrincipal}
                className="flex-shrink-0 gap-2 ember-glow"
              >
                {copiedPrincipal ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Share this Principal ID to receive NFT airdrops and transfers from the admin or other users.
            </p>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 card-fiery-hover animate-glow-entrance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owned NFTs</CardTitle>
              <Gift className="h-4 w-4 text-primary animate-flicker" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-gradient">{ownedNFTs?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">Available to redeem</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
              <Flame className="h-4 w-4 text-accent animate-flicker" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-gradient">{userRedemptions}</div>
              <p className="text-xs text-muted-foreground">NFTs burned</p>
            </CardContent>
          </Card>

          <Card className="border-chart-1/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
              <Trophy className="h-4 w-4 text-chart-1 animate-flicker" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-gradient">
                {leaderboardVisible && userRank >= 0 ? `#${userRank + 1}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {leaderboardVisible ? 'Your position' : 'Leaderboard hidden'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-primary/20">
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="history">Redemption History</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Collection Tab */}
          <TabsContent value="collection" className="space-y-4">
            {nftsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-40 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ownedNFTs && ownedNFTs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedNFTs.map((nft, index) => (
                  <Card 
                    key={nft.id.toString()} 
                    className="overflow-hidden border-2 border-primary/20 card-fiery-hover animate-glow-entrance"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{nft.name}</CardTitle>
                          <CardDescription>{nft.collection}</CardDescription>
                        </div>
                        {nft.verified && (
                          <Badge variant="default" className="gap-1 animate-gold-pulse">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center relative group">
                        <img
                          src={getNFTImage(nft)}
                          alt={nft.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Product:</span>
                          <span className="font-medium">{nft.provenance.productName || nft.product}</span>
                        </div>
                        {nft.asset_class && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Asset Class:</span>
                            <span className="font-medium text-xs">{nft.asset_class}</span>
                          </div>
                        )}
                        {nft.provenance.batchNumber && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Batch:</span>
                            <span className="font-mono text-xs">{nft.provenance.batchNumber}</span>
                          </div>
                        )}
                        {nft.provenance.physicalHash && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hash:</span>
                            <span className="font-mono text-xs">{maskPhysicalHash(nft.provenance.physicalHash)}</span>
                          </div>
                        )}
                        {nft.certification && (
                          <Badge variant="outline" className="w-full justify-center gap-1">
                            <Shield className="h-3 w-3" />
                            {nft.certification}
                          </Badge>
                        )}
                        {nft.mystery && (
                          <Badge variant="secondary" className="w-full justify-center animate-shimmer-wave">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Mystery Reward
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewProvenance(nft)}
                          className="flex-1 gap-2"
                          variant="outline"
                          size="sm"
                        >
                          <Package className="h-4 w-4" />
                          Provenance
                        </Button>
                        <Button
                          onClick={() => handleRedeemClick(nft)}
                          className="flex-1 gap-2 ember-glow"
                          variant="default"
                          size="sm"
                        >
                          <Flame className="h-4 w-4 animate-flicker" />
                          Redeem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Gift className="h-16 w-16 text-muted-foreground mb-4 animate-ember-float" />
                  <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You don't have any NFTs in your collection yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {historyLoading ? (
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ) : redemptionHistory && redemptionHistory.length > 0 ? (
              <div className="space-y-4">
                {redemptionHistory.map((record, index) => (
                  <Card 
                    key={record.nftId.toString()} 
                    className="border-primary/20 card-fiery-hover animate-glow-entrance"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {record.metadata.media_assets.length > 0 && (
                            <div className="relative">
                              <img
                                src={getMediaAssetDisplayUrl(record.metadata.media_assets[0])}
                                alt={record.metadata.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent rounded" />
                            </div>
                          )}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{record.metadata.name}</h4>
                              <Badge variant="outline">{record.metadata.collection}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Product: {record.metadata.provenance.productName || record.metadata.product}
                            </p>
                            {record.metadata.provenance.batchNumber && (
                              <p className="text-xs text-muted-foreground">
                                Batch: {record.metadata.provenance.batchNumber}
                              </p>
                            )}
                            {record.metadata.provenance_id && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Provenance: {record.metadata.provenance_id}
                              </p>
                            )}
                            {record.metadata.provenance.physicalHash && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Hash: {maskPhysicalHash(record.metadata.provenance.physicalHash)}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="font-mono animate-gold-pulse">
                                {record.metadata.discountCode}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Redeemed: {new Date(Number(record.timestamp) / 1000000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Flame className="h-5 w-5 text-destructive flex-shrink-0 animate-flicker" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-16 w-16 text-muted-foreground mb-4 animate-ember-float" />
                  <h3 className="text-xl font-semibold mb-2">No Redemptions Yet</h3>
                  <p className="text-muted-foreground text-center">
                    You haven't redeemed any NFTs yet. Start by redeeming from your collection!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            {!leaderboardVisible ? (
              <Alert className="border-primary/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>The leaderboard is currently hidden by the admin.</AlertDescription>
              </Alert>
            ) : leaderboardLoading ? (
              <Card>
                <CardContent className="py-6">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ) : leaderboard && leaderboard.length > 0 ? (
              <Card className="border-primary/20 animate-glow-entrance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary animate-ember-float" />
                    Top Collectors
                  </CardTitle>
                  <CardDescription>Ranked by number of NFTs burned in the eternal forge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map(([principal, count], index) => {
                      const isCurrentUser = principal.toString() === userPrincipal;
                      return (
                        <div
                          key={principal.toString()}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            isCurrentUser ? 'bg-primary/10 border-2 border-primary card-fiery-hover' : 'bg-muted/50 border border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 animate-gold-pulse'
                                  : index === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-950'
                                  : index === 2
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-950'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {isCurrentUser ? 'You' : `${principal.toString().slice(0, 8)}...`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="animate-gold-pulse">{count.toString()} redeemed</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-16 w-16 text-muted-foreground mb-4 animate-ember-float" />
                  <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                  <p className="text-muted-foreground text-center">
                    Be the first to redeem NFTs and claim the top spot!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Provenance Details Dialog */}
        <Dialog open={showProvenanceDialog} onOpenChange={setShowProvenanceDialog}>
          <DialogContent className="max-w-2xl border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Provenance Details
              </DialogTitle>
              <DialogDescription>
                Complete provenance information for RWA transparency
              </DialogDescription>
            </DialogHeader>
            {selectedNFT && (
              <div className="space-y-4 py-4">
                <div className="bg-primary/10 p-4 rounded-lg space-y-2 border border-primary/20">
                  <h4 className="font-semibold text-lg">{selectedNFT.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedNFT.collection}</p>
                </div>

                <Separator className="bg-primary/20" />

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Provenance ID</p>
                      <p className="font-mono text-sm">{selectedNFT.provenance.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Product Name</p>
                      <p className="text-sm font-medium">{selectedNFT.provenance.productName}</p>
                    </div>
                  </div>

                  {selectedNFT.provenance.batchNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Batch Number</p>
                      <p className="font-mono text-sm">{selectedNFT.provenance.batchNumber}</p>
                    </div>
                  )}

                  {selectedNFT.provenance.creationDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Creation Date</p>
                      <p className="text-sm">
                        {new Date(Number(selectedNFT.provenance.creationDate) / 1000000).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedNFT.provenance.physicalHash && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Physical Hash
                      </p>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded border border-primary/20">
                        {selectedNFT.provenance.physicalHash}
                      </p>
                    </div>
                  )}

                  {selectedNFT.provenance.attributes && selectedNFT.provenance.attributes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Custom Attributes</p>
                      <div className="space-y-2">
                        {selectedNFT.provenance.attributes.map((attr, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded border border-primary/20">
                            <span className="text-sm text-muted-foreground">{attr.trait_type}</span>
                            <Badge variant="secondary">{attr.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-primary/20" />

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-1">Additional Metadata</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedNFT.asset_class && (
                      <div>
                        <span className="text-muted-foreground">Asset Class: </span>
                        <span className="font-medium">{selectedNFT.asset_class}</span>
                      </div>
                    )}
                    {selectedNFT.certification && (
                      <div>
                        <span className="text-muted-foreground">Certification: </span>
                        <span className="font-medium">{selectedNFT.certification}</span>
                      </div>
                    )}
                    {selectedNFT.manufacturer_details && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Manufacturer: </span>
                        <span className="font-medium">{selectedNFT.manufacturer_details}</span>
                      </div>
                    )}
                    {selectedNFT.issue_date && (
                      <div>
                        <span className="text-muted-foreground">Issue Date: </span>
                        <span className="font-medium">{selectedNFT.issue_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowProvenanceDialog(false)} className="ember-glow">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Redeem Confirmation Dialog */}
        <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
          <DialogContent className="border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary animate-flicker" />
                Redeem NFT
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to redeem this NFT? This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedNFT && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">NFT Details:</p>
                  <div className="bg-primary/10 p-3 rounded-lg space-y-1 border border-primary/20">
                    <p className="font-semibold">{selectedNFT.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedNFT.collection}</p>
                    <p className="text-sm">Product: {selectedNFT.provenance.productName || selectedNFT.product}</p>
                    {selectedNFT.asset_class && (
                      <p className="text-xs text-muted-foreground">Asset Class: {selectedNFT.asset_class}</p>
                    )}
                    {selectedNFT.provenance_id && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Provenance: {selectedNFT.provenance_id}
                      </p>
                    )}
                    {selectedNFT.provenance.batchNumber && (
                      <p className="text-xs text-muted-foreground">
                        Batch: {selectedNFT.provenance.batchNumber}
                      </p>
                    )}
                  </div>
                </div>
                <Alert className="border-accent/20 bg-accent/10">
                  <Flame className="h-4 w-4 text-accent animate-flicker" />
                  <AlertDescription>
                    Once redeemed, you'll receive your discount code and the NFT will be permanently burned in the eternal forge. Provenance information will be preserved in your redemption history.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRedeemDialog(false)} disabled={isBurning}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRedeem} disabled={isBurning} className="ember-glow">
                {isBurning ? 'Redeeming...' : 'Confirm Redemption'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Edit Modal */}
        <ProfileEditModal open={showProfileEdit} onOpenChange={setShowProfileEdit} />

        {/* Address Book Modal */}
        <AddressBookModal open={showAddressBook} onOpenChange={setShowAddressBook} />

        {/* Transparency Dashboard */}
        <TransparencyDashboard open={showTransparency} onOpenChange={setShowTransparency} />
      </div>
    </div>
  );
}
