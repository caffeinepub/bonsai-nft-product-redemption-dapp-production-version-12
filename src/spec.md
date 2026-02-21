# Bonsai NFT Product Redemption dApp   Production Version 12

## Overview
A decentralized application for managing Bonsai NFTs that can be redeemed for discount codes and products. Users can view their NFT collection, burn NFTs to reveal redemption codes, and participate in a leaderboard system based on their redemption activity. The application complies with ORIGYNTech's RWA (Real-World Asset) metadata standards for enhanced asset tracking and certification with detailed provenance information. Features comprehensive transaction transparency, address book management, enhanced user profiles, and persistent media asset storage with guaranteed cross-session availability.

## Authentication
- Internet Identity integration for secure login/logout with proper AuthClient initialization
- Robust authentication flow with error handling and retry mechanisms for AuthClient loading
- User principal identification for NFT ownership and admin privileges
- Automatic user role initialization upon first authentication to prevent unauthorized access errors
- Sequential actor and profile initialization after successful authentication to prevent undefined actor errors
- Clear authentication state management across Header, App, and UserDashboard components
- Login button properly updates to "Logout" and displays Principal ID upon successful authentication

## Backend Data Storage
The backend stores the following persistent data:
- **ORIGYN-Compliant NFT Metadata**: ID, name, collection, product, verified status, discount code, mystery flag, redemption status, asset_class, certification, provenance_id, manufacturer_details, issue_date, media_assets (fully qualified persistent blob URLs), and detailed provenance information
- **Persistent Media Asset URLs**: All media_assets stored as fully qualified persistent blob URLs pointing to storage canister, ensuring cross-session availability and preventing transient reference issues
- **Provenance Data**: Complete ProvenanceID structure including id, productName, batchNumber, creationDate (Int timestamp), attributes (list of trait_type and value pairs), and physicalHash
- **NFT Ownership**: Mapping of user principals to owned NFT IDs
- **Redemption History**: Records of burned NFTs with timestamp, user, NFT details, complete deep copy of media_assets array with persistent blob URLs, and preserved provenance information including provenance_id and certification in archived Read-Only Library state
- **Transaction History**: Comprehensive chronological log of all minting, burning, and transfer transactions with timestamps, user principals, NFT metadata links, and detailed provenance data
- **User Profiles**: Enhanced user profiles tied to Internet Identity principals with customizable display name, bio, profile image blob reference, and preferred forge color theme
- **User Access Control**: Automatic role registration for authenticated users to enable profile management and prevent unauthorized access errors
- **Address Book**: User-specific storage of frequently used Principal IDs with custom nicknames and metadata
- **Admin Configuration**: Single permanent admin principal with immutable admin privileges, leaderboard visibility settings
- **Blob Storage**: Uploaded image files stored as blobs with unique identifiers for NFT artwork and user profile images, with persistent URL references maintained in redemption history to prevent garbage collection

## Admin Functions
- **Permanent Admin Privileges**: Single admin with immutable administrative rights that cannot be transferred or reassigned
- **ORIGYN-Compliant Minting**: Create single or batch NFTs with ORIGYN RWA metadata standards including asset_class, certification, provenance_id, manufacturer_details, issue_date, media_assets (persistent blob URLs), and complete provenance data
- **Persistent Media Asset Storage**: mintNFT function ensures all uploaded artwork is stored with fully qualified persistent blob URLs in ORIGYNMetadata.media_assets, preventing transient reference issues
- **Provenance Input**: Input detailed provenance information including product name, batch number, creation date, custom attributes, and physical hash during minting
- **Custom Artwork Upload**: Upload and attach custom artwork files (PNG, JPG, GIF) during minting with file size validation (< 10MB), storing persistent media file URLs in NFT metadata
- **Artwork Selection Interface**: Select artwork section in minting form with molten-style upload button, live thumbnail preview, and forge-themed styling with glowing borders and ember hover effects
- **NFT Management**: View all minted NFTs with custom artwork and provenance details, transfer ownership, burn NFTs
- **Leaderboard Control**: Toggle leaderboard visibility on/off
- **Admin Dashboard**: Overview of all NFTs with custom artwork display, provenance information, and system statistics
- **Global Transaction Access**: View comprehensive transaction history for all users with full transparency dashboard access
- **Read-Only Library Access**: Access to burned NFTs' complete metadata including provenance, certification, and persistent media assets in archived Read-Only Library state for audit and transparency purposes, maintaining ORIGYN RWA compliance

