import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export default function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.12;
        gainNode.connect(audioContext.destination);
        gainNodeRef.current = gainNode;

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const createNoiseBuffer = (audioContext: AudioContext): AudioBuffer => {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.35;
    }

    return buffer;
  };

  const playMetalClink = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;

    // Create metallic clink sound
    const osc = audioContext.createOscillator();
    const clinkGain = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    clinkGain.gain.setValueAtTime(0.2, now);
    clinkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(clinkGain);
    clinkGain.connect(gainNodeRef.current);

    osc.start(now);
    osc.stop(now + 0.08);
  };

  const toggleSound = async () => {
    if (!isInitialized || !audioContextRef.current || !gainNodeRef.current) return;

    const audioContext = audioContextRef.current;

    if (isPlaying) {
      // Stop all sounds
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current = null;
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Start forge heat hum (low frequency noise)
      const noiseBuffer = createNoiseBuffer(audioContext);
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 600;

      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0.1;

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gainNodeRef.current);

      noiseSource.start();
      noiseNodeRef.current = noiseSource;

      // Start smelting heat hum (deep oscillator)
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 45; // Deep forge rumble

      const oscGain = audioContext.createGain();
      oscGain.gain.value = 0.06;

      oscillator.connect(oscGain);
      oscGain.connect(gainNodeRef.current);

      oscillator.start();
      oscillatorRef.current = oscillator;

      // Periodically play metal clinks and ember pops
      const interval = window.setInterval(() => {
        if (Math.random() > 0.65) {
          playMetalClink();
        }
      }, 1200);
      intervalRef.current = interval;

      setIsPlaying(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSound}
      className="relative"
      title={isPlaying ? 'Mute forge sounds' : 'Play forge sounds'}
      disabled={!isInitialized}
    >
      {isPlaying ? (
        <Volume2 className="h-5 w-5 text-primary animate-pulse" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </Button>
  );
}
