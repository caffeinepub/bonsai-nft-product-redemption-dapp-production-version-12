import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ProvenanceID {
    id: string;
    productName: string;
    physicalHash: string;
    creationDate: bigint;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    batchNumber: string;
}
export type Time = bigint;
export interface ORIGYNMetadata {
    id: bigint;
    provenance: ProvenanceID;
    verified: boolean;
    manufacturer_details: string;
    provenance_id: string;
    collection: string;
    discountCode: string;
    redeemed: boolean;
    name: string;
    certification: string;
    mystery: boolean;
    asset_class: string;
    issue_date: string;
    media_assets: Array<ExternalBlob>;
    product: string;
}
export interface RedemptionRecord {
    metadata: ORIGYNMetadata;
    user: Principal;
    nftId: bigint;
    timestamp: Time;
}
export interface TransactionRecord {
    to?: Principal;
    transactionType: TransactionType;
    metadata: ORIGYNMetadata;
    from?: Principal;
    user: Principal;
    nftId: bigint;
    timestamp: Time;
}
export interface AddressBookEntry {
    principal: Principal;
    nickname: string;
    createdAt: Time;
    updatedAt: Time;
}
export interface NFTData {
    id: bigint;
    provenance: ProvenanceID;
    verified: boolean;
    manufacturer_details: string;
    provenance_id: string;
    collection: string;
    owner: Principal;
    creationTimestamp: Time;
    discountCode: string;
    redeemed: boolean;
    name: string;
    origyn_metadata: ORIGYNMetadata;
    certification: string;
    mystery: boolean;
    asset_class: string;
    issue_date: string;
    media_assets: Array<ExternalBlob>;
    product: string;
}
export interface UserProfile {
    bio: string;
    displayName: string;
    profileImage?: ExternalBlob;
    forgeTheme: string;
}
export enum TransactionType {
    burn = "burn",
    mint = "mint",
    transfer = "transfer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAddressBookEntry(principal: Principal, nickname: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    batchMintNFTs(metadataList: Array<ORIGYNMetadata>, mediaAssetsList: Array<Array<ExternalBlob>>): Promise<Array<bigint>>;
    burnNFT(nftId: bigint): Promise<void>;
    deleteAddressBookEntry(principal: Principal): Promise<void>;
    getAddressBook(): Promise<Array<AddressBookEntry>>;
    getAllNFTs(): Promise<Array<ORIGYNMetadata>>;
    getAllTransactionHistory(): Promise<Array<TransactionRecord>>;
    getArchivedNFT(nftId: bigint): Promise<ORIGYNMetadata>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeaderboard(): Promise<Array<[Principal, bigint]>>;
    getOwnedNFTs(): Promise<Array<ORIGYNMetadata>>;
    getRedemptionHistory(): Promise<Array<RedemptionRecord>>;
    getTransactionHistory(): Promise<Array<TransactionRecord>>;
    getUserNFTs(): Promise<Array<NFTData>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isLeaderboardVisible(): Promise<boolean>;
    mintNFT(metadata: ORIGYNMetadata, mediaAssets: Array<ExternalBlob>): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLeaderboardVisibility(): Promise<void>;
    transferNFT(nftId: bigint, to: Principal): Promise<void>;
    updateAddressBookEntry(principal: Principal, newNickname: string): Promise<void>;
}
