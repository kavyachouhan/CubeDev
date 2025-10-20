import { useState, useEffect, useRef, useCallback } from "react";

type StackmatState =
  | "idle"
  | "ready"
  | "running"
  | "stopped"
  | "leftHand"
  | "rightHand"
  | "bothHands";

interface StackmatData {
  state: StackmatState;
  time: number;
  isReset: boolean;
}

// Stackmat protocol constants
const STACKMAT_SAMPLE_RATE = 44100;
const BIT_DURATION = STACKMAT_SAMPLE_RATE / 1200; // Samples per bit
const FREQ_BIT_0 = 1200; // Hz - Logic 0
const FREQ_BIT_1 = 1800; // Hz - Logic 1

export function useStackmatAudio() {
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stackmatData, setStackmatData] = useState<StackmatData>({
    state: "idle",
    time: 0,
    isReset: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Packet buffer and state
  const packetBufferRef = useRef<number[]>([]);
  const bitBufferRef = useRef<number[]>([]);
  const lastPacketTimeRef = useRef<number>(0);

  // Goertzel algorithm for frequency detection
  const goertzelFilter = useCallback(
    (samples: Float32Array, targetFreq: number, sampleRate: number): number => {
      const normalizedFreq = (2 * Math.PI * targetFreq) / sampleRate;
      const coeff = 2 * Math.cos(normalizedFreq);

      let s1 = 0;
      let s2 = 0;

      for (let i = 0; i < samples.length; i++) {
        const s0 = samples[i] + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }

      // Calculate magnitude
      const magnitude = Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2);
      return magnitude;
    },
    []
  );

  // Decode bit from audio samples using FSK
  const decodeBit = useCallback(
    (samples: Float32Array, sampleRate: number): number | null => {
      if (samples.length < 20) return null; // Need minimum samples

      const mag1200 = goertzelFilter(samples, FREQ_BIT_0, sampleRate);
      const mag1800 = goertzelFilter(samples, FREQ_BIT_1, sampleRate);

      // Determine which frequency is stronger
      const threshold = 0.3; // Minimum signal strength
      const maxMag = Math.max(mag1200, mag1800);

      if (maxMag < threshold) return null; // Signal too weak

      // Return bit based on stronger frequency
      return mag1800 > mag1200 ? 1 : 0;
    },
    [goertzelFilter]
  );

  // Decode RS232 byte from bits
  const decodeByte = useCallback((bits: number[]): number | null => {
    // RS232 format: 1 start bit (0), 8 data bits, 1 stop bit (1)
    if (bits.length < 10) return null;

    // Check start bit (should be 0)
    if (bits[0] !== 0) return null;

    // Check stop bit (should be 1)
    if (bits[9] !== 1) return null;

    // Extract 8 data bits (LSB first)
    let byte = 0;
    for (let i = 0; i < 8; i++) {
      byte |= bits[i + 1] << i;
    }

    return byte;
  }, []);

  // Decode Stackmat packet
  const decodeStackmatPacket = useCallback(
    (bytes: number[]): StackmatData | null => {
      // Packet should be 9 bytes
      if (bytes.length !== 9) return null;

      // Verify packet structure
      const CR = 0x0d; // Carriage return
      const LF = 0x0a; // Line feed

      if (bytes[7] !== CR || bytes[8] !== LF) {
        return null; // Invalid packet termination
      }

      // Decode command byte for state
      const cmd = String.fromCharCode(bytes[0]);
      let state: StackmatState = "idle";

      switch (cmd) {
        case "I":
          state = "idle";
          break;
        case "A":
          state = "running";
          break;
        case "S":
          state = "stopped";
          break;
        case "L":
          state = "leftHand";
          break;
        case "R":
          state = "rightHand";
          break;
        case "C":
          state = "ready";
          break; // Both hands
        default:
          state = "idle";
      }

      // Decode time digits (all ASCII characters)
      const minutes = (bytes[1] - 0x30) * 10 + (bytes[2] - 0x30);
      const seconds = (bytes[3] - 0x30) * 10 + (bytes[4] - 0x30);
      const centiseconds = (bytes[5] - 0x30) * 10 + (bytes[6] - 0x30);

      // Validate digits are in valid range (0-9)
      if (
        minutes < 0 ||
        minutes > 99 ||
        seconds < 0 ||
        seconds > 59 ||
        centiseconds < 0 ||
        centiseconds > 99
      ) {
        return null;
      }

      // Calculate time in milliseconds
      const time = (minutes * 60 + seconds) * 1000 + centiseconds * 10;

      return {
        state,
        time,
        isReset: time === 0 && state === "idle",
      };
    },
    []
  );

  // Process audio samples for FSK demodulation
  const processAudioSamples = useCallback(
    (samples: Float32Array, sampleRate: number) => {
      const samplesPerBit = Math.floor(sampleRate / 1200);

      // Process samples in bit-sized chunks
      for (let i = 0; i < samples.length; i += samplesPerBit) {
        const chunk = samples.slice(i, i + samplesPerBit);
        if (chunk.length < samplesPerBit / 2) continue; // Skip incomplete chunks

        const bit = decodeBit(chunk, sampleRate);
        if (bit !== null) {
          bitBufferRef.current.push(bit);

          // Try to decode byte when we have enough bits
          if (bitBufferRef.current.length >= 10) {
            const byte = decodeByte(bitBufferRef.current.slice(0, 10));

            if (byte !== null) {
              packetBufferRef.current.push(byte);
              bitBufferRef.current = bitBufferRef.current.slice(10); // Remove processed bits

              // Try to decode packet when we have 9 bytes
              if (packetBufferRef.current.length >= 9) {
                const packet = decodeStackmatPacket(
                  packetBufferRef.current.slice(0, 9)
                );

                if (packet) {
                  setStackmatData(packet);
                  setIsConnected(true);
                  setError(null);
                  lastPacketTimeRef.current = Date.now();
                }

                // Keep buffer size manageable
                packetBufferRef.current = packetBufferRef.current.slice(1);
              }
            } else {
              // Invalid byte, discard first bit and try again
              bitBufferRef.current = bitBufferRef.current.slice(1);
            }
          }

          // Prevent buffer overflow
          if (bitBufferRef.current.length > 50) {
            bitBufferRef.current = bitBufferRef.current.slice(-20);
          }
        }
      }

      // Check for connection timeout (no packet in 2 seconds)
      if (
        Date.now() - lastPacketTimeRef.current > 2000 &&
        lastPacketTimeRef.current > 0
      ) {
        setIsConnected(false);
      }
    },
    [decodeBit, decodeByte, decodeStackmatPacket]
  );

  // Process audio data
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: STACKMAT_SAMPLE_RATE,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Create audio context
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: STACKMAT_SAMPLE_RATE,
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create script processor for audio processing
      const bufferSize = 4096;
      scriptProcessorRef.current =
        audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

      // Process audio in real-time
      scriptProcessorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        processAudioSamples(
          inputData,
          audioContextRef.current?.sampleRate || STACKMAT_SAMPLE_RATE
        );
      };

      // Connect nodes
      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      // Create analyser for visualization (optional)
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      // Start animation frame for status updates
      processAudio();

      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Failed to access microphone. Please check permissions.");
      setHasPermission(false);
    }
  }, [processAudio, processAudioSamples]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsConnected(false);

    // Clear buffers
    packetBufferRef.current = [];
    bitBufferRef.current = [];
    lastPacketTimeRef.current = 0;
  }, []);

  // Reset timer
  const reset = useCallback(() => {
    packetBufferRef.current = [];
    bitBufferRef.current = [];
    setStackmatData({
      state: "idle",
      time: 0,
      isReset: true,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isConnected,
    hasPermission,
    error,
    stackmatData,
    startListening,
    stopListening,
    reset,
  };
}