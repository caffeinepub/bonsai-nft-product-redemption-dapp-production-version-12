# Specification

## Summary
**Goal:** Fix NFT minting persistence and collection display so that minted NFTs are properly stored in the backend canister and visible in user collections with their images and metadata.

**Planned changes:**
- Fix backend NFT storage to persist complete metadata, owner Principal, provenance data, and image blob references immediately after minting
- Ensure getUserNFTs backend function returns all NFTs owned by the requesting user with complete data
- Fix UserDashboard collection view to properly fetch and display all minted NFTs with images and metadata
- Verify AdminDashboard mint flow correctly uploads images to blob storage and waits for backend confirmation before showing success

**User-visible outcome:** After minting an NFT, users will see it immediately appear in their collection with the uploaded image and all metadata information persisted across page refreshes and canister upgrades.