## User Functions
- **Enhanced User Profile Management**: Create and manage personal profile with customizable display name, bio, uploadable profile image, and preferred forge color theme selection with proper authentication validation
- **Automatic User Registration**: New users are automatically registered with proper access control roles upon first authentication to prevent profile saving errors
- **Profile Save Validation**: Profile saving includes identity verification and proper error handling with user-visible success and error messages
- **Fixed Profile Image Upload with FileReader**: Profile image upload uses proper browser FileReader API to convert files to Uint8Array format before sending to backend, with validation for supported file types (PNG, JPG, GIF), clear loading states during file conversion, and friendly error messages for upload failures or unsupported files
- **Profile Update Reliability**: Text profile updates (displayName, bio, forgeTheme) save successfully independent of image upload functionality
- **Wallet View**: Display user's Principal ID with copy-to-clipboard functionality for receiving airdrops and NFT transfers
- **Address Book Management**: Save frequently used Principal IDs with custom nicknames, edit entries, and retrieve for transfers or airdrops
- **NFT Collection**: View owned NFTs with ORIGYN metadata, custom artwork visual representation, and provenance details
- **Provenance Transparency**: View product name, masked/truncated physical hash, batch information, and custom attributes for each NFT
- **NFT Redemption**: Burn owned NFTs to permanently reveal discount codes while preserving complete provenance information and persistent media assets in archived Read-Only Library state
- **Personal Transaction History**: View own minting, burning, and transfer history with detailed provenance data and timestamps
- **Redemption History**: View personal history of redeemed NFTs including complete provenance details and archived persistent media assets
- **Leaderboard**: View ranking of users by number of NFTs burned (when enabled)
- **3D Trophy Room**: Interactive 3D visualization of achievements and collection with custom artwork integration

## Core Operations
- **Enforce Single Admin**: Backend ensures only the original admin principal can perform administrative actions
- **Initialize User Access Control**: Automatically register new authenticated users with proper roles to enable profile management functionality
- **Create Enhanced User Profile**: Users can create and update profiles with display name, bio, profile image upload, and forge theme preferences with proper authentication and error handling
- **Validate Profile Save Operations**: Ensure user identity verification and proper role registration before allowing profile modifications
- **Process Profile Image Upload with FileReader**: Frontend uses FileReader API to convert uploaded files to Uint8Array format before backend transmission, with file type validation, loading states, and comprehensive error handling for file conversion failures
- **Reliable Text Profile Updates**: Ensure displayName, bio, and forgeTheme updates work independently of image upload functionality
- **Manage Address Book**: Add, edit, delete, and retrieve Principal IDs with custom nicknames
- **Display Wallet Information**: Show user's Principal ID with copy-to-clipboard functionality
- **Mint ORIGYN NFT with Persistent URLs**: Admin creates new NFTs with ORIGYN-compliant metadata, custom artwork upload with validation, complete provenance data, and ensures media_assets contain fully qualified persistent blob URLs pointing to storage canister
- **Store Profile Image Blob**: Backend stores uploaded profile images as blobs and returns unique identifiers
- **Store Artwork Blob with Persistent URLs**: Backend stores uploaded image files as blobs and returns fully qualified persistent URLs for metadata integration, preventing transient reference issues
- **Log Transaction History**: Record all minting, burning, and transfer actions with timestamps, user data, and provenance information
- **Query Transaction History**: Retrieve chronological transaction logs with access controls (admin sees all, users see own)
- **Burn NFT with Complete Archive and URL Preservation**: User permanently destroys NFT to access redemption code, with backend performing deep copy of entire media_assets array with persistent blob URLs and all provenance data into RedemptionRecord, preserving media assets in Read-Only Library state without regenerating or altering blob storage entries
- **Transfer NFT**: Move NFT ownership between users with transaction logging
- **Query Owned NFTs**: Retrieve user's current NFT collection with custom artwork and provenance details
- **Query Redemption History**: Get user's burn history with complete archived provenance information, certification, and persistent media assets
- **Query Archived NFT Metadata**: Admin read-only endpoint to access complete metadata of burned NFTs including provenance and persistent artwork URLs for audit purposes in Read-Only Library state
- **Upload Media Assets**: Admin uploads custom artwork files with format and size validation, associates them with NFT metadata using persistent blob URLs
- **Media Asset Rehydration**: Backend provides rehydration routine to verify and rebind all NFT media assets to their persistent storage URLs ensuring visuals persist across sessions

