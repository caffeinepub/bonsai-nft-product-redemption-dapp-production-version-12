import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import List "mo:base/List";



persistent actor BonsaiNFT {
  let accessControlState = AccessControl.initState();

  let storage = Storage.new();
  include MixinStorage(storage);

  // Helper function to ensure user is initialized
  func ensureUserInitialized(caller : Principal) {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot perform this action");
    };

    let currentRole = AccessControl.getUserRole(accessControlState, caller);

    switch (currentRole) {
      case (#guest) {
        AccessControl.initialize(accessControlState, caller);
      };
      case (_) {};
    };
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Debug.trap("Unauthorized: Only the permanent admin can assign roles");
    };
    if (role == #admin) {
      Debug.trap("Admin role cannot be reassigned");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    displayName : Text;
    bio : Text;
    profileImage : ?Storage.ExternalBlob;
    forgeTheme : Text;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view profiles");
    };

    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    if (currentRole == #guest) {
      return null;
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view profiles");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot save profiles");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };

    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public type AddressBookEntry = {
    principal : Principal;
    nickname : Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  var addressBooks = principalMap.empty<[AddressBookEntry]>();

  public shared ({ caller }) func addAddressBookEntry(principal : Principal, nickname : Text) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot manage address book");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can manage address book");
    };

    let entry : AddressBookEntry = {
      principal;
      nickname;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    let currentEntries = switch (principalMap.get(addressBooks, caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };

    addressBooks := principalMap.put(addressBooks, caller, Array.append(currentEntries, [entry]));
  };

  public shared ({ caller }) func updateAddressBookEntry(principal : Principal, newNickname : Text) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot manage address book");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can manage address book");
    };

    let currentEntries = switch (principalMap.get(addressBooks, caller)) {
      case (null) { Debug.trap("Address book entry not found") };
      case (?entries) { entries };
    };

    let updatedEntries = Array.map<AddressBookEntry, AddressBookEntry>(
      currentEntries,
      func(entry) {
        if (entry.principal == principal) {
          {
            entry with
            nickname = newNickname;
            updatedAt = Time.now();
          };
        } else {
          entry;
        };
      },
    );

    addressBooks := principalMap.put(addressBooks, caller, updatedEntries);
  };

  public shared ({ caller }) func deleteAddressBookEntry(principal : Principal) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot manage address book");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can manage address book");
    };

    let currentEntries = switch (principalMap.get(addressBooks, caller)) {
      case (null) { Debug.trap("Address book entry not found") };
      case (?entries) { entries };
    };

    let filteredEntries = Array.filter<AddressBookEntry>(
      currentEntries,
      func(entry) { entry.principal != principal },
    );

    addressBooks := principalMap.put(addressBooks, caller, filteredEntries);
  };

  public query ({ caller }) func getAddressBook() : async [AddressBookEntry] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view address book");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    switch (principalMap.get(addressBooks, caller)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  public type ProvenanceID = {
    id : Text;
    productName : Text;
    batchNumber : Text;
    creationDate : Int;
    attributes : [{ trait_type : Text; value : Text }];
    physicalHash : Text;
  };

  public type ORIGYNMetadata = {
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
    provenance : ProvenanceID;
  };

  public type TransactionType = {
    #mint;
    #burn;
    #transfer;
  };

  public type TransactionRecord = {
    transactionType : TransactionType;
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : ORIGYNMetadata;
    from : ?Principal;
    to : ?Principal;
  };

  public type RedemptionRecord = {
    nftId : Nat;
    user : Principal;
    timestamp : Time.Time;
    metadata : ORIGYNMetadata;
  };

  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  var nftStore = natMap.empty<ORIGYNMetadata>();

  var ownership = principalMap.empty<[Nat]>();
  var redemptionHistory = principalMap.empty<[RedemptionRecord]>();
  var transactionHistory = principalMap.empty<[TransactionRecord]>();
  var nextNftId = 0;
  var leaderboardVisible = true;

  func ownsNFT(user : Principal, nftId : Nat) : Bool {
    switch (principalMap.get(ownership, user)) {
      case (null) { false };
      case (?nftIds) {
        Array.find<Nat>(nftIds, func(id) { id == nftId }) != null;
      };
    };
  };

  func removeNFTFromOwner(user : Principal, nftId : Nat) {
    switch (principalMap.get(ownership, user)) {
      case (null) {};
      case (?nftIds) {
        let filtered = Array.filter<Nat>(nftIds, func(id) { id != nftId });
        ownership := principalMap.put(ownership, user, filtered);
      };
    };
  };

  func addNFTToOwner(user : Principal, nftId : Nat) {
    let currentNFTs = switch (principalMap.get(ownership, user)) {
      case (null) { [] };
      case (?nftIds) { nftIds };
    };
    ownership := principalMap.put(ownership, user, Array.append(currentNFTs, [nftId]));
  };

  func logTransaction(record : TransactionRecord) {
    let currentHistory = switch (principalMap.get(transactionHistory, record.user)) {
      case (null) { [] };
      case (?history) { history };
    };
    transactionHistory := principalMap.put(transactionHistory, record.user, Array.append(currentHistory, [record]));
  };

  public shared ({ caller }) func mintNFT(metadata : ORIGYNMetadata, mediaAssets : [Storage.ExternalBlob]) : async Nat {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot mint NFTs");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can mint NFTs");
    };

    let nftId = nextNftId;
    let newMetadata = {
      metadata with
      id = nftId;
      redeemed = false;
      media_assets = mediaAssets;
    };

    nftStore := natMap.put(nftStore, nftId, newMetadata);
    addNFTToOwner(caller, nftId);
    nextNftId += 1;

    let transactionRecord : TransactionRecord = {
      transactionType = #mint;
      nftId;
      user = caller;
      timestamp = Time.now();
      metadata = newMetadata;
      from = null;
      to = ?caller;
    };

    logTransaction(transactionRecord);
    nftId;
  };

  public shared ({ caller }) func batchMintNFTs(metadataList : [ORIGYNMetadata], mediaAssetsList : [[Storage.ExternalBlob]]) : async [Nat] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot mint NFTs");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can mint NFTs");
    };

    if (metadataList.size() != mediaAssetsList.size()) {
      Debug.trap("Metadata and media assets list size mismatch");
    };

    let buffer = Buffer.Buffer<Nat>(metadataList.size());
    for (i in Iter.range(0, metadataList.size() - 1)) {
      let metadata = metadataList[i];
      let mediaAssets = mediaAssetsList[i];

      let nftId = nextNftId;
      let newMetadata = {
        metadata with
        id = nftId;
        redeemed = false;
        media_assets = mediaAssets;
      };

      nftStore := natMap.put(nftStore, nftId, newMetadata);
      addNFTToOwner(caller, nftId);
      buffer.add(nftId);
      nextNftId += 1;

      let transactionRecord : TransactionRecord = {
        transactionType = #mint;
        nftId;
        user = caller;
        timestamp = Time.now();
        metadata = newMetadata;
        from = null;
        to = ?caller;
      };

      logTransaction(transactionRecord);
    };
    Buffer.toArray(buffer);
  };

  public shared ({ caller }) func transferNFT(nftId : Nat, to : Principal) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot transfer NFTs");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can transfer NFTs");
    };

    switch (natMap.get(nftStore, nftId)) {
      case (null) { Debug.trap("NFT not found") };
      case (?metadata) {
        if (metadata.redeemed) {
          Debug.trap("Cannot transfer redeemed NFT");
        };

        if (not ownsNFT(caller, nftId) and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: You do not own this NFT");
        };

        var found = false;
        var fromPrincipal : ?Principal = null;
        for ((owner, nftIds) in principalMap.entries(ownership)) {
          if (ownsNFT(owner, nftId)) {
            removeNFTFromOwner(owner, nftId);
            found := true;
            fromPrincipal := ?owner;
          };
        };

        if (not found) {
          Debug.trap("NFT has no current owner");
        };

        addNFTToOwner(to, nftId);

        let transactionRecord : TransactionRecord = {
          transactionType = #transfer;
          nftId;
          user = caller;
          timestamp = Time.now();
          metadata;
          from = fromPrincipal;
          to = ?to;
        };

        logTransaction(transactionRecord);
      };
    };
  };

  public shared ({ caller }) func burnNFT(nftId : Nat) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot burn NFTs");
    };

    ensureUserInitialized(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can burn NFTs");
    };

    if (not ownsNFT(caller, nftId)) {
      Debug.trap("Unauthorized: You do not own this NFT");
    };

    switch (natMap.get(nftStore, nftId)) {
      case (null) { Debug.trap("NFT not found") };
      case (?metadata) {
        if (metadata.redeemed) {
          Debug.trap("NFT already redeemed");
        };

        let deepCopiedMediaAssets = Array.map<Storage.ExternalBlob, Storage.ExternalBlob>(metadata.media_assets, func(asset) { asset });

        let updatedMetadata = {
          metadata with
          redeemed = true;
          media_assets = deepCopiedMediaAssets;
        };

        nftStore := natMap.put(nftStore, nftId, updatedMetadata);
        removeNFTFromOwner(caller, nftId);

        let redemptionRecord = {
          nftId;
          user = caller;
          timestamp = Time.now();
          metadata = updatedMetadata;
        };

        let userHistory = switch (principalMap.get(redemptionHistory, caller)) {
          case (null) { [] };
          case (?history) { history };
        };

        redemptionHistory := principalMap.put(redemptionHistory, caller, Array.append(userHistory, [redemptionRecord]));

        let transactionRecord : TransactionRecord = {
          transactionType = #burn;
          nftId;
          user = caller;
          timestamp = Time.now();
          metadata = updatedMetadata;
          from = ?caller;
          to = null;
        };

        logTransaction(transactionRecord);
      };
    };
  };

  public query ({ caller }) func getOwnedNFTs() : async [ORIGYNMetadata] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view owned NFTs");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    switch (principalMap.get(ownership, caller)) {
      case (null) { [] };
      case (?nftIds) {
        let buffer = Buffer.Buffer<ORIGYNMetadata>(nftIds.size());
        for (id in nftIds.vals()) {
          switch (natMap.get(nftStore, id)) {
            case (?metadata) { buffer.add(metadata) };
            case (null) {};
          };
        };
        Buffer.toArray(buffer);
      };
    };
  };

  public query ({ caller }) func getRedemptionHistory() : async [RedemptionRecord] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view redemption history");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    switch (principalMap.get(redemptionHistory, caller)) {
      case (null) { [] };
      case (?history) { history };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [TransactionRecord] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view transaction history");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    switch (principalMap.get(transactionHistory, caller)) {
      case (null) { [] };
      case (?history) { history };
    };
  };

  public query ({ caller }) func getAllTransactionHistory() : async [TransactionRecord] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view all transaction history");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all transaction history");
    };

    var allTransactions = List.nil<TransactionRecord>();
    for ((_, history) in principalMap.entries(transactionHistory)) {
      for (record in history.vals()) {
        allTransactions := List.push(record, allTransactions);
      };
    };
    List.toArray(allTransactions);
  };

  public query ({ caller }) func getAllNFTs() : async [ORIGYNMetadata] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view all NFTs");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all NFTs");
    };
    Iter.toArray(natMap.vals(nftStore));
  };

  public shared ({ caller }) func toggleLeaderboardVisibility() : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot toggle leaderboard visibility");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can toggle leaderboard visibility");
    };
    leaderboardVisible := not leaderboardVisible;
  };

  public query ({ caller }) func getLeaderboard() : async [(Principal, Nat)] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view leaderboard");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view leaderboard");
    };

    if (not leaderboardVisible) {
      return [];
    };

    let buffer = Buffer.Buffer<(Principal, Nat)>(principalMap.size(redemptionHistory));
    for ((user, history) in principalMap.entries(redemptionHistory)) {
      buffer.add((user, history.size()));
    };

    let leaderboard = Buffer.toArray(buffer);
    Array.sort<(Principal, Nat)>(leaderboard, func(a, b) {
      if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal };
    });
  };

  public query func isLeaderboardVisible() : async Bool {
    leaderboardVisible;
  };

  public query ({ caller }) func getArchivedNFT(nftId : Nat) : async ORIGYNMetadata {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous users cannot view archived NFTs");
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view archived NFTs");
    };

    switch (natMap.get(nftStore, nftId)) {
      case (null) { Debug.trap("Archived NFT not found") };
      case (?metadata) {
        if (not metadata.redeemed) {
          Debug.trap("NFT is not archived (burned)");
        };
        metadata;
      };
    };
  };
};

