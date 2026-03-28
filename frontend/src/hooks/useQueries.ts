import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  PublicNFTData,
  PublicORIGYNMetadata,
  RedemptionRecord,
  PublicTransactionRecord,
  ORIGYNMetadata,
  TransactionRecord,
  AddressBookEntry,
} from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

// ─── Media asset helpers ──────────────────────────────────────────────────────

const mediaAssetCache = new Map<string, string>();

export function getMediaAssetDisplayUrl(asset: ExternalBlob): string {
  const directUrl = asset.getDirectURL();
  if (mediaAssetCache.has(directUrl)) {
    return mediaAssetCache.get(directUrl)!;
  }
  return directUrl;
}

function rehydrateItem<T extends { media_assets: ExternalBlob[] }>(item: T): T {
  return {
    ...item,
    media_assets: item.media_assets.map((asset) =>
      ExternalBlob.fromURL(asset.getDirectURL())
    ),
  };
}

// ─── User profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        if (error.message?.includes('guest') || error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      try {
        await actor.initializeAccessControl();
      } catch (error: any) {
        if (!error.message?.includes('already initialized')) {
          // ignore
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
    },
    onError: (error: Error) => {
      const msg = error.message || '';
      if (msg.includes('Unauthorized') || msg.includes('guest')) {
        toast.error('Please wait a moment and try again. Your account is being initialized.');
      } else if (msg.includes('Anonymous')) {
        toast.error('Please log in to save your profile.');
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    },
  });
}

// ─── Access control ───────────────────────────────────────────────────────────

export function useInitializeAccessControl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.initializeAccessControl();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      if (!error.message?.includes('already initialized')) {
        console.error('Failed to initialize access control:', error);
      }
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── NFTs ─────────────────────────────────────────────────────────────────────

export function useUserNFTs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicNFTData[]>({
    queryKey: ['userNFTs'],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getUserNFTs();
      return nfts.map((nft) => ({
        ...nft,
        media_assets: nft.media_assets.map((a) => ExternalBlob.fromURL(a.getDirectURL())),
        origyn_metadata: rehydrateItem(nft.origyn_metadata),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOwnedNFTs() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicORIGYNMetadata[]>({
    queryKey: ['ownedNFTs'],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getOwnedNFTs();
      return nfts.map(rehydrateItem);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetAllNFTs() {
  const { actor, isFetching } = useActor();

  return useQuery<ORIGYNMetadata[]>({
    queryKey: ['allNFTs'],
    queryFn: async () => {
      if (!actor) return [];
      const nfts = await actor.getAllNFTs();
      return nfts.map(rehydrateItem);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetArchivedNFT() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (nftId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const metadata = await actor.getArchivedNFT(nftId);
      return rehydrateItem(metadata);
    },
    onError: (error: Error) => {
      toast.error(`Failed to fetch archived NFT: ${error.message}`);
    },
  });
}

// ─── Transactions & history ───────────────────────────────────────────────────

export function useGetRedemptionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<RedemptionRecord[]>({
    queryKey: ['redemptionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getRedemptionHistory();
      return history.map((record) => ({
        ...record,
        metadata: rehydrateItem(record.metadata),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTransactionRecord[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getTransactionHistory();
      return history.map((record) => ({
        ...record,
        metadata: rehydrateItem(record.metadata),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetAllTransactionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<TransactionRecord[]>({
    queryKey: ['allTransactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getAllTransactionHistory();
      return history.map((record) => ({
        ...record,
        metadata: rehydrateItem(record.metadata),
      }));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetNFTTransactionHistory(nftId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicTransactionRecord[]>({
    queryKey: ['nftTransactionHistory', nftId?.toString()],
    queryFn: async () => {
      if (!actor || nftId === null) return [];
      const history = await actor.getTransactionHistory();
      return history
        .filter((record) => record.nftId === nftId)
        .map((record) => ({
          ...record,
          metadata: rehydrateItem(record.metadata),
        }));
    },
    enabled: !!actor && !isFetching && nftId !== null,
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

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
      if (!actor) return true;
      return actor.isLeaderboardVisible();
    },
    enabled: !!actor && !isFetching,
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

// ─── Address book ─────────────────────────────────────────────────────────────

export function useGetAddressBook() {
  const { actor, isFetching } = useActor();

  return useQuery<AddressBookEntry[]>({
    queryKey: ['addressBook'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAddressBook();
    },
    enabled: !!actor && !isFetching,
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

// ─── Mint / Burn / Transfer ───────────────────────────────────────────────────

export function useMintNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      metadata,
      mediaAssets,
    }: {
      metadata: ORIGYNMetadata;
      mediaAssets: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.mintNFT(metadata, mediaAssets);
    },
    onSuccess: (tokenId) => {
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success(`NFT minted successfully! Token ID: ${tokenId}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to mint NFT: ${error.message}`);
    },
  });
}

export function useBatchMintNFTs() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      metadataList,
      mediaAssetsList,
    }: {
      metadataList: ORIGYNMetadata[];
      mediaAssetsList: ExternalBlob[][];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.batchMintNFTs(metadataList, mediaAssetsList);
    },
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
      toast.success(`${ids.length} NFTs minted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to batch mint NFTs: ${error.message}`);
    },
  });
}

export function useBurnNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nftId: bigint): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.burnNFT(nftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['ownedNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['redemptionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['allNFTs'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactionHistory'] });
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