## Frontend Features
- **Robust Authentication Flow**: Proper AuthClient initialization with error handling, retry mechanisms, and sequential actor/profile initialization after successful login
- **Authentication State Management**: Consistent authentication state handling across Header, App, and UserDashboard components with proper login/logout button updates
- **Error Handling and Fallbacks**: Clear error messages and retry mechanisms for AuthClient loading issues or authentication failures
- **Fixed Profile Image Upload Handler**: Profile image upload in ProfileEditModal.tsx and useQueries.ts uses proper browser FileReader API to convert files to Uint8Array format, includes validation for supported file types (PNG, JPG, GIF), displays clear loading states during file conversion, and provides friendly error messages for conversion failures or unsupported files
- **Reliable Profile Text Updates**: DisplayName, bio, and forgeTheme updates work independently and successfully save even when image upload is not used
- **Enhanced Profile Image Preview**: Live thumbnail preview of uploaded images before saving with proper file validation feedback
- **Hero Video Background**: Video.gif integrated as the homepage hero background with seamless looping, muted autoplay, and performance optimization using MP4 fallback
- **Video Meta Integration**: Video.gif used as primary app visual identity in meta tags and favicon assets
- **Enhanced User Dashboard**: Wallet view displaying Principal ID with copy-to-clipboard button, enhanced profile management with image upload, and address book interface
- **Profile Management with Error Handling**: Enhanced profile save functionality with user identity verification, clear success confirmations, and detailed error messages for failed operations
- **Comprehensive Transparency Dashboard**: Modal-based interface showing chronological transaction history with real-time ember/flicker animation effects for new transactions
- **Address Book Management Interface**: Modal-based system for adding, editing, and managing Principal IDs with custom nicknames and quick-select functionality for transfers
- **Enhanced Profile Management**: Modal-based profile editing with image upload, display name, bio, and forge color theme selection with live preview and improved error handling
- **Transaction Access Controls**: Admin transparency dashboard shows all user transactions, regular users see only their own transaction history
- **Profile Management Interface**: User profile creation and editing forms integrated into dashboard with image upload capability and proper authentication validation
- **Persistent Media Asset Rendering**: AdminDashboard and UserDashboard resolve media_assets links using storage canister's permanent URL builder and prefetch images as Uint8Array blobs with caching to prevent flicker or blank placeholders after refresh
- **Cross-Session Media Persistence**: Rehydration routine on app load verifies and rebinds all NFT media assets to their persistent storage URLs ensuring visuals persist across sessions even when metadata is reloaded from backend
- **Read-Only Library Display**: Admin Dashboard's Redemption History displays archived media assets from persistent blob storage using same retrieval mechanism as NFT Collection view, maintaining ORIGYN RWA compliance with Read-Only Library state
- **Fixed Admin Mint NFT Button**: Mint NFT button in Admin Dashboard correctly executes minting process by properly calling backend mintNFT or batchMintNFTs functions with all required metadata and media assets from user input
- **Artwork Upload Integration**: Upload field for custom artwork is properly linked to minting process, uploading images to blob storage and returning correct ExternalBlob reference before minting execution
- **Minting Progress Feedback**: Visual loading indicator and status messages display minting progress and success confirmation to prevent admin confusion during the minting process
- **Consistent Forge UI States**: All forge-themed animations and UI states remain consistent and functional after minting operations complete
- **Immersive Forge-Themed Visual Experience**: SVG layering and parallax motion effects creating depth and semi-3D experience with molten metal flows, sparks, and ember particle systems layered over video background
- **Interactive Animations**: Animated molten metal flows, sparks, and ember particle systems that react to user interactions (cursor movement, scroll, clicks) overlaying the video background with real-time transaction animations
- **Ambient Sound Design**: Metal clinks, smelting heat hum, and ember pops synchronized with animations via AmbientSound component with volume toggle control in header
- **Forge Color Palette**: Molten orange, deep forge black, glowing red-hot metal, and bright spark yellow replacing standard colors with user-customizable theme variations
- **Layered SVG Backgrounds**: 3D optical illusion effects behind content on HomePage, UserDashboard, and AdminDashboard resembling forge environments with video background integration
- **Smooth Entrance Transitions**: Fade, glow, and parallax zoom effects for NFTs and UI elements with forge-inspired lighting
- **Custom Branding**: "Powered by T3kNo-Logic RWA Technology" footer attribution replacing default Caffeine attribution
- **Forge-Themed Favicon**: Video.gif integrated as favicon and app visual identity across browser tabs, mobile icons, and social preview metadata
- **Enhanced Trophy Room**: Three.js 3D rendering with advanced environmental lighting including dynamic reflections, glowing embers, and molten glow shader effects
- **Interactive 3D Camera Controls**: Zoom, pan, and orbit controls for immersive trophy room navigation
- **Responsive 3D NFT Trophy Models**: Interactive trophy models that rotate and animate on hover or click interactions
- **Particle Interaction System**: Sparks and embers that react to NFT focus and user interactions
- **Clickable NFT Plaques**: Interactive pedestals displaying provenance data including name, batch number, and other metadata
- **Advanced Visual Effects**: Depth-of-field and ambient occlusion for realistic 3D rendering while maintaining performance optimization
- **Interactive Audio Integration**: Forge-ambient audio cues including metal clinks and crackles synchronized with user interactions using Tone.js
- **Performance Optimization**: Graceful degradation for lower-end devices while maintaining full effects on capable hardware with optimized video playback
- **Accessibility**: Maintained accessibility standards with forge-themed visual enhancements and video background
- **Forge-Themed Upload Interface**: Molten-style upload button with glowing borders, ember hover effects, live thumbnail preview, and file validation feedback
- Sound integration with Tone.js
- Responsive design with immersive forge visual effects and video background
- Real-time updates of NFT status and ownership with transaction animation effects
- File upload interface for custom artwork during NFT minting and profile images with format validation (PNG, JPG, GIF) and size limits (< 10MB)
- Provenance input fields in admin dashboard for product name, batch number, attributes, and physical hash
- Provenance display in user dashboard showing product details, masked physical hash, and batch information
- Custom artwork display in both admin and user dashboards using persistent metadata media URLs with caching and rehydration

