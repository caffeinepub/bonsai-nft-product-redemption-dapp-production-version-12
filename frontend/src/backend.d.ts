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
export interface PublicNFTData {
    id: bigint;
    provenance: ProvenanceID;
    verified: boolean;
    manufacturer_details: string;
    provenance_id: string;
    collection: string;
    owner: Principal;
    creationTimestamp: Time;
    redeemed: boolean;
    name: string;
    origyn_metadata: PublicORIGYNMetadata;
    certification: string;
    mystery: boolean;
    asset_class: string;
    issue_date: string;
    media_assets: Array<ExternalBlob>;
    product: string;
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
    discountCode?: string;
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
    discountCode: string;
    metadata: PublicORIGYNMetadata;
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
export interface PublicTransactionRecord {
    to?: Principal;
    transactionType: TransactionType;
    metadata: PublicORIGYNMetadata;
    from?: Principal;
    user: Principal;
    nftId: bigint;
    timestamp: Time;
}
export interface PublicORIGYNMetadata {
    id: bigint;
    provenance: ProvenanceID;
    verified: boolean;
    manufacturer_details: string;
    provenance_id: string;
    collection: string;
    redeemed: boolean;
    name: string;
    certification: string;
    mystery: boolean;
    asset_class: string;
    issue_date: string;
    media_assets: Array<ExternalBlob>;
    product: string;
}
export interface AddressBookEntry {
    principal: Principal;
    nickname: string;
    createdAt: Time;
    updatedAt: Time;
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
    burnNFT(nftId: bigint): Promise<string>;
    deleteAddressBookEntry(principal: Principal): Promise<void>;
    getAddressBook(): Promise<Array<AddressBookEntry>>;
    getAllNFTs(): Promise<Array<ORIGYNMetadata>>;
    getAllTransactionHistory(): Promise<Array<TransactionRecord>>;
    getArchivedNFT(nftId: bigint): Promise<ORIGYNMetadata>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeaderboard(): Promise<Array<[Principal, bigint]>>;
    getOwnedNFTs(): Promise<Array<PublicORIGYNMetadata>>;
    getRedemptionHistory(): Promise<Array<RedemptionRecord>>;
    getTransactionHistory(): Promise<Array<PublicTransactionRecord>>;
    getUserNFTs(): Promise<Array<PublicNFTData>>;
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
