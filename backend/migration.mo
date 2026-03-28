import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Storage "blob-storage/Storage";

module {
  type OldORIGYNMetadata = {
    id : Nat;
    name : Text;
    collection : Text;
    product : Text;
    verified : Bool;
    discountCode : Text;
    mystery : Bool;
    redeemed : Bool;
    asset_class : Text;
    certification : Text;
    provenance_id : Text;
    manufacturer_details : Text;
    issue_date : Text;
    media_assets : [Storage.ExternalBlob];
    provenance : OldProvenanceID;
  };

  type OldProvenanceID = {
    id : Text;
    productName : Text;
    batchNumber : Text;
    creationDate : Int;
    attributes : [{ trait_type : Text; value : Text }];
    physicalHash : Text;
  };

  type OldNFTData = {
    id : Nat;
    name : Text;
    collection : Text;
    product : Text;
    verified : Bool;
    discountCode : Text;
    mystery : Bool;
    redeemed : Bool;
    asset_class : Text;
    certification : Text;
    provenance_id : Text;
    manufacturer_details : Text;
    issue_date : Text;
    media_assets : [Storage.ExternalBlob];
    provenance : OldProvenanceID;
    owner : Principal;
    creationTimestamp : Time.Time;
    origyn_metadata : OldORIGYNMetadata;
  };

  type OldTransactionType = {
    #mint;
    #burn;
    #transfer;
  };

  type OldTransactionRecord = {
    transactionType : OldTransactionType;
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : OldORIGYNMetadata;
    from : ?Principal;
    to : ?Principal;
  };

  type OldRedemptionRecord = {
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : OldORIGYNMetadata;
  };

  type OldActor = {
    nftStore : OrderedMap.Map<Nat, OldORIGYNMetadata>;
    fullNFTStore : OrderedMap.Map<Nat, OldNFTData>;
    ownership : OrderedMap.Map<Principal, [Nat]>;
    redemptionHistory : OrderedMap.Map<Principal, [OldRedemptionRecord]>;
    transactionHistory : OrderedMap.Map<Principal, [OldTransactionRecord]>;
    nextNftId : Nat;
    leaderboardVisible : Bool;
  };

  type NewProvenanceID = {
    id : Text;
    productName : Text;
    batchNumber : Text;
    creationDate : Int;
    attributes : [{ trait_type : Text; value : Text }];
    physicalHash : Text;
  };

  type NewORIGYNMetadata = {
    id : Nat;
    name : Text;
    collection : Text;
    product : Text;
    verified : Bool;
    discountCode : ?Text;
    mystery : Bool;
    redeemed : Bool;
    asset_class : Text;
    certification : Text;
    provenance_id : Text;
    manufacturer_details : Text;
    issue_date : Text;
    media_assets : [Storage.ExternalBlob];
    provenance : NewProvenanceID;
  };

  // Public metadata without discount code (used in redemption history and transaction history)
  type PublicORIGYNMetadata = {
    id : Nat;
    name : Text;
    collection : Text;
    product : Text;
    verified : Bool;
    mystery : Bool;
    redeemed : Bool;
    asset_class : Text;
    certification : Text;
    provenance_id : Text;
    manufacturer_details : Text;
    issue_date : Text;
    media_assets : [Storage.ExternalBlob];
    provenance : NewProvenanceID;
  };

  type NewNFTData = {
    id : Nat;
    name : Text;
    collection : Text;
    product : Text;
    verified : Bool;
    discountCode : ?Text;
    mystery : Bool;
    redeemed : Bool;
    asset_class : Text;
    certification : Text;
    provenance_id : Text;
    manufacturer_details : Text;
    issue_date : Text;
    media_assets : [Storage.ExternalBlob];
    provenance : NewProvenanceID;
    owner : Principal;
    creationTimestamp : Time.Time;
    origyn_metadata : NewORIGYNMetadata;
  };

  type NewTransactionType = {
    #mint;
    #burn;
    #transfer;
  };

  type NewTransactionRecord = {
    transactionType : NewTransactionType;
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : NewORIGYNMetadata;
    from : ?Principal;
    to : ?Principal;
  };

  // New redemption record uses PublicORIGYNMetadata (no discount code in metadata)
  // and stores the discount code separately.
  type NewRedemptionRecord = {
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : PublicORIGYNMetadata;
    discountCode : Text;
  };

  type NewActor = {
    nftStore : OrderedMap.Map<Nat, NewORIGYNMetadata>;
    fullNFTStore : OrderedMap.Map<Nat, NewNFTData>;
    ownership : OrderedMap.Map<Principal, [Nat]>;
    redemptionHistory : OrderedMap.Map<Principal, [NewRedemptionRecord]>;
    transactionHistory : OrderedMap.Map<Principal, [NewTransactionRecord]>;
    nextNftId : Nat;
    leaderboardVisible : Bool;
  };

  func convertProvenanceID(old : OldProvenanceID) : NewProvenanceID {
    {
      id = old.id;
      productName = old.productName;
      batchNumber = old.batchNumber;
      creationDate = old.creationDate;
      attributes = old.attributes;
      physicalHash = old.physicalHash;
    };
  };

  func convertOldToNewORIGYNMetadata(old : OldORIGYNMetadata) : NewORIGYNMetadata {
    {
      old with
      discountCode = ?old.discountCode;
      provenance = convertProvenanceID(old.provenance);
    };
  };

  func convertOldToNewORIGYNMetadataToPublic(old : OldORIGYNMetadata) : PublicORIGYNMetadata {
    {
      id = old.id;
      name = old.name;
      collection = old.collection;
      product = old.product;
      verified = old.verified;
      mystery = old.mystery;
      redeemed = old.redeemed;
      asset_class = old.asset_class;
      certification = old.certification;
      provenance_id = old.provenance_id;
      manufacturer_details = old.manufacturer_details;
      issue_date = old.issue_date;
      media_assets = old.media_assets;
      provenance = convertProvenanceID(old.provenance);
    };
  };

  func convertOldToNewNFTData(old : OldNFTData) : NewNFTData {
    {
      old with
      discountCode = ?old.discountCode;
      provenance = convertProvenanceID(old.provenance);
      origyn_metadata = convertOldToNewORIGYNMetadata(old.origyn_metadata);
    };
  };

  func convertOldToNewTransactionRecord(old : OldTransactionRecord) : NewTransactionRecord {
    {
      old with
      metadata = convertOldToNewORIGYNMetadata(old.metadata);
    };
  };

  // Old redemption records did not have a discountCode field; use empty string as fallback.
  func convertOldToNewRedemptionRecord(old : OldRedemptionRecord) : NewRedemptionRecord {
    {
      nftId = old.nftId;
      user = old.user;
      timestamp = old.timestamp;
      metadata = convertOldToNewORIGYNMetadataToPublic(old.metadata);
      discountCode = "";
    };
  };

  public func run(old : OldActor) : NewActor {
    let natMap = OrderedMap.Make<Nat>(Nat.compare);
    let principalMap = OrderedMap.Make<Principal>(Principal.compare);

    let nftStore = natMap.map<OldORIGYNMetadata, NewORIGYNMetadata>(
      old.nftStore,
      func(_, v) { convertOldToNewORIGYNMetadata(v) },
    );
    let fullNFTStore = natMap.map<OldNFTData, NewNFTData>(
      old.fullNFTStore,
      func(_, v) { convertOldToNewNFTData(v) },
    );
    let ownership = principalMap.map<[Nat], [Nat]>(
      old.ownership,
      func(_, v) { v },
    );
    let redemptionHistory = principalMap.map<[OldRedemptionRecord], [NewRedemptionRecord]>(
      old.redemptionHistory,
      func(_, v) {
        Array.map<OldRedemptionRecord, NewRedemptionRecord>(v, convertOldToNewRedemptionRecord);
      },
    );
    let transactionHistory = principalMap.map<[OldTransactionRecord], [NewTransactionRecord]>(
      old.transactionHistory,
      func(_, v) {
        Array.map<OldTransactionRecord, NewTransactionRecord>(v, convertOldToNewTransactionRecord);
      },
    );

    {
      old with
      nftStore;
      fullNFTStore;
      ownership;
      redemptionHistory;
      transactionHistory;
    };
  };
};