## Data Flow
1. Users authenticate via Internet Identity with proper AuthClient initialization and error handling
2. Authentication flow includes retry mechanisms and sequential actor/profile initialization after successful login
3. Login button properly updates to "Logout" and displays Principal ID upon successful authentication
4. User dashboard displays wallet information with Principal ID, copy-to-clipboard functionality, and address book management
5. Users manage address book entries with custom nicknames for frequently used Principal IDs
6. Profile save operations include identity verification and proper role validation before backend calls
7. Profile image uploads are processed using FileReader API in ProfileEditModal.tsx and useQueries.ts to convert files to Uint8Array format with loading states, validation, and friendly error handling
8. Text profile updates (displayName, bio, forgeTheme) save successfully independent of image upload functionality
9. Admin selects artwork through forge-themed upload interface with live preview and validation
10. Backend stores uploaded images as blobs and returns fully qualified persistent URLs for NFT artwork and profile images, preventing transient reference issues
11. Single permanent admin mints NFTs through backend canister with ORIGYN-compliant metadata, validated persistent artwork blob URLs, and complete provenance data
12. Admin Dashboard Mint NFT button correctly triggers backend mintNFT or batchMintNFTs functions with proper metadata and media asset integration
13. Artwork upload field properly links to minting process, uploading to blob storage and returning correct ExternalBlob reference before minting
14. Visual feedback displays minting progress and success confirmation to prevent admin confusion
15. All transactions (mint, burn, transfer) are logged in comprehensive transaction history with timestamps and provenance data
16. Users view their NFT collection from backend data with persistent custom artwork rendering and provenance transparency
17. Frontend implements rehydration routine on app load to verify and rebind all NFT media assets to their persistent storage URLs ensuring visuals persist across sessions
18. Users access personal transaction history and transparency dashboard with real-time animation effects
19. Admin accesses global transaction history through enhanced transparency dashboard
20. Users burn NFTs, triggering backend burnNFT function that performs deep copy of entire media_assets array with persistent blob URLs and all provenance data into RedemptionRecord without regenerating or altering blob storage entries, preserving media assets in Read-Only Library state, revealing codes, and logging transaction
21. Redemption history and leaderboard update automatically with complete archived provenance information and persistent media assets
22. Admin Dashboard's Redemption History display fetches archived media assets from persistent blob storage using permanent URL builder with caching, maintaining Read-Only Library state for ORIGYN RWA compliance
23. Admin maintains read-only access to complete archived NFT metadata including provenance and persistent artwork URLs through dedicated endpoint for audit and transparency in Read-Only Library state
24. All data including ORIGYN metadata, provenance details, persistent blob storage URLs, enhanced user profiles, address book entries, transaction logs, media asset URLs, and archived redemption records with complete persistent media_assets persist on-chain in the Internet Computer canister
25. Profile operations provide clear success confirmations and detailed error messages to users
26. Frontend media rendering uses storage canister's permanent URL builder and prefetches images as Uint8Array blobs with caching to avoid flicker or blank placeholders after refresh
27. Forge-themed animations and UI states remain consistent after all operations including minting

