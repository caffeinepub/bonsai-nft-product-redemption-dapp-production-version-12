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
          onSuccess: (tokenId) => {
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
          onError: (error) => {
            console.error('Mint failed:', error);
          }
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
          onSuccess: (tokenIds) => {
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
          onError: (error) => {
            console.error('Batch mint failed:', error);
          }
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

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-6 w-6" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have administrator privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This area is restricted to administrators only. Please contact the system administrator if you believe you should have access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage NFTs, users, and system settings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="leaderboard-toggle" className="text-sm">Leaderboard Visible</Label>
              <Switch
                id="leaderboard-toggle"
                checked={leaderboardVisible}
                onCheckedChange={() => toggleLeaderboard()}
                disabled={isTogglingLeaderboard}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{allNFTs?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">{allTransactions?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-secondary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{redemptionHistory.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="nfts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nfts">NFT Management</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="nfts" className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => setShowMintDialog(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Mint Single NFT
              </Button>
              <Button
                onClick={() => setShowBatchMintDialog(true)}
                variant="outline"
                className="border-primary/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Batch Mint NFTs
              </Button>
            </div>

            {nftsLoading ? (
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
            ) : allNFTs && allNFTs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>All NFTs</CardTitle>
                  <CardDescription>Manage all minted NFTs in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Collection</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allNFTs.map((nft) => (
                          <TableRow key={nft.id.toString()}>
                            <TableCell className="font-mono">{nft.id.toString()}</TableCell>
                            <TableCell className="font-medium">{nft.name}</TableCell>
                            <TableCell>{nft.collection}</TableCell>
                            <TableCell>{nft.product}</TableCell>
                            <TableCell>
                              {nft.redeemed ? (
                                <Badge variant="secondary">Redeemed</Badge>
                              ) : (
                                <Badge variant="default">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedNFT(nft);
                                  setShowTransferDialog(true);
                                }}
                                disabled={nft.redeemed}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Transfer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No NFTs minted yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Start by minting your first NFT using the buttons above.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="redemptions" className="space-y-4">
            {transactionsLoading ? (
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
            ) : redemptionHistory.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                  <CardDescription>All NFT redemptions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>NFT ID</TableHead>
                          <TableHead>NFT Name</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {redemptionHistory.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{record.nftId.toString()}</TableCell>
                            <TableCell className="font-medium">{record.metadata.name}</TableCell>
                            <TableCell className="font-mono text-xs">{record.user.toString().slice(0, 20)}...</TableCell>
                            <TableCell>{new Date(Number(record.timestamp) / 1000000).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRedemption(record);
                                  setShowRedemptionDetails(true);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No redemptions yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Redemption history will appear here once users start redeeming NFTs.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {transactionsLoading ? (
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
            ) : allTransactions && allTransactions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>Complete transaction history across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>NFT ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>From/To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.map((tx, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge
                                variant={
                                  tx.transactionType === 'mint'
                                    ? 'default'
                                    : tx.transactionType === 'burn'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {tx.transactionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{tx.nftId.toString()}</TableCell>
                            <TableCell className="font-mono text-xs">{tx.user.toString().slice(0, 20)}...</TableCell>
                            <TableCell>{new Date(Number(tx.timestamp) / 1000000).toLocaleDateString()}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {tx.from && <div>From: {tx.from.toString().slice(0, 15)}...</div>}
                              {tx.to && <div>To: {tx.to.toString().slice(0, 15)}...</div>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Transaction history will appear here once activity begins.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Single Mint Dialog */}
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Mint New NFT
            </DialogTitle>
            <DialogDescription>
              Create a new ORIGYN-compliant NFT with complete provenance tracking
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">NFT Name *</Label>
                    <Input
                      id="name"
                      value={mintForm.name}
                      onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                      placeholder="e.g., Bonsai NFT #1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collection">Collection *</Label>
                    <Input
                      id="collection"
                      value={mintForm.collection}
                      onChange={(e) => setMintForm({ ...mintForm, collection: e.target.value })}
                      placeholder="e.g., Spring Collection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Product *</Label>
                    <Input
                      id="product"
                      value={mintForm.product}
                      onChange={(e) => setMintForm({ ...mintForm, product: e.target.value })}
                      placeholder="e.g., Premium Bonsai Kit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountCode">Discount Code *</Label>
                    <Input
                      id="discountCode"
                      value={mintForm.discountCode}
                      onChange={(e) => setMintForm({ ...mintForm, discountCode: e.target.value })}
                      placeholder="e.g., BONSAI001"
                    />
                  </div>
                </div>
              </div>

              {/* Artwork Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Artwork Selection *</h3>
                <div className="grid grid-cols-3 gap-4">
                  {availableArtwork.map((artwork) => (
                    <div
                      key={artwork.url}
                      onClick={() => toggleArtworkSelection(artwork.url, 'single')}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                        mintForm.selectedArtwork.some(asset => asset.getDirectURL() === artwork.url)
                          ? 'border-primary shadow-lg shadow-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={artwork.url} alt={artwork.name} className="w-full aspect-square object-cover" />
                      <div className="p-2 bg-muted/50 text-center">
                        <p className="text-xs font-medium">{artwork.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Or Upload Custom Artwork</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'single')}
                      className="flex-1"
                    />
                    {uploadedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeUploadedFile('single')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {uploadedFilePreview && (
                    <div className="space-y-2">
                      <img
                        src={uploadedFilePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                      />
                      {isUploading && (
                        <div className="space-y-1">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
                        </div>
                      )}
                      {!isUploading && uploadProgress === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUploadAndAttach('single')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Attach to NFT
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Provenance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Provenance Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provenanceProductName">Product Name</Label>
                    <Input
                      id="provenanceProductName"
                      value={mintForm.provenanceProductName}
                      onChange={(e) => setMintForm({ ...mintForm, provenanceProductName: e.target.value })}
                      placeholder="e.g., Premium Bonsai Kit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provenanceBatchNumber">Batch Number</Label>
                    <Input
                      id="provenanceBatchNumber"
                      value={mintForm.provenanceBatchNumber}
                      onChange={(e) => setMintForm({ ...mintForm, provenanceBatchNumber: e.target.value })}
                      placeholder="e.g., BATCH-001"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="provenancePhysicalHash">Physical Hash</Label>
                    <Input
                      id="provenancePhysicalHash"
                      value={mintForm.provenancePhysicalHash}
                      onChange={(e) => setMintForm({ ...mintForm, provenancePhysicalHash: e.target.value })}
                      placeholder="e.g., SHA256 hash of physical item"
                    />
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Attributes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAttribute('single')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Attribute
                    </Button>
                  </div>
                  {mintForm.provenanceAttributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Trait type"
                        value={attr.trait_type}
                        onChange={(e) => updateAttribute(index, 'trait_type', e.target.value, 'single')}
                      />
                      <Input
                        placeholder="Value"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value, 'single')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAttribute(index, 'single')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset_class">Asset Class</Label>
                    <Input
                      id="asset_class"
                      value={mintForm.asset_class}
                      onChange={(e) => setMintForm({ ...mintForm, asset_class: e.target.value })}
                      placeholder="e.g., Physical Product"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certification">Certification</Label>
                    <Input
                      id="certification"
                      value={mintForm.certification}
                      onChange={(e) => setMintForm({ ...mintForm, certification: e.target.value })}
                      placeholder="e.g., Certified Authentic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer_details">Manufacturer Details</Label>
                    <Input
                      id="manufacturer_details"
                      value={mintForm.manufacturer_details}
                      onChange={(e) => setMintForm({ ...mintForm, manufacturer_details: e.target.value })}
                      placeholder="e.g., Bonsai Artisans Co."
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

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="verified"
                      checked={mintForm.verified}
                      onCheckedChange={(checked) => setMintForm({ ...mintForm, verified: checked })}
                    />
                    <Label htmlFor="verified">Verified</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="mystery"
                      checked={mintForm.mystery}
                      onCheckedChange={(checked) => setMintForm({ ...mintForm, mystery: checked })}
                    />
                    <Label htmlFor="mystery">Mystery NFT</Label>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMintDialog(false)} disabled={isMinting}>
              Cancel
            </Button>
            <Button
              onClick={handleMintNFT}
              disabled={isMinting || mintForm.selectedArtwork.length === 0}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 mr-2" />
                  Mint NFT
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Mint Dialog - Similar structure to Single Mint */}
      <Dialog open={showBatchMintDialog} onOpenChange={setShowBatchMintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Batch Mint NFTs
            </DialogTitle>
            <DialogDescription>
              Create multiple ORIGYN-compliant NFTs with sequential numbering
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
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
                <p className="text-xs text-muted-foreground">NFTs will be numbered sequentially (e.g., #1, #2, #3...)</p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namePrefix">NFT Name Prefix *</Label>
                    <Input
                      id="namePrefix"
                      value={batchForm.namePrefix}
                      onChange={(e) => setBatchForm({ ...batchForm, namePrefix: e.target.value })}
                      placeholder="e.g., Bonsai NFT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchCollection">Collection *</Label>
                    <Input
                      id="batchCollection"
                      value={batchForm.collection}
                      onChange={(e) => setBatchForm({ ...batchForm, collection: e.target.value })}
                      placeholder="e.g., Spring Collection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchProduct">Product *</Label>
                    <Input
                      id="batchProduct"
                      value={batchForm.product}
                      onChange={(e) => setBatchForm({ ...batchForm, product: e.target.value })}
                      placeholder="e.g., Premium Bonsai Kit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountCodePrefix">Discount Code Prefix *</Label>
                    <Input
                      id="discountCodePrefix"
                      value={batchForm.discountCodePrefix}
                      onChange={(e) => setBatchForm({ ...batchForm, discountCodePrefix: e.target.value })}
                      placeholder="e.g., BONSAI"
                    />
                  </div>
                </div>
              </div>

              {/* Artwork Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Artwork Selection *</h3>
                <div className="grid grid-cols-3 gap-4">
                  {availableArtwork.map((artwork) => (
                    <div
                      key={artwork.url}
                      onClick={() => toggleArtworkSelection(artwork.url, 'batch')}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                        batchForm.selectedArtwork.some(asset => asset.getDirectURL() === artwork.url)
                          ? 'border-primary shadow-lg shadow-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={artwork.url} alt={artwork.name} className="w-full aspect-square object-cover" />
                      <div className="p-2 bg-muted/50 text-center">
                        <p className="text-xs font-medium">{artwork.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Or Upload Custom Artwork</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={batchFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'batch')}
                      className="flex-1"
                    />
                    {batchUploadedFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeUploadedFile('batch')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {batchUploadedFilePreview && (
                    <div className="space-y-2">
                      <img
                        src={batchUploadedFilePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                      />
                      {isBatchUploading && (
                        <div className="space-y-1">
                          <Progress value={batchUploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Uploading: {batchUploadProgress}%</p>
                        </div>
                      )}
                      {!isBatchUploading && batchUploadProgress === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUploadAndAttach('batch')}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Attach to NFTs
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Provenance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Provenance Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchProvenanceProductName">Product Name</Label>
                    <Input
                      id="batchProvenanceProductName"
                      value={batchForm.provenanceProductName}
                      onChange={(e) => setBatchForm({ ...batchForm, provenanceProductName: e.target.value })}
                      placeholder="e.g., Premium Bonsai Kit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchProvenanceBatchNumber">Batch Number</Label>
                    <Input
                      id="batchProvenanceBatchNumber"
                      value={batchForm.provenanceBatchNumber}
                      onChange={(e) => setBatchForm({ ...batchForm, provenanceBatchNumber: e.target.value })}
                      placeholder="e.g., BATCH-2025"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchMintDialog(false)} disabled={isBatchMinting}>
              Cancel
            </Button>
            <Button
              onClick={handleBatchMint}
              disabled={isBatchMinting || batchForm.selectedArtwork.length === 0}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isBatchMinting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Minting {batchCount} NFTs...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 mr-2" />
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
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Transfer NFT
            </DialogTitle>
            <DialogDescription>
              Transfer this NFT to another user's principal ID
            </DialogDescription>
          </DialogHeader>
          {selectedNFT && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-foreground">{selectedNFT.name}</h3>
                <p className="text-sm text-muted-foreground">Token ID: {selectedNFT.id.toString()}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferTo">Recipient Principal ID</Label>
                <Input
                  id="transferTo"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Enter principal ID"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)} disabled={isTransferring}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !transferTo}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isTransferring ? 'Transferring...' : 'Transfer NFT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption Details Dialog */}
      <Dialog open={showRedemptionDetails} onOpenChange={setShowRedemptionDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              Redemption Details
            </DialogTitle>
          </DialogHeader>
          {selectedRedemption && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">NFT Name</Label>
                  <p className="font-semibold">{selectedRedemption.metadata.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Token ID</Label>
                  <p className="font-mono">{selectedRedemption.nftId.toString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection</Label>
                  <p>{selectedRedemption.metadata.collection}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p>{selectedRedemption.metadata.product}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">User Principal</Label>
                  <p className="font-mono text-xs break-all">{selectedRedemption.user.toString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Redemption Date</Label>
                  <p>{new Date(Number(selectedRedemption.timestamp) / 1000000).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Discount Code</Label>
                  <code className="font-bold text-primary">{selectedRedemption.metadata.discountCode}</code>
                </div>
              </div>
              {selectedRedemption.metadata.media_assets && selectedRedemption.metadata.media_assets.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">NFT Image</Label>
                  <img
                    src={getMediaAssetDisplayUrl(selectedRedemption.metadata.media_assets[0])}
                    alt={selectedRedemption.metadata.name}
                    className="w-full max-w-md rounded-lg border-2 border-border mt-2"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowRedemptionDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
