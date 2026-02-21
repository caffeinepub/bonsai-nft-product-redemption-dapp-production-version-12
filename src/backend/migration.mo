import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Storage "blob-storage/Storage";

module {
  type oldProvenanceID = {
    id : Text;
    productName : Text;
    batchNumber : Text;
    creationDate : Int;
    attributes : [{ trait_type : Text; value : Text }];
    physicalHash : Text;
  };

  type oldORIGYNMetadata = {
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
    provenance : oldProvenanceID;
  };

  type OldActor = {
    nftStore : OrderedMap.Map<Nat, oldORIGYNMetadata>;
  };

  public func run(old : OldActor) : {} {
    let natMap = OrderedMap.Make<Nat>(Nat.compare);

    // New fields should be initialized in the actor, not returned from migration
    let fullNFTStore = natMap.map<oldORIGYNMetadata, oldORIGYNMetadata>(
      old.nftStore,
      func(_key, metadata) { metadata },
    );

    {
      // Empty object since var fields are now initialized in the actor
    };
  };
};