## ORIGYN RWA Metadata Compliance
The application implements ORIGYNTech's Real-World Asset metadata standards including:
- **asset_class**: Classification of the real-world asset
- **certification**: Certification details and authenticity verification
- **provenance_id**: Unique identifier for asset provenance tracking
- **manufacturer_details**: Information about the asset manufacturer
- **issue_date**: Date of asset creation or certification
- **media_assets**: Fully qualified persistent blob URLs to custom artwork and asset files uploaded during minting with validation, ensuring cross-session availability
- **provenance**: Complete ProvenanceID structure with id, productName, batchNumber, creationDate, attributes, and physicalHash for full RWA transparency
- **Read-Only Library Standards**: Archived burned NFTs maintain complete metadata including provenance_id, certification, and persistent media_assets in Read-Only Library state aligned with ORIGYN RWA Library asset standards, accessible by admin principal for audit and transparency

## Production Deployment
This is Version 12 of the Bonsai Forge NFT dApp ready for live production deployment with comprehensive transparency features, enhanced user profiles with fixed authentication and profile saving functionality, robust authentication flow with proper error handling and retry mechanisms, fixed profile image upload handler using FileReader API with loading states and friendly error messages, reliable text profile updates, address book management, persistent media asset storage with fully qualified blob URLs, cross-session media persistence through rehydration routines, complete archived NFT metadata preservation in Read-Only Library state, and fixed Admin Dashboard Mint NFT button functionality with proper backend integration, artwork upload linking, and visual progress feedback. The application includes complete Internet Identity authentication with proper AuthClient initialization, automatic user role initialization, permanent admin restrictions, individual user wallets with Principal ID copying functionality, transaction history transparency, persistent archived media asset display in redemption history, ORIGYN RWA compliance with Read-Only Library access, and the full forge-themed visual experience with Video.gif hero background.
