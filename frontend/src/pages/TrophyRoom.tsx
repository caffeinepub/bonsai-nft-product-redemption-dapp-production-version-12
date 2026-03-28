import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useUserNFTs } from '../hooks/useQueries';
import type { PublicNFTData } from '../backend';
import { Loader2, Trophy, Package } from 'lucide-react';
import NFTDetailModal from '../components/NFTDetailModal';

// ─── Glow Shader ─────────────────────────────────────────────────────────────

const glowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  void main() {
    float glow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0) * intensity;
    gl_FragColor = vec4(glowColor * glow, glow * 0.6);
  }
`;

// ─── Particle System ──────────────────────────────────────────────────────────

function EmberParticles({ position, active }: { position: [number, number, number]; active: boolean }) {
  const meshRef = useRef<THREE.Points>(null);
  const count = 30;

  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 1] = Math.random() * 1.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !active) return;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += delta * (0.5 + Math.random() * 0.5);
      if (pos[i * 3 + 1] > 2) pos[i * 3 + 1] = 0;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={meshRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={0xff6600} size={0.04} transparent opacity={0.8} />
    </points>
  );
}

// ─── NFT Pedestal ─────────────────────────────────────────────────────────────

interface NFTPedestalProps {
  nft: PublicNFTData;
  position: [number, number, number];
  onSelect: (nft: PublicNFTData) => void;
}

function NFTPedestal({ nft, position, onSelect }: NFTPedestalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (nft.media_assets.length > 0) {
      const loader = new THREE.TextureLoader();
      loader.load(nft.media_assets[0].getDirectURL(), (tex) => {
        setTexture(tex);
      });
    }
  }, [nft]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (hovered) {
      groupRef.current.rotation.y += delta * 0.8;
    } else {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    uniforms: {
      glowColor: { value: new THREE.Color(hovered ? 0xff6600 : 0xff3300) },
      intensity: { value: hovered ? 2.0 : 1.0 },
    },
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={() => onSelect(nft)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Pedestal base */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.4, 8]} />
        <meshStandardMaterial
          color={hovered ? 0x8b4513 : 0x5c3317}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* NFT display cube */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.1]} />
        <meshStandardMaterial
          map={texture}
          color={texture ? 0xffffff : (hovered ? 0xff6600 : 0xff3300)}
          roughness={0.2}
          metalness={0.8}
          emissive={hovered ? new THREE.Color(0.3, 0.1, 0) : new THREE.Color(0.1, 0.05, 0)}
        />
      </mesh>

      {/* Glow shell */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.0, 1.0, 0.15]} />
        <primitive object={glowMaterial} />
      </mesh>

      {/* NFT name label */}
      <Text
        position={[0, -0.25, 0.1]}
        fontSize={0.12}
        color={hovered ? '#ff9944' : '#ffcc88'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {nft.name.length > 16 ? nft.name.slice(0, 14) + '…' : nft.name}
      </Text>

      {/* Redeemed indicator */}
      {nft.redeemed && (
        <Text
          position={[0, -0.42, 0.1]}
          fontSize={0.09}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
        >
          REDEEMED
        </Text>
      )}

      {/* Ember particles on hover */}
      <EmberParticles position={[0, 0.5, 0]} active={hovered} />
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function TrophyScene({
  nfts,
  onSelectNFT,
}: {
  nfts: PublicNFTData[];
  onSelectNFT: (nft: PublicNFTData) => void;
}) {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x0a0500);
    scene.fog = new THREE.FogExp2(0x0a0500, 0.08);
  }, [scene]);

  const positions: [number, number, number][] = React.useMemo(() => {
    return nfts.map((_, i) => {
      const angle = (i / Math.max(nfts.length, 1)) * Math.PI * 2;
      const radius = Math.min(2.5 + nfts.length * 0.2, 5);
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
    });
  }, [nfts]);

  return (
    <>
      <ambientLight intensity={0.3} color={0xff6600} />
      <pointLight position={[0, 5, 0]} intensity={2} color={0xff4400} castShadow />
      <pointLight position={[-3, 2, -3]} intensity={1} color={0xff8800} />
      <pointLight position={[3, 2, 3]} intensity={1} color={0xff2200} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={0x1a0800} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Central trophy */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.3, 1.5, 8]} />
        <meshStandardMaterial color={0xffd700} roughness={0.1} metalness={1.0} emissive={new THREE.Color(0.2, 0.15, 0)} />
      </mesh>

      {nfts.map((nft, i) => (
        <NFTPedestal
          key={nft.id.toString()}
          nft={nft}
          position={positions[i]}
          onSelect={onSelectNFT}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// ─── Trophy Room Page ─────────────────────────────────────────────────────────

export default function TrophyRoom() {
  const { data: userNFTs, isLoading } = useUserNFTs();
  const [selectedNFT, setSelectedNFT] = useState<PublicNFTData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleSelectNFT = (nft: PublicNFTData) => {
    setSelectedNFT(nft);
    setDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Trophy Room…</p>
        </div>
      </div>
    );
  }

  const nfts = userNFTs ?? [];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header overlay */}
      <div className="absolute top-20 left-0 right-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm rounded-full px-6 py-3 border border-primary/30">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Trophy Room</span>
          <span className="text-muted-foreground text-sm">· {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {nfts.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Package className="w-16 h-16 text-muted-foreground/40" />
          <p className="text-xl font-semibold text-foreground">Your Trophy Room is Empty</p>
          <p className="text-muted-foreground text-sm">Collect NFTs to display them here.</p>
        </div>
      ) : (
        <Canvas
          shadows
          camera={{ position: [0, 3, 8], fov: 60 }}
          style={{ width: '100%', height: '100vh' }}
        >
          <Suspense fallback={null}>
            <TrophyScene nfts={nfts} onSelectNFT={handleSelectNFT} />
          </Suspense>
        </Canvas>
      )}

      {/* NFT Detail Modal — shows provenance, NO discount code */}
      <NFTDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedNFT(null); }}
        nft={selectedNFT}
      />
    </div>
  );
}
