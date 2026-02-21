import { useGetRedemptionHistory, useGetOwnedNFTs } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Award, Star, Sparkles, Flame, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function TrophyRoom() {
  const { data: redemptionHistory, isLoading } = useGetRedemptionHistory();
  const { data: ownedNFTs } = useGetOwnedNFTs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [is3DReady, setIs3DReady] = useState(false);
  const [hoveredNFT, setHoveredNFT] = useState<number | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nftMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const particleSystemsRef = useRef<THREE.Points[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playMetalClink = async () => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;

    // Create metallic clink sound
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  };

  const playEmberPop = async () => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;

    // Create ember pop sound
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Three.js scene setup with advanced forge theme
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // OrbitControls for interactive camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1, 0);
    controls.update();
    controlsRef.current = controls;

    // Advanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xff8c00, 0.3);
    scene.add(ambientLight);

    // Main forge light with dynamic intensity
    const mainLight = new THREE.PointLight(0xff4500, 3, 50);
    mainLight.position.set(0, 8, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Accent lights for depth
    const accentLight1 = new THREE.SpotLight(0xff8c00, 2, 30, Math.PI / 6, 0.5, 2);
    accentLight1.position.set(8, 6, 8);
    accentLight1.castShadow = true;
    scene.add(accentLight1);

    const accentLight2 = new THREE.SpotLight(0xffd700, 1.5, 30, Math.PI / 6, 0.5, 2);
    accentLight2.position.set(-8, 6, -8);
    scene.add(accentLight2);

    // Rim light for edge highlighting
    const rimLight = new THREE.DirectionalLight(0xff6600, 1);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    // Create forge floor with reflective material
    const floorGeometry = new THREE.CircleGeometry(15, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create custom glow shader material
    const glowVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const glowFragmentShader = `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        float glow = pow(0.7 - dot(vNormal, vPositionNormal), 3.0);
        gl_FragColor = vec4(glowColor, glow * intensity);
      }
    `;

    // Create NFT trophy pedestals with interactive elements
    const createNFTPedestal = (index: number, total: number, isRedeemed: boolean) => {
      const group = new THREE.Group();
      const angle = (index / total) * Math.PI * 2;
      const radius = 6;
      
      group.position.x = Math.cos(angle) * radius;
      group.position.z = Math.sin(angle) * radius;
      group.position.y = 0;

      // Pedestal base
      const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 32);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: isRedeemed ? 0x8b4513 : 0x2a2a2a,
        metalness: 0.7,
        roughness: 0.3,
        emissive: isRedeemed ? 0xff4500 : 0x000000,
        emissiveIntensity: 0.2,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Trophy model
      const trophyGeometry = new THREE.ConeGeometry(0.4, 1.2, 32);
      const trophyMaterial = new THREE.MeshStandardMaterial({
        color: isRedeemed ? 0xff8c00 : 0x666666,
        metalness: 0.95,
        roughness: 0.05,
        emissive: isRedeemed ? 0xff4500 : 0x333333,
        emissiveIntensity: isRedeemed ? 0.5 : 0.1,
      });
      const trophy = new THREE.Mesh(trophyGeometry, trophyMaterial);
      trophy.position.y = 0.9;
      trophy.castShadow = true;
      trophy.receiveShadow = true;
      group.add(trophy);

      // Glow effect for redeemed NFTs
      if (isRedeemed) {
        const glowGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0xff8c00) },
            intensity: { value: 0.8 }
          },
          vertexShader: glowVertexShader,
          fragmentShader: glowFragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.9;
        group.add(glow);
      }

      // Info plaque
      const plaqueGeometry = new THREE.BoxGeometry(1, 0.5, 0.05);
      const plaqueMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.5,
        roughness: 0.5,
      });
      const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
      plaque.position.y = -0.3;
      plaque.castShadow = true;
      group.add(plaque);

      group.userData = { index, isRedeemed };
      return group;
    };

    // Add NFT pedestals
    const totalNFTs = (redemptionHistory?.length || 0) + (ownedNFTs?.length || 0);
    if (totalNFTs > 0) {
      redemptionHistory?.forEach((record, index) => {
        const pedestal = createNFTPedestal(index, totalNFTs, true);
        pedestal.userData.nftData = record;
        scene.add(pedestal);
        nftMeshesRef.current.set(index, pedestal);
      });

      ownedNFTs?.forEach((nft, index) => {
        const pedestalIndex = (redemptionHistory?.length || 0) + index;
        const pedestal = createNFTPedestal(pedestalIndex, totalNFTs, false);
        pedestal.userData.nftData = nft;
        scene.add(pedestal);
        nftMeshesRef.current.set(pedestalIndex, pedestal);
      });
    }

    // Create central trophy
    const centralTrophyGroup = new THREE.Group();
    const cupGeometry = new THREE.CylinderGeometry(0.8, 0.5, 1.5, 32);
    const cupMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xff4500,
      emissiveIntensity: 0.6,
    });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.y = 2;
    cup.castShadow = true;
    centralTrophyGroup.add(cup);

    const baseGeometry = new THREE.CylinderGeometry(1, 1, 0.4, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      metalness: 0.8,
      roughness: 0.15,
      emissive: 0xff8c00,
      emissiveIntensity: 0.4,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.2;
    base.castShadow = true;
    centralTrophyGroup.add(base);

    scene.add(centralTrophyGroup);

    // Enhanced particle system with interactive sparks
    const createParticleSystem = (color: number, count: number) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i + 1] = Math.random() * 10;
        positions[i + 2] = (Math.random() - 0.5) * 20;
        
        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = Math.random() * 0.05 + 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.02;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

      const material = new THREE.PointsMaterial({
        size: 0.15,
        color: color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(geometry, material);
      return particles;
    };

    const emberParticles = createParticleSystem(0xffd700, 300);
    const sparkParticles = createParticleSystem(0xff8c00, 200);
    scene.add(emberParticles);
    scene.add(sparkParticles);
    particleSystemsRef.current.push(emberParticles, sparkParticles);

    // Mouse interaction handlers
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = async () => {
      if (!cameraRef.current || !sceneRef.current) return;
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(nftMeshesRef.current.values()),
        true
      );

      if (intersects.length > 0) {
        const clickedGroup = intersects[0].object.parent;
        if (clickedGroup && clickedGroup.userData.index !== undefined) {
          setSelectedNFT(clickedGroup.userData.index);
          
          // Play metal clink sound
          await playMetalClink();
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('click', handleClick);

    // Animation loop
    let time = 0;
    let lastEmberTime = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Update controls
      controls.update();

      // Animate central trophy
      centralTrophyGroup.rotation.y += 0.005;
      centralTrophyGroup.position.y = Math.sin(time * 2) * 0.1;

      // Animate lights for forge effect
      mainLight.intensity = 3 + Math.sin(time * 3) * 0.5;
      accentLight1.intensity = 2 + Math.cos(time * 2.5) * 0.3;

      // Raycast for hover detection
      if (cameraRef.current && sceneRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(
          Array.from(nftMeshesRef.current.values()),
          true
        );

        // Reset all pedestals
        nftMeshesRef.current.forEach((group) => {
          group.scale.set(1, 1, 1);
        });

        if (intersects.length > 0) {
          const hoveredGroup = intersects[0].object.parent;
          if (hoveredGroup && hoveredGroup.userData.index !== undefined) {
            hoveredGroup.scale.set(1.1, 1.1, 1.1);
            const newHoveredNFT = hoveredGroup.userData.index;
            if (hoveredNFT !== newHoveredNFT) {
              setHoveredNFT(newHoveredNFT);
              // Play ember pop sound on hover change
              playEmberPop();
            }
          }
        } else {
          setHoveredNFT(null);
        }
      }

      // Animate NFT pedestals
      nftMeshesRef.current.forEach((group, index) => {
        group.rotation.y += 0.01;
        const hoverScale = hoveredNFT === index ? 1.15 : 1;
        group.scale.lerp(new THREE.Vector3(hoverScale, hoverScale, hoverScale), 0.1);
        
        if (group.userData.isRedeemed) {
          const trophy = group.children[1];
          if (trophy) {
            trophy.rotation.y += 0.02;
          }
        }
      });

      // Animate particles
      particleSystemsRef.current.forEach((particles, idx) => {
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const velocities = particles.geometry.attributes.velocity?.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Reset particles that go too high
          if (positions[i + 1] > 12) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = 0;
            positions[i + 2] = (Math.random() - 0.5) * 20;
          }

          // Add turbulence on hover
          if (hoveredNFT !== null) {
            const nftGroup = nftMeshesRef.current.get(hoveredNFT);
            if (nftGroup) {
              const dx = positions[i] - nftGroup.position.x;
              const dz = positions[i + 2] - nftGroup.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist < 2) {
                velocities[i] += (Math.random() - 0.5) * 0.05;
                velocities[i + 2] += (Math.random() - 0.5) * 0.05;
              }
            }
          }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y += 0.001 * (idx + 1);
      });

      // Occasional ambient ember pops
      if (time - lastEmberTime > 2 && Math.random() > 0.98) {
        playEmberPop();
        lastEmberTime = time;
      }

      renderer.render(scene, camera);
    };

    animate();
    setIs3DReady(true);

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, [redemptionHistory, ownedNFTs, hoveredNFT]);

  const totalRedemptions = redemptionHistory?.length ?? 0;
  const uniqueCollections = new Set(redemptionHistory?.map((r) => r.metadata.collection) ?? []).size;
  const verifiedCount = redemptionHistory?.filter((r) => r.metadata.verified).length ?? 0;

  const selectedNFTData = selectedNFT !== null 
    ? (selectedNFT < totalRedemptions 
        ? redemptionHistory?.[selectedNFT]?.metadata 
        : ownedNFTs?.[selectedNFT - totalRedemptions])
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-glow-entrance">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-10 w-10 text-primary animate-ember-float" />
          <h1 className="text-4xl font-bold text-gold-gradient">Trophy Room</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your achievements forged in the eternal flame
        </p>
      </div>

      {/* Interactive 3D Trophy Display */}
      <Card className="mb-8 overflow-hidden border-2 border-primary/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-0">
          <div className="relative w-full h-[500px] bg-gradient-to-b from-background via-background/80 to-muted">
            <canvas
              ref={canvasRef}
              className="trophy-canvas w-full h-full cursor-grab active:cursor-grabbing"
              style={{ display: 'block' }}
            />
            {!is3DReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-primary/20">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Drag to rotate • Scroll to zoom • Click NFTs for details
              </p>
            </div>
            {hoveredNFT !== null && (
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-primary/20">
                <p className="text-sm text-primary font-semibold animate-pulse">
                  <Flame className="inline h-4 w-4 mr-1" />
                  Hovering NFT #{hoveredNFT + 1}
                </p>
              </div>
            )}
            {selectedNFTData && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 border border-primary/30 animate-glow-entrance">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gold-gradient mb-2">{selectedNFTData.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Collection:</span>
                        <span className="ml-2 font-medium">{selectedNFTData.collection}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2 font-medium">{selectedNFTData.product}</span>
                      </div>
                      {selectedNFTData.provenance && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Batch:</span>
                            <span className="ml-2 font-medium">{selectedNFTData.provenance.batchNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Product:</span>
                            <span className="ml-2 font-medium">{selectedNFTData.provenance.productName}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {selectedNFTData.verified && (
                      <Badge variant="default" className="mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedNFT(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-primary/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Award className="h-4 w-4 text-primary animate-flicker" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-gradient">{totalRedemptions}</div>
            <p className="text-xs text-muted-foreground mt-1">NFTs burned in forge</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <Star className="h-4 w-4 text-accent animate-flicker" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-gradient">{uniqueCollections}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique collections</p>
          </CardContent>
        </Card>

        <Card className="border-chart-1/20 card-fiery-hover animate-glow-entrance" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified NFTs</CardTitle>
            <Sparkles className="h-4 w-4 text-chart-1 animate-flicker" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-gradient">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified redemptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card className="border-primary/20 animate-glow-entrance" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary animate-flicker" />
            Your Achievements
          </CardTitle>
          <CardDescription>Unlock badges by redeeming NFTs in the eternal forge</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* First Redemption Badge */}
              <div
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  totalRedemptions >= 1
                    ? 'border-primary bg-primary/10 card-fiery-hover'
                    : 'border-muted bg-muted/20 opacity-50'
                }`}
              >
                <Trophy className={`h-12 w-12 mx-auto mb-2 ${totalRedemptions >= 1 ? 'text-primary animate-ember-float' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">First Steps</p>
                <p className="text-xs text-muted-foreground">Redeem 1 NFT</p>
                {totalRedemptions >= 1 && (
                  <Badge variant="default" className="mt-2 animate-gold-pulse">
                    Unlocked
                  </Badge>
                )}
              </div>

              {/* Collector Badge */}
              <div
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  totalRedemptions >= 5
                    ? 'border-accent bg-accent/10 card-fiery-hover'
                    : 'border-muted bg-muted/20 opacity-50'
                }`}
              >
                <Award className={`h-12 w-12 mx-auto mb-2 ${totalRedemptions >= 5 ? 'text-accent animate-ember-float' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">Collector</p>
                <p className="text-xs text-muted-foreground">Redeem 5 NFTs</p>
                {totalRedemptions >= 5 && (
                  <Badge variant="default" className="mt-2 animate-gold-pulse">
                    Unlocked
                  </Badge>
                )}
              </div>

              {/* Enthusiast Badge */}
              <div
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  totalRedemptions >= 10
                    ? 'border-chart-1 bg-chart-1/10 card-fiery-hover'
                    : 'border-muted bg-muted/20 opacity-50'
                }`}
              >
                <Star className={`h-12 w-12 mx-auto mb-2 ${totalRedemptions >= 10 ? 'text-chart-1 animate-ember-float' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">Enthusiast</p>
                <p className="text-xs text-muted-foreground">Redeem 10 NFTs</p>
                {totalRedemptions >= 10 && (
                  <Badge variant="default" className="mt-2 animate-gold-pulse">
                    Unlocked
                  </Badge>
                )}
              </div>

              {/* Master Badge */}
              <div
                className={`p-6 rounded-lg border-2 text-center transition-all ${
                  totalRedemptions >= 25
                    ? 'border-chart-3 bg-chart-3/10 card-fiery-hover'
                    : 'border-muted bg-muted/20 opacity-50'
                }`}
              >
                <Sparkles className={`h-12 w-12 mx-auto mb-2 ${totalRedemptions >= 25 ? 'text-chart-3 animate-ember-float' : 'text-muted-foreground'}`} />
                <p className="font-semibold text-sm">Master</p>
                <p className="text-xs text-muted-foreground">Redeem 25 NFTs</p>
                {totalRedemptions >= 25 && (
                  <Badge variant="default" className="mt-2 animate-gold-pulse">
                    Unlocked
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
