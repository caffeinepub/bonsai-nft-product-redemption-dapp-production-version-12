import { useGetAllNFTs, useIsCallerAdmin, useMintNFT, useBatchMintNFTs, useTransferNFT, useToggleLeaderboardVisibility, useIsLeaderboardVisible, useGetAllTransactionHistory, getMediaAssetDisplayUrl } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Shield, Plus, Send, AlertCircle, CheckCircle, Upload, X, Trash2, Flame, Lock, History, Package, Hash, Loader2 } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import type { ORIGYNMetadata, ProvenanceID, TransactionRecord } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: allNFTs, isLoading: nftsLoading } = useGetAllNFTs();
  const { data: leaderboardVisible } = useIsLeaderboardVisible();
  const { data: allTransactions, isLoading: transactionsLoading } = useGetAllTransactionHistory();
  const { mutate: mintNFT, isPending: isMinting } = useMintNFT();
  const { mutate: batchMintNFTs, isPending: isBatchMinting } = useBatchMintNFTs();
  const { mutate: transferNFT, isPending: isTransferring } = useTransferNFT();
  const { mutate: toggleLeaderboard, isPending: isTogglingLeaderboard } = useToggleLeaderboardVisibility();

  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBatchMintDialog, setShowBatchMintDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<ORIGYNMetadata | null>(null);
  const [showRedemptionDetails, setShowRedemptionDetails] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<TransactionRecord | null>(null);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch file upload states
  const [batchUploadedFile, setBatchUploadedFile] = useState<File | null>(null);
  const [batchUploadedFilePreview, setBatchUploadedFilePreview] = useState<string | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchUploadProgress, setBatchUploadProgress] = useState(0);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Single mint form with ORIGYN fields and provenance
  const [mintForm, setMintForm] = useState({
    name: '',
    collection: '',
    product: '',
    discountCode: '',
    verified: true,
    mystery: false,
    asset_class: '',
    certification: '',
    provenance_id: '',
    manufacturer_details: '',
    issue_date: new Date().toISOString().split('T')[0],
    selectedArtwork: [] as ExternalBlob[],
    uploadedArtworkBlob: null as ExternalBlob | null,
    // Provenance fields
    provenanceProductName: '',
    provenanceBatchNumber: '',
    provenancePhysicalHash: '',
    provenanceAttributes: [{ trait_type: '', value: '' }],
  });

  // Batch mint form with ORIGYN fields and provenance
  const [batchCount, setBatchCount] = useState(5);
  const [batchForm, setBatchForm] = useState({
    namePrefix: 'Bonsai NFT',
    collection: 'Spring Collection',
    product: 'Premium Bonsai Kit',
    discountCodePrefix: 'BONSAI',
    verified: true,
    mystery: false,
    asset_class: 'Physical Product',
    certification: 'Certified Authentic',
    provenance_id: 'PROV',
    manufacturer_details: 'Bonsai Artisans Co.',
    issue_date: new Date().toISOString().split('T')[0],
    selectedArtwork: [] as ExternalBlob[],
    uploadedArtworkBlob: null as ExternalBlob | null,
    // Provenance fields
    provenanceProductName: 'Premium Bonsai Kit',
    provenanceBatchNumber: 'BATCH-2025',
    provenancePhysicalHash: '',
    provenanceAttributes: [{ trait_type: '', value: '' }],
  });

  // Transfer form
  const [transferTo, setTransferTo] = useState('');

  // Available artwork assets
  const availableArtwork = [
    { url: '/assets/generated/bonsai-hero.dim_800x600.jpg', name: 'Bonsai Hero' },
    { url: '/assets/generated/bonsai-logo-transparent.dim_200x200.png', name: 'Bonsai Logo' },
    { url: '/assets/generated/mystery-box.dim_300x300.jpg', name: 'Mystery Box' },
    { url: '/assets/generated/discount-coupon.dim_600x400.jpg', name: 'Discount Coupon' },
    { url: '/assets/generated/trophy-3d.dim_400x400.jpg', name: 'Trophy 3D' },
  ];

  // Extract redemption history from all transactions
  const redemptionHistory = useMemo(() => {
    if (!allTransactions) return [];
    return allTransactions
      .filter(tx => tx.transactionType === 'burn')
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  }, [allTransactions]);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, or GIF files only.';
    }

    if (file.size > maxSize) {
      return 'File size exceeds 10MB. Please upload a smaller file.';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, formType: 'single' | 'batch') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (formType === 'single') {
        setUploadedFilePreview(reader.result as string);
        setUploadedFile(file);
      } else {
        setBatchUploadedFilePreview(reader.result as string);
        setBatchUploadedFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFileToBlob = async (file: File, formType: 'single' | 'batch'): Promise<ExternalBlob | null> => {
    try {
      if (formType === 'single') {
        setIsUploading(true);
        setUploadProgress(0);
      } else {
        setIsBatchUploading(true);
        setBatchUploadProgress(0);
      }

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        if (formType === 'single') {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        } else {
          setBatchUploadProgress((prev) => Math.min(prev + 10, 90));
        }
      }, 100);

      // Create ExternalBlob from bytes with upload progress tracking
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        if (formType === 'single') {
          setUploadProgress(percentage);
        } else {
          setBatchUploadProgress(percentage);
        }
      });
      
      clearInterval(progressInterval);
      
      if (formType === 'single') {
        setUploadProgress(100);
      } else {
        setBatchUploadProgress(100);
      }
      
      toast.success('Artwork uploaded successfully!');
      return externalBlob;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload artwork');
      return null;
    } finally {
      if (formType === 'single') {
        setIsUploading(false);
      } else {
        setIsBatchUploading(false);
      }
    }
  };

  const handleUploadAndAttach = async (formType: 'single' | 'batch') => {
    const file = formType === 'single' ? uploadedFile : batchUploadedFile;
    if (!file) return;

    const externalBlob = await uploadFileToBlob(file, formType);
    if (externalBlob) {
      if (formType === 'single') {
        setMintForm((prev) => ({
          ...prev,
          uploadedArtworkBlob: externalBlob,
          selectedArtwork: [...prev.selectedArtwork, externalBlob],
        }));
        setUploadedFile(null);
        setUploadedFilePreview(null);
        setUploadProgress(0);
      } else {
        setBatchForm((prev) => ({
          ...prev,
          uploadedArtworkBlob: externalBlob,
          selectedArtwork: [...prev.selectedArtwork, externalBlob],
        }));
        setBatchUploadedFile(null);
        setBatchUploadedFilePreview(null);
        setBatchUploadProgress(0);
      }
    }
  };

  const removeUploadedFile = (formType: 'single' | 'batch') => {
    if (formType === 'single') {
      setUploadedFile(null);
      setUploadedFilePreview(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setBatchUploadedFile(null);
      setBatchUploadedFilePreview(null);
      setBatchUploadProgress(0);
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
  };

  const handleMintNFT = async () => {
    // Validate required fields
    if (!mintForm.name || !mintForm.collection || !mintForm.product || !mintForm.discountCode) {
      toast.error('Please fill in all required fields (Name, Collection, Product, Discount Code)');
      return;
    }

    if (mintForm.selectedArtwork.length === 0) {
      toast.error('Please select or upload at least one artwork');
      return;
    }

    try {
      const provenance: ProvenanceID = {
        id: mintForm.provenance_id || `PROV-${Date.now()}`,
        productName: mintForm.provenanceProductName || mintForm.product,
        batchNumber: mintForm.provenanceBatchNumber || 'BATCH-001',
        creationDate: BigInt(Date.now() * 1000000),
        attributes: mintForm.provenanceAttributes.filter(attr => attr.trait_type && attr.value),
        physicalHash: mintForm.provenancePhysicalHash || '',
      };

      const metadata: ORIGYNMetadata = {
        id: 0n,
        name: mintForm.name,
        collection: mintForm.collection,
        product: mintForm.product,
        discountCode: mintForm.discountCode,
        verified: mintForm.verified,
        mystery: mintForm.mystery,
        redeemed: false,
        asset_class: mintForm.asset_class || 'Digital Asset',
        certification: mintForm.certification || 'Standard',
        provenance_id: provenance.id,
        manufacturer_details: mintForm.manufacturer_details || 'N/A',
        issue_date: mintForm.issue_date,
        media_assets: [],
        provenance,
      };

      mintNFT(
        { metadata, mediaAssets: mintForm.selectedArtwork },
        {
          onSuccess: () => {
            setShowMintDialog(false);
            // Reset form
            setMintForm({
              name: '',
              collection: '',
              product: '',
              discountCode: '',
              verified: true,
              mystery: false,
              asset_class: '',
              certification: '',
              provenance_id: '',
              manufacturer_details: '',
              issue_date: new Date().toISOString().split('T')[0],
              selectedArtwork: [],
              uploadedArtworkBlob: null,
              provenanceProductName: '',
              provenanceBatchNumber: '',
              provenancePhysicalHash: '',
              provenanceAttributes: [{ trait_type: '', value: '' }],
            });
          },
        }
      );
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to prepare NFT for minting');
    }
  };

  const handleBatchMint = async () => {
    // Validate required fields
    if (!batchForm.namePrefix || !batchForm.collection || !batchForm.product || !batchForm.discountCodePrefix) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (batchForm.selectedArtwork.length === 0) {
      toast.error('Please select or upload at least one artwork');
      return;
    }

    if (batchCount < 1 || batchCount > 100) {
      toast.error('Batch count must be between 1 and 100');
      return;
    }

    try {
      const metadataList: ORIGYNMetadata[] = Array.from({ length: batchCount }, (_, i) => {
        const provenance: ProvenanceID = {
          id: `${batchForm.provenance_id}-${String(i + 1).padStart(3, '0')}`,
          productName: batchForm.provenanceProductName || batchForm.product,
          batchNumber: batchForm.provenanceBatchNumber,
          creationDate: BigInt(Date.now() * 1000000),
          attributes: batchForm.provenanceAttributes.filter(attr => attr.trait_type && attr.value),
          physicalHash: batchForm.provenancePhysicalHash || '',
        };

        return {
          id: 0n,
          name: `${batchForm.namePrefix} #${i + 1}`,
          collection: batchForm.collection,
          product: batchForm.product,
          discountCode: `${batchForm.discountCodePrefix}${String(i + 1).padStart(3, '0')}`,
          verified: batchForm.verified,
          mystery: batchForm.mystery,
          redeemed: false,
          asset_class: batchForm.asset_class || 'Digital Asset',
          certification: batchForm.certification || 'Standard',
          provenance_id: provenance.id,
          manufacturer_details: batchForm.manufacturer_details || 'N/A',
          issue_date: batchForm.issue_date,
          media_assets: [],
          provenance,
        };
      });

      const mediaAssetsList = Array.from({ length: batchCount }, () => batchForm.selectedArtwork);

      batchMintNFTs(
        { metadataList, mediaAssetsList },
        {
          onSuccess: () => {
            setShowBatchMintDialog(false);
            // Reset form
            setBatchForm({
              namePrefix: 'Bonsai NFT',
              collection: 'Spring Collection',
              product: 'Premium Bonsai Kit',
              discountCodePrefix: 'BONSAI',
              verified: true,
              mystery: false,
              asset_class: 'Physical Product',
              certification: 'Certified Authentic',
              provenance_id: 'PROV',
              manufacturer_details: 'Bonsai Artisans Co.',
              issue_date: new Date().toISOString().split('T')[0],
              selectedArtwork: [],
              uploadedArtworkBlob: null,
              provenanceProductName: 'Premium Bonsai Kit',
              provenanceBatchNumber: 'BATCH-2025',
              provenancePhysicalHash: '',
              provenanceAttributes: [{ trait_type: '', value: '' }],
            });
          },
        }
      );
    } catch (error) {
      console.error('Batch minting error:', error);
      toast.error('Failed to prepare NFTs for batch minting');
    }
  };

  const handleTransfer = () => {
    if (selectedNFT && transferTo) {
      try {
        const principal = Principal.fromText(transferTo);
        transferNFT({ nftId: selectedNFT.id, to: principal });
        setShowTransferDialog(false);
        setSelectedNFT(null);
        setTransferTo('');
      } catch (error) {
        toast.error('Invalid principal ID');
      }
    }
  };

  const toggleArtworkSelection = (url: string, formType: 'single' | 'batch') => {
    const externalBlob = ExternalBlob.fromURL(url);
    
    if (formType === 'single') {
      setMintForm((prev) => {
        const isSelected = prev.selectedArtwork.some(asset => asset.getDirectURL() === url);
        return {
          ...prev,
          selectedArtwork: isSelected
            ? prev.selectedArtwork.filter((a) => a.getDirectURL() !== url)
            : [...prev.selectedArtwork, externalBlob],
        };
      });
    } else {
      setBatchForm((prev) => {
        const isSelected = prev.selectedArtwork.some(asset => asset.getDirectURL() === url);
        return {
          ...prev,
          selectedArtwork: isSelected
            ? prev.selectedArtwork.filter((a) => a.getDirectURL() !== url)
            : [...prev.selectedArtwork, externalBlob],
        };
      });
    }
  };

  const addAttribute = (formType: 'single' | 'batch') => {
    if (formType === 'single') {
      setMintForm(prev => ({
        ...prev,
        provenanceAttributes: [...prev.provenanceAttributes, { trait_type: '', value: '' }]
      }));
    } else {
      setBatchForm(prev => ({
        ...prev,
        provenanceAttributes: [...prev.provenanceAttributes, { trait_type: '', value: '' }]
      }));
    }
  };

  const removeAttribute = (index: number, formType: 'single' | 'batch') => {
    if (formType === 'single') {
      setMintForm(prev => ({
        ...prev,
        provenanceAttributes: prev.provenanceAttributes.filter((_, i) => i !== index)
      }));
    } else {
      setBatchForm(prev => ({
        ...prev,
        provenanceAttributes: prev.provenanceAttributes.filter((_, i) => i !== index)
      }));
    }
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string, formType: 'single' | 'batch') => {
    if (formType === 'single') {
      setMintForm(prev => ({
        ...prev,
        provenanceAttributes: prev.provenanceAttributes.map((attr, i) =>
          i === index ? { ...attr, [field]: value } : attr
        )
      }));
    } else {
      setBatchForm(prev => ({
        ...prev,
        provenanceAttributes: prev.provenanceAttributes.map((attr, i) =>
          i === index ? { ...attr, [field]: value } : attr
        )
      }));
    }
  };

  const maskPhysicalHash = (hash: string) => {
    if (!hash) return 'N/A';
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const handleViewRedemption = (redemption: TransactionRecord) => {
    setSelectedRedemption(redemption);
    setShowRedemptionDetails(true);
  };

  if (adminCheckLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have admin privileges. Only the permanent admin can access this dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalNFTs = allNFTs?.length ?? 0;
  const redeemedNFTs = allNFTs?.filter((nft) => nft.redeemed).length ?? 0;
  const activeNFTs = totalNFTs - redeemedNFTs;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage ORIGYN-compliant NFTs with provenance tracking</p>
        </div>
      </div>

      {/* Admin Notice */}
      <Alert className="mb-8 border-primary/20 bg-primary/5">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription>
          You are the <strong>permanent administrator</strong> of this application. Admin privileges cannot be transferred or reassigned to ensure security and consistency.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNFTs}</div>
            <p className="text-xs text-muted-foreground">All minted NFTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeNFTs}</div>
            <p className="text-xs text-muted-foreground">Not yet redeemed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redeemedNFTs}</div>
            <p className="text-xs text-muted-foreground">Burned NFTs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant={leaderboardVisible ? 'default' : 'secondary'}>
                {leaderboardVisible ? 'Visible' : 'Hidden'}
              </Badge>
              <Switch
                checked={leaderboardVisible}
                onCheckedChange={() => toggleLeaderboard()}
                disabled={isTogglingLeaderboard}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="nfts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="nfts">All NFTs</TabsTrigger>
          <TabsTrigger value="redemptions">Redemption History</TabsTrigger>
          <TabsTrigger value="mint">Mint NFTs</TabsTrigger>
        </TabsList>

        {/* All NFTs Tab */}
        <TabsContent value="nfts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NFT Management</CardTitle>
              <CardDescription>View and manage all ORIGYN-compliant NFTs with provenance data</CardDescription>
            </CardHeader>
            <CardContent>
              {nftsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : allNFTs && allNFTs.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Artwork</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Collection</TableHead>
                          <TableHead>Asset Class</TableHead>
                          <TableHead>Provenance ID</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allNFTs.map((nft) => (
                          <TableRow key={nft.id.toString()}>
                            <TableCell className="font-mono text-sm">{nft.id.toString()}</TableCell>
                            <TableCell>
                              {nft.media_assets.length > 0 ? (
                                <img
                                  src={getMediaAssetDisplayUrl(nft.media_assets[0])}
                                  alt={nft.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                                  No Art
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {nft.name}
                                {nft.verified && <CheckCircle className="h-4 w-4 text-primary" />}
                              </div>
                            </TableCell>
                            <TableCell>{nft.collection}</TableCell>
                            <TableCell>{nft.asset_class || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-xs">{nft.provenance_id || 'N/A'}</TableCell>
                            <TableCell className="text-xs">{nft.provenance.batchNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={nft.redeemed ? 'secondary' : 'default'}>
                                {nft.redeemed ? 'Redeemed' : 'Active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {!nft.redeemed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedNFT(nft);
                                    setShowTransferDialog(true);
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Transfer
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No NFTs minted yet. Start by minting your first ORIGYN-compliant NFT!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Redemption History Tab */}
        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary animate-ember-float" />
                Redemption History (Archived NFTs)
              </CardTitle>
              <CardDescription>
                Complete archive of all burned NFTs with preserved provenance data and media assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : redemptionHistory.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {redemptionHistory.map((record, index) => (
                      <Card
                        key={`${record.nftId}-${record.timestamp}-${index}`}
                        className="border-primary/20 card-fiery-hover animate-glow-entrance"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4 flex-1">
                              {record.metadata.media_assets.length > 0 && (
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={getMediaAssetDisplayUrl(record.metadata.media_assets[0])}
                                    alt={record.metadata.name}
                                    className="w-24 h-24 object-cover rounded border-2 border-primary/20"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent rounded" />
                                </div>
                              )}
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-lg">{record.metadata.name}</h4>
                                  <Badge variant="outline">{record.metadata.collection}</Badge>
                                  {record.metadata.verified && (
                                    <Badge variant="default" className="gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Product: </span>
                                    <span className="font-medium">{record.metadata.provenance.productName || record.metadata.product}</span>
                                  </div>
                                  {record.metadata.provenance.batchNumber && (
                                    <div>
                                      <span className="text-muted-foreground">Batch: </span>
                                      <span className="font-mono text-xs">{record.metadata.provenance.batchNumber}</span>
                                    </div>
                                  )}
                                  {record.metadata.provenance_id && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Provenance ID: </span>
                                      <span className="font-mono text-xs">{record.metadata.provenance_id}</span>
                                    </div>
                                  )}
                                  {record.metadata.provenance.physicalHash && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Hash: </span>
                                      <span className="font-mono text-xs">{maskPhysicalHash(record.metadata.provenance.physicalHash)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                  <Badge variant="secondary" className="font-mono">
                                    {record.metadata.discountCode}
                                  </Badge>
                                  {record.metadata.certification && (
                                    <Badge variant="outline" className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      {record.metadata.certification}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                  <div>
                                    <span>User: </span>
                                    <span className="font-mono">{record.user.toString().slice(0, 12)}...</span>
                                  </div>
                                  <div>
                                    <span>Redeemed: </span>
                                    <span>{new Date(Number(record.timestamp) / 1000000).toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span>NFT ID: </span>
                                    <span className="font-mono">#{record.nftId.toString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Flame className="h-6 w-6 text-destructive flex-shrink-0 animate-flicker" />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewRedemption(record)}
                                className="gap-2"
                              >
                                <Package className="h-4 w-4" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-ember-float" />
                  <h3 className="text-xl font-semibold mb-2">No Redemptions Yet</h3>
                  <p className="text-muted-foreground">
                    Redeemed NFTs will appear here with their complete provenance data and media assets preserved
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mint NFTs Tab */}
        <TabsContent value="mint" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Single Mint Card */}
            <Card>
              <CardHeader>
                <CardTitle>Mint Single NFT</CardTitle>
                <CardDescription>Create an ORIGYN-compliant NFT with provenance data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => setShowMintDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Mint Single NFT
                </Button>
              </CardContent>
            </Card>

            {/* Batch Mint Card */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Mint NFTs</CardTitle>
                <CardDescription>Create multiple ORIGYN-compliant NFTs with provenance</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" variant="secondary" onClick={() => setShowBatchMintDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Batch Mint NFTs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Single Mint Dialog */}
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mint ORIGYN-Compliant NFT</DialogTitle>
            <DialogDescription>Create a new NFT with complete provenance tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={mintForm.name}
                    onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                    placeholder="Bonsai NFT #1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collection">Collection *</Label>
                  <Input
                    id="collection"
                    value={mintForm.collection}
                    onChange={(e) => setMintForm({ ...mintForm, collection: e.target.value })}
                    placeholder="Spring Collection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product *</Label>
                  <Input
                    id="product"
                    value={mintForm.product}
                    onChange={(e) => setMintForm({ ...mintForm, product: e.target.value })}
                    placeholder="Premium Bonsai Kit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountCode">Discount Code *</Label>
                  <Input
                    id="discountCode"
                    value={mintForm.discountCode}
                    onChange={(e) => setMintForm({ ...mintForm, discountCode: e.target.value })}
                    placeholder="BONSAI001"
                  />
                </div>
              </div>
            </div>

            {/* ORIGYN Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">ORIGYN Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset_class">Asset Class</Label>
                  <Input
                    id="asset_class"
                    value={mintForm.asset_class}
                    onChange={(e) => setMintForm({ ...mintForm, asset_class: e.target.value })}
                    placeholder="Physical Product"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certification">Certification</Label>
                  <Input
                    id="certification"
                    value={mintForm.certification}
                    onChange={(e) => setMintForm({ ...mintForm, certification: e.target.value })}
                    placeholder="Certified Authentic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer_details">Manufacturer</Label>
                  <Input
                    id="manufacturer_details"
                    value={mintForm.manufacturer_details}
                    onChange={(e) => setMintForm({ ...mintForm, manufacturer_details: e.target.value })}
                    placeholder="Bonsai Artisans Co."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={mintForm.issue_date}
                    onChange={(e) => setMintForm({ ...mintForm, issue_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Provenance Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Provenance Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provenance_id">Provenance ID</Label>
                  <Input
                    id="provenance_id"
                    value={mintForm.provenance_id}
                    onChange={(e) => setMintForm({ ...mintForm, provenance_id: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provenanceProductName">Product Name</Label>
                  <Input
                    id="provenanceProductName"
                    value={mintForm.provenanceProductName}
                    onChange={(e) => setMintForm({ ...mintForm, provenanceProductName: e.target.value })}
                    placeholder="Uses Product field if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provenanceBatchNumber">Batch Number</Label>
                  <Input
                    id="provenanceBatchNumber"
                    value={mintForm.provenanceBatchNumber}
                    onChange={(e) => setMintForm({ ...mintForm, provenanceBatchNumber: e.target.value })}
                    placeholder="BATCH-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provenancePhysicalHash">Physical Hash</Label>
                  <Input
                    id="provenancePhysicalHash"
                    value={mintForm.provenancePhysicalHash}
                    onChange={(e) => setMintForm({ ...mintForm, provenancePhysicalHash: e.target.value })}
                    placeholder="Optional physical verification hash"
                  />
                </div>
              </div>

              {/* Custom Attributes */}
              <div className="space-y-2">
                <Label>Custom Attributes</Label>
                {mintForm.provenanceAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Trait Type"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value, 'single')}
                    />
                    <Input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value, 'single')}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeAttribute(index, 'single')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addAttribute('single')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            </div>

            {/* Artwork Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Artwork Selection *</h3>
              
              {/* Available Artwork */}
              <div>
                <Label className="mb-2 block">Available Artwork</Label>
                <div className="grid grid-cols-3 gap-3">
                  {availableArtwork.map((art) => (
                    <div
                      key={art.url}
                      onClick={() => toggleArtworkSelection(art.url, 'single')}
                      className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${
                        mintForm.selectedArtwork.some(a => a.getDirectURL() === art.url)
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <img src={art.url} alt={art.name} className="w-full h-24 object-cover rounded mb-2" />
                      <p className="text-xs text-center">{art.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Upload */}
              <div>
                <Label className="mb-2 block">Upload Custom Artwork</Label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={(e) => handleFileSelect(e, 'single')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-primary/50 hover:border-primary hover:bg-primary/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>

                  {uploadedFilePreview && (
                    <div className="relative border-2 border-primary/20 rounded-lg p-3">
                      <img src={uploadedFilePreview} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUploadAndAttach('single')}
                          disabled={isUploading}
                          className="flex-1"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Attach to NFT
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeUploadedFile('single')}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {isUploading && (
                        <Progress value={uploadProgress} className="mt-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {mintForm.selectedArtwork.length > 0 && (
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected: {mintForm.selectedArtwork.length} artwork(s)</p>
                </div>
              )}
            </div>

            {/* Flags */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mintForm.verified}
                  onChange={(e) => setMintForm({ ...mintForm, verified: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mintForm.mystery}
                  onChange={(e) => setMintForm({ ...mintForm, mystery: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Mystery NFT</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMintDialog(false)} disabled={isMinting}>
              Cancel
            </Button>
            <Button onClick={handleMintNFT} disabled={isMinting} className="gap-2">
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Mint NFT
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Mint Dialog */}
      <Dialog open={showBatchMintDialog} onOpenChange={setShowBatchMintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Mint ORIGYN-Compliant NFTs</DialogTitle>
            <DialogDescription>Create multiple NFTs with shared provenance data</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Batch Count */}
            <div className="space-y-2">
              <Label htmlFor="batchCount">Number of NFTs to Mint</Label>
              <Input
                id="batchCount"
                type="number"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">Each NFT will be numbered sequentially</p>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namePrefix">Name Prefix *</Label>
                  <Input
                    id="namePrefix"
                    value={batchForm.namePrefix}
                    onChange={(e) => setBatchForm({ ...batchForm, namePrefix: e.target.value })}
                    placeholder="Bonsai NFT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchCollection">Collection *</Label>
                  <Input
                    id="batchCollection"
                    value={batchForm.collection}
                    onChange={(e) => setBatchForm({ ...batchForm, collection: e.target.value })}
                    placeholder="Spring Collection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchProduct">Product *</Label>
                  <Input
                    id="batchProduct"
                    value={batchForm.product}
                    onChange={(e) => setBatchForm({ ...batchForm, product: e.target.value })}
                    placeholder="Premium Bonsai Kit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountCodePrefix">Discount Code Prefix *</Label>
                  <Input
                    id="discountCodePrefix"
                    value={batchForm.discountCodePrefix}
                    onChange={(e) => setBatchForm({ ...batchForm, discountCodePrefix: e.target.value })}
                    placeholder="BONSAI"
                  />
                </div>
              </div>
            </div>

            {/* ORIGYN Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">ORIGYN Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchAssetClass">Asset Class</Label>
                  <Input
                    id="batchAssetClass"
                    value={batchForm.asset_class}
                    onChange={(e) => setBatchForm({ ...batchForm, asset_class: e.target.value })}
                    placeholder="Physical Product"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchCertification">Certification</Label>
                  <Input
                    id="batchCertification"
                    value={batchForm.certification}
                    onChange={(e) => setBatchForm({ ...batchForm, certification: e.target.value })}
                    placeholder="Certified Authentic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchManufacturer">Manufacturer</Label>
                  <Input
                    id="batchManufacturer"
                    value={batchForm.manufacturer_details}
                    onChange={(e) => setBatchForm({ ...batchForm, manufacturer_details: e.target.value })}
                    placeholder="Bonsai Artisans Co."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchIssueDate">Issue Date</Label>
                  <Input
                    id="batchIssueDate"
                    type="date"
                    value={batchForm.issue_date}
                    onChange={(e) => setBatchForm({ ...batchForm, issue_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Provenance Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Provenance Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchProvenanceId">Provenance ID Prefix</Label>
                  <Input
                    id="batchProvenanceId"
                    value={batchForm.provenance_id}
                    onChange={(e) => setBatchForm({ ...batchForm, provenance_id: e.target.value })}
                    placeholder="PROV"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchProvenanceProductName">Product Name</Label>
                  <Input
                    id="batchProvenanceProductName"
                    value={batchForm.provenanceProductName}
                    onChange={(e) => setBatchForm({ ...batchForm, provenanceProductName: e.target.value })}
                    placeholder="Premium Bonsai Kit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchProvenanceBatchNumber">Batch Number</Label>
                  <Input
                    id="batchProvenanceBatchNumber"
                    value={batchForm.provenanceBatchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, provenanceBatchNumber: e.target.value })}
                    placeholder="BATCH-2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchProvenancePhysicalHash">Physical Hash</Label>
                  <Input
                    id="batchProvenancePhysicalHash"
                    value={batchForm.provenancePhysicalHash}
                    onChange={(e) => setBatchForm({ ...batchForm, provenancePhysicalHash: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Custom Attributes */}
              <div className="space-y-2">
                <Label>Custom Attributes</Label>
                {batchForm.provenanceAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Trait Type"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value, 'batch')}
                    />
                    <Input
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value, 'batch')}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeAttribute(index, 'batch')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addAttribute('batch')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            </div>

            {/* Artwork Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Artwork Selection * (Shared by all NFTs)</h3>
              
              {/* Available Artwork */}
              <div>
                <Label className="mb-2 block">Available Artwork</Label>
                <div className="grid grid-cols-3 gap-3">
                  {availableArtwork.map((art) => (
                    <div
                      key={art.url}
                      onClick={() => toggleArtworkSelection(art.url, 'batch')}
                      className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${
                        batchForm.selectedArtwork.some(a => a.getDirectURL() === art.url)
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <img src={art.url} alt={art.name} className="w-full h-24 object-cover rounded mb-2" />
                      <p className="text-xs text-center">{art.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Upload */}
              <div>
                <Label className="mb-2 block">Upload Custom Artwork</Label>
                <div className="space-y-3">
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    onChange={(e) => handleFileSelect(e, 'batch')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => batchFileInputRef.current?.click()}
                    className="w-full border-primary/50 hover:border-primary hover:bg-primary/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>

                  {batchUploadedFilePreview && (
                    <div className="relative border-2 border-primary/20 rounded-lg p-3">
                      <img src={batchUploadedFilePreview} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUploadAndAttach('batch')}
                          disabled={isBatchUploading}
                          className="flex-1"
                        >
                          {isBatchUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Attach to NFTs
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeUploadedFile('batch')}
                          disabled={isBatchUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {isBatchUploading && (
                        <Progress value={batchUploadProgress} className="mt-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {batchForm.selectedArtwork.length > 0 && (
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected: {batchForm.selectedArtwork.length} artwork(s)</p>
                </div>
              )}
            </div>

            {/* Flags */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.verified}
                  onChange={(e) => setBatchForm({ ...batchForm, verified: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchForm.mystery}
                  onChange={(e) => setBatchForm({ ...batchForm, mystery: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Mystery NFTs</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchMintDialog(false)} disabled={isBatchMinting}>
              Cancel
            </Button>
            <Button onClick={handleBatchMint} disabled={isBatchMinting} className="gap-2">
              {isBatchMinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Minting {batchCount} NFTs...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Mint {batchCount} NFTs
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer NFT</DialogTitle>
            <DialogDescription>Transfer this NFT to another user's Principal ID</DialogDescription>
          </DialogHeader>
          {selectedNFT && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold">{selectedNFT.name}</p>
                <p className="text-sm text-muted-foreground">{selectedNFT.collection}</p>
                {selectedNFT.provenance_id && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    Provenance: {selectedNFT.provenance_id}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferTo">Recipient Principal ID</Label>
                <Input
                  id="transferTo"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Enter recipient's Principal ID"
                />
                <p className="text-xs text-muted-foreground">
                  The recipient can find their Principal ID in their wallet view on the User Dashboard.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isTransferring || !transferTo}>
              {isTransferring ? 'Transferring...' : 'Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption Details Dialog */}
      <Dialog open={showRedemptionDetails} onOpenChange={setShowRedemptionDetails}>
        <DialogContent className="max-w-3xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Archived NFT - Complete Provenance
            </DialogTitle>
            <DialogDescription>
              Full metadata and media assets preserved from burned NFT
            </DialogDescription>
          </DialogHeader>
          {selectedRedemption && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6 py-4">
                {/* Media Assets Gallery */}
                {selectedRedemption.metadata.media_assets.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Media Assets</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRedemption.metadata.media_assets.map((asset, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                          <img
                            src={getMediaAssetDisplayUrl(asset)}
                            alt={`${selectedRedemption.metadata.name} - Asset ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs">Asset {index + 1}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NFT Information */}
                <div className="bg-primary/10 p-4 rounded-lg space-y-2 border border-primary/20">
                  <h4 className="font-semibold text-lg">{selectedRedemption.metadata.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRedemption.metadata.collection}</p>
                  <div className="flex items-center gap-2 pt-2">
                    {selectedRedemption.metadata.verified && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {selectedRedemption.metadata.certification && (
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {selectedRedemption.metadata.certification}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="font-mono">
                      {selectedRedemption.metadata.discountCode}
                    </Badge>
                  </div>
                </div>

                {/* Provenance Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Provenance Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Provenance ID</p>
                      <p className="font-mono text-sm">{selectedRedemption.metadata.provenance.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Product Name</p>
                      <p className="text-sm font-medium">{selectedRedemption.metadata.provenance.productName}</p>
                    </div>
                  </div>

                  {selectedRedemption.metadata.provenance.batchNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Batch Number</p>
                      <p className="font-mono text-sm">{selectedRedemption.metadata.provenance.batchNumber}</p>
                    </div>
                  )}

                  {selectedRedemption.metadata.provenance.creationDate && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Creation Date</p>
                      <p className="text-sm">
                        {new Date(Number(selectedRedemption.metadata.provenance.creationDate) / 1000000).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedRedemption.metadata.provenance.physicalHash && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Physical Hash
                      </p>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded border border-primary/20">
                        {selectedRedemption.metadata.provenance.physicalHash}
                      </p>
                    </div>
                  )}

                  {selectedRedemption.metadata.provenance.attributes && selectedRedemption.metadata.provenance.attributes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Custom Attributes</p>
                      <div className="space-y-2">
                        {selectedRedemption.metadata.provenance.attributes.map((attr, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded border border-primary/20">
                            <span className="text-sm text-muted-foreground">{attr.trait_type}</span>
                            <Badge variant="secondary">{attr.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Metadata */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Additional Metadata</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedRedemption.metadata.asset_class && (
                      <div>
                        <span className="text-muted-foreground">Asset Class: </span>
                        <span className="font-medium">{selectedRedemption.metadata.asset_class}</span>
                      </div>
                    )}
                    {selectedRedemption.metadata.manufacturer_details && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Manufacturer: </span>
                        <span className="font-medium">{selectedRedemption.metadata.manufacturer_details}</span>
                      </div>
                    )}
                    {selectedRedemption.metadata.issue_date && (
                      <div>
                        <span className="text-muted-foreground">Issue Date: </span>
                        <span className="font-medium">{selectedRedemption.metadata.issue_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Redemption Info */}
                <div className="bg-muted/50 p-3 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">Redemption Information</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">User: </span>
                      <span className="font-mono">{selectedRedemption.user.toString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Redeemed: </span>
                      <span>{new Date(Number(selectedRedemption.timestamp) / 1000000).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">NFT ID: </span>
                      <span className="font-mono">#{selectedRedemption.nftId.toString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button onClick={() => setShowRedemptionDetails(false)} className="ember-glow">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
