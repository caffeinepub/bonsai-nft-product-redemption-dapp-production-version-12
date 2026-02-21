import { useEffect, useRef } from 'react';

interface ForgeBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
}

export default function ForgeBackground({ intensity = 'medium' }: ForgeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system for sparks and embers
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
      type: 'spark' | 'ember';
    }

    const particles: Particle[] = [];
    const particleCount = intensity === 'high' ? 80 : intensity === 'medium' ? 50 : 30;

    function createParticle(): Particle {
      if (!canvas) {
        return {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 1,
          maxLife: 50,
          size: 2,
          color: '#FF8C00',
          type: 'ember',
        };
      }
      
      const type = Math.random() > 0.5 ? 'spark' : 'ember';
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 1.5 + 0.5),
        life: 1,
        maxLife: Math.random() * 100 + 50,
        size: type === 'spark' ? Math.random() * 2 + 1 : Math.random() * 3 + 2,
        color: type === 'spark' ? '#FFD700' : '#FF8C00',
        type,
      };
    }

    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Molten metal flows
    interface MoltenFlow {
      y: number;
      speed: number;
      width: number;
      opacity: number;
    }

    const moltenFlows: MoltenFlow[] = [];
    const flowCount = intensity === 'high' ? 5 : intensity === 'medium' ? 3 : 2;

    for (let i = 0; i < flowCount; i++) {
      moltenFlows.push({
        y: Math.random() * (canvas?.height || 800),
        speed: Math.random() * 0.5 + 0.2,
        width: Math.random() * 200 + 100,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    let animationId: number;
    let time = 0;

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      // Draw molten flows
      moltenFlows.forEach((flow) => {
        const gradient = ctx.createLinearGradient(0, flow.y, canvas.width, flow.y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, `rgba(255, 140, 0, ${flow.opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 69, 0, ${flow.opacity * 1.5})`);
        gradient.addColorStop(0.7, `rgba(255, 140, 0, ${flow.opacity})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, flow.y - 1, canvas.width, 3);

        // Animate flow position
        flow.y += flow.speed;
        if (flow.y > canvas.height) {
          flow.y = -10;
        }
      });

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;

        // Add slight horizontal drift
        particle.vx += (Math.random() - 0.5) * 0.05;

        // Fade out
        const alpha = particle.life / particle.maxLife;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = alpha;

        // Glow effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.5, particle.color + '80');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Reset particle if dead
        if (particle.life <= 0 || particle.y < -50) {
          particles[index] = createParticle();
        }
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
