import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export default function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Music layer references
  const bassOscRef = useRef<OscillatorNode | null>(null);
  const bassLFORef = useRef<OscillatorNode | null>(null);
  const pad1OscRef = useRef<OscillatorNode | null>(null);
  const pad2OscRef = useRef<OscillatorNode | null>(null);
  const pad3OscRef = useRef<OscillatorNode | null>(null);
  const pulseOscRef = useRef<OscillatorNode | null>(null);
  const pulseIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Create master gain node for volume control
        const masterGain = audioContext.createGain();
        masterGain.gain.value = 0.25;
        masterGain.connect(audioContext.destination);
        masterGainRef.current = masterGain;

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
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, []);

  const createDeepBassLayer = (audioContext: AudioContext, masterGain: GainNode) => {
    // Deep bass oscillator (40-60Hz range with slow modulation)
    const bassOsc = audioContext.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 50; // Deep bass fundamental

    // LFO for bass frequency modulation (cyberpunk wobble)
    const bassLFO = audioContext.createOscillator();
    bassLFO.type = 'sine';
    bassLFO.frequency.value = 0.15; // Slow modulation

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 8; // Modulation depth

    bassLFO.connect(lfoGain);
    lfoGain.connect(bassOsc.frequency);

    // Bass filter for character
    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 120;
    bassFilter.Q.value = 2;

    const bassGain = audioContext.createGain();
    bassGain.gain.value = 0.4;

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start();
    bassLFO.start();

    bassOscRef.current = bassOsc;
    bassLFORef.current = bassLFO;
  };

  const createAtmosphericPads = (audioContext: AudioContext, masterGain: GainNode) => {
    // Pad 1: Detuned sawtooth for cyberpunk atmosphere
    const pad1 = audioContext.createOscillator();
    pad1.type = 'sawtooth';
    pad1.frequency.value = 110; // A2
    pad1.detune.value = -5;

    const pad1Filter = audioContext.createBiquadFilter();
    pad1Filter.type = 'lowpass';
    pad1Filter.frequency.value = 800;
    pad1Filter.Q.value = 1;

    const pad1Gain = audioContext.createGain();
    pad1Gain.gain.value = 0.08;

    pad1.connect(pad1Filter);
    pad1Filter.connect(pad1Gain);
    pad1Gain.connect(masterGain);

    // Pad 2: Slightly detuned for richness
    const pad2 = audioContext.createOscillator();
    pad2.type = 'sawtooth';
    pad2.frequency.value = 110;
    pad2.detune.value = 5;

    const pad2Filter = audioContext.createBiquadFilter();
    pad2Filter.type = 'lowpass';
    pad2Filter.frequency.value = 850;
    pad2Filter.Q.value = 1;

    const pad2Gain = audioContext.createGain();
    pad2Gain.gain.value = 0.08;

    pad2.connect(pad2Filter);
    pad2Filter.connect(pad2Gain);
    pad2Gain.connect(masterGain);

    // Pad 3: Higher harmonic for depth
    const pad3 = audioContext.createOscillator();
    pad3.type = 'triangle';
    pad3.frequency.value = 165; // E3 (fifth above)
    pad3.detune.value = 3;

    const pad3Filter = audioContext.createBiquadFilter();
    pad3Filter.type = 'lowpass';
    pad3Filter.frequency.value = 1200;
    pad3Filter.Q.value = 0.8;

    const pad3Gain = audioContext.createGain();
    pad3Gain.gain.value = 0.05;

    pad3.connect(pad3Filter);
    pad3Filter.connect(pad3Gain);
    pad3Gain.connect(masterGain);

    pad1.start();
    pad2.start();
    pad3.start();

    pad1OscRef.current = pad1;
    pad2OscRef.current = pad2;
    pad3OscRef.current = pad3;
  };

  const createRhythmicPulse = (audioContext: AudioContext, masterGain: GainNode) => {
    // Subtle rhythmic pulse for Psy chill vibe
    const pulseOsc = audioContext.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.value = 80;

    const pulseFilter = audioContext.createBiquadFilter();
    pulseFilter.type = 'bandpass';
    pulseFilter.frequency.value = 150;
    pulseFilter.Q.value = 3;

    const pulseGain = audioContext.createGain();
    pulseGain.gain.value = 0;

    pulseOsc.connect(pulseFilter);
    pulseFilter.connect(pulseGain);
    pulseGain.connect(masterGain);

    pulseOsc.start();
    pulseOscRef.current = pulseOsc;

    // Create rhythmic pulse pattern (Psy chill tempo ~120 BPM)
    const pulseDuration = 0.15;
    const pulseInterval = 500; // ms between pulses

    const triggerPulse = () => {
      if (!audioContextRef.current || !pulseGain) return;
      
      const now = audioContextRef.current.currentTime;
      
      // Envelope for pulse
      pulseGain.gain.cancelScheduledValues(now);
      pulseGain.gain.setValueAtTime(0, now);
      pulseGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + pulseDuration);
    };

    // Start pulse pattern
    const interval = window.setInterval(() => {
      triggerPulse();
    }, pulseInterval);

    pulseIntervalRef.current = interval;
  };

  const toggleSound = async () => {
    if (!isInitialized || !audioContextRef.current || !masterGainRef.current) return;

    const audioContext = audioContextRef.current;
    const masterGain = masterGainRef.current;

    if (isPlaying) {
      // Stop all music layers
      if (bassOscRef.current) {
        bassOscRef.current.stop();
        bassOscRef.current = null;
      }
      if (bassLFORef.current) {
        bassLFORef.current.stop();
        bassLFORef.current = null;
      }
      if (pad1OscRef.current) {
        pad1OscRef.current.stop();
        pad1OscRef.current = null;
      }
      if (pad2OscRef.current) {
        pad2OscRef.current.stop();
        pad2OscRef.current = null;
      }
      if (pad3OscRef.current) {
        pad3OscRef.current.stop();
        pad3OscRef.current = null;
      }
      if (pulseOscRef.current) {
        pulseOscRef.current.stop();
        pulseOscRef.current = null;
      }
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
        pulseIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create all music layers
      createDeepBassLayer(audioContext, masterGain);
      createAtmosphericPads(audioContext, masterGain);
      createRhythmicPulse(audioContext, masterGain);

      setIsPlaying(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSound}
      className="relative"
      title={isPlaying ? 'Mute music' : 'Play music'}
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
