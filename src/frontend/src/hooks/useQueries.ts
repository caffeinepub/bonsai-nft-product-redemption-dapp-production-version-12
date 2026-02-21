import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ORIGYNMetadata, RedemptionRecord, UserProfile, UserRole, TransactionRecord, AddressBookEntry, NFTData } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

// Media asset cache for persistent blob URLs
const mediaAssetCache = new Map<string, string>();

// Helper function to convert media assets to persistent blob URLs
export async function rehydrateMediaAssets(metadata: ORIGYNMetadata): Promise<ORIGYNMetadata> {
  if (!metadata.media_assets || metadata.media_assets.length === 0) {
    return metadata;
  }

  const rehydratedAssets = await Promise.all(
    metadata.media_assets.map(async (asset) => {
      const directUrl = asset.getDirectURL();
      
      // Check cache first
      if (mediaAssetCache.has(directUrl)) {
        return ExternalBlob.fromURL(mediaAssetCache.get(directUrl)!);
      }

      try {
        // Prefetch and cache the blob
        const bytes = await asset.getBytes();
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const objectUrl = URL.createObjectURL(blob);
        
        // Cache the object URL
        mediaAssetCache.set(directUrl, objectUrl);
        
        return ExternalBlob.fromURL(directUrl);
      } catch (error) {
        console.warn('Failed to rehydrate media asset:', error);
        return asset;
      }
    })
  );

  return {
    ...metadata,
    media_assets: rehydratedAssets,
  };
}

// Helper function to get cached or direct URL for display
export function getMediaAssetDisplayUrl(asset: ExternalBlob): string {
  const directUrl = asset.getDirectURL();
  
  // Return cached object URL if available, otherwise return direct URL
  if (mediaAssetCache.has(directUrl)) {
    return mediaAssetCache.get(directUrl)!;
  }
  
  return directUrl;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        // If user is not initialized yet, return null instead of throwing
        if (error.message?.includes('guest') || error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useInitializeAccessControl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.initializeAccessControl();
    },
    onSuccess: () => {
      // Invalidate user role and profile queries after initialization
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      // Silently handle if already initialized
      if (!error.message?.includes('already initialized')) {
        console.error('Failed to initialize access control:', error);
      }
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      
      // Ensure user is initialized before saving profile
      try {
        await actor.initializeAccessControl();
      } catch (error: any) {
        // Ignore if already initialized
        if (!error.message?.includes('already initialized')) {
          console.log('Initialization attempted:', error.message);
        }
      }
      
      // Small delay to ensure backend state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
    },
    onError: (error: Error) => {
      console.error('Profile save error:', error);
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('guest')) {
        toast.error('Please wait a moment and try again. Your account is being initialized.');
      } else if (errorMessage.includes('Anonymous')) {
        toast.error('Please log in to save your profile.');
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetOwnedNFTs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ORIGYNMetadata[]>({
    queryKey: ['ownedNFTs'],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getOwnedNFTs();
      // Rehydrate media assets for persistent display
      return Promise.all(nfts.map(rehydrateMediaAssets));
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUserNFTs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<NFTData[]>({
    queryKey: ['userNFTs', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getUserNFTs();
      // Rehydrate media assets for persistent display
      return Promise.all(
        nfts.map(async (nft) => ({
          ...nft,
          origyn_metadata: await rehydrateMediaAssets(nft.origyn_metadata),
        }))
      );
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetAllNFTs() {
  const { actor, isFetching } = useActor();

  return useQuery<ORIGYNMetadata[]>({
    queryKey: ['allNFTs'],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getAllNFTs();
      // Rehydrate media assets for persistent display
      return Promise.all(nfts.map(rehydrateMediaAssets));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetRedemptionHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<RedemptionRecord[]>({
    queryKey: ['redemptionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getRedemptionHistory();
      // Rehydrate media assets in redemption records
      return Promise.all(
        history.map(async (record) => ({
          ...record,
          metadata: await rehydrateMediaAssets(record.metadata),
        }))
      );
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransactionRecord[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getTransactionHistory();
      // Rehydrate media assets in transaction records
      return Promise.all(
        history.map(async (record) => ({
          ...record,
          metadata: await rehydrateMediaAssets(record.metadata),
        }))
      );
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetAllTransactionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionRecord[]>({
    queryKey: ['allTransactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getAllTransactionHistory();
      // Rehydrate media assets in transaction records
      return Promise.all(
        history.map(async (record) => ({
          ...record,
          metadata: await rehydrateMediaAssets(record.metadata),
        }))
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetAddressBook() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AddressBookEntry[]>({
    queryKey: ['addressBook'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAddressBook();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddAddressBookEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ principal, nickname }: { principal: Principal; nickname: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAddressBookEntry(principal, nickname);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addressBook'] });
      toast.success('Contact added to address book');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });
}

export function useUpdateAddressBookEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ principal, newNickname }: { principal: Principal; newNickname: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAddressBookEntry(principal, newNickname);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addressBook'] });
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

export function useDeleteAddressBookEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAddressBookEntry(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addressBook'] });
      toast.success('Contact removed from address book');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove contact: ${error.message}`);
    },
  });
}

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, bigint][]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsLeaderboardVisible() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['leaderboardVisible'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isLeaderboardVisible();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetArchivedNFT() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (nftId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const metadata = await actor.getArchivedNFT(nftId);
      // Rehydrate media assets for archived NFT
      return rehydrateMediaAssets(metadata);
    },
    onError: (error: Error) => {
      toast.error(`Failed to fetch archived NFT: ${error.message}`);
    },
  });
}

export function useMintNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ metadata, mediaAssets }: { metadata: ORIGYNMetadata; mediaAssets: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      const tokenId = await actor.mintNFT(metadata, mediaAssets);
      return tokenId;
    },
    onSuccess: (tokenId) => {
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success(`NFT minted successfully! Token ID: ${tokenId}`);
    },
    onError: (error: Error) => {
      console.error('Mint error:', error);
      toast.error(`Failed to mint NFT: ${error.message}`);
    },
  });
}

export function useBatchMintNFTs() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ metadataList, mediaAssetsList }: { metadataList: ORIGYNMetadata[]; mediaAssetsList: ExternalBlob[][] }) => {
      if (!actor) throw new Error('Actor not available');
      const tokenIds = await actor.batchMintNFTs(metadataList, mediaAssetsList);
      return tokenIds;
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success(`${ids.length} NFTs minted successfully!`);
    },
    onError: (error: Error) => {
      console.error('Batch mint error:', error);
      toast.error(`Failed to batch mint NFTs: ${error.message}`);
    },
  });
}

export function useBurnNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nftId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.burnNFT(nftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['redemptionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success('NFT redeemed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to redeem NFT: ${error.message}`);
    },
  });
}

export function useTransferNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nftId, to }: { nftId: bigint; to: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.transferNFT(nftId, to);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success('NFT transferred successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to transfer NFT: ${error.message}`);
    },
  });
}

export function useToggleLeaderboardVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleLeaderboardVisibility();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboardVisible'] });
      toast.success('Leaderboard visibility toggled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle leaderboard: ${error.message}`);
    },
  });
}
