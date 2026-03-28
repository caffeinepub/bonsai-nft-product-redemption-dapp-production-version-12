# Specification

## Summary
**Goal:** Fix the NFT provenance detail panel so it reliably opens on selection, and restrict discount code visibility so it only appears upon successful NFT redemption.

**Planned changes:**
- Fix NFT card/gallery click handler to consistently open the provenance detail panel or modal showing creator, transfer history, timestamps, and wallet addresses
- Ensure the detail panel closes and returns the user to the gallery/dashboard without data loss
- Remove discount code from NFT card, detail view, and dashboard — it must not be rendered before redemption
- Show the discount code only in the redemption confirmation UI after a successful redemption
- Update backend so the discount code is returned only in the redemption response, not in general NFT metadata queries
- Allow previously redeemed NFT history to display the code, but never expose it on unredeemed NFTs

**User-visible outcome:** Users can click any NFT to reliably view its full provenance details, and discount codes are hidden until the moment of redemption, at which point the code is displayed in the confirmation screen.
