"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AtmosphereSettings } from "./CompetitionDetail";

// Audio file paths
const AUDIO_PATHS = {
  crowdAmbientLight: "/sounds/competition/crowd-ambient-light.mp3",
  crowdAmbientMedium: "/sounds/competition/crowd-ambient-medium.mp3",
  crowdAmbientLoud: "/sounds/competition/crowd-ambient-loud.mp3",
  applauseShort: "/sounds/competition/applause-short.mp3",
  applauseLong: "/sounds/competition/applause-long.mp3",
  cameraShutter: "/sounds/competition/camera-shutter.mp3",
  cameraFlashMultiple: "/sounds/competition/camera-flash-multiple.mp3",
  gasp: "/sounds/competition/gasp.mp3",
} as const;

// Maximum durations for effect sounds (in milliseconds)
const AUDIO_MAX_DURATION: Record<string, number> = {
  [AUDIO_PATHS.applauseShort]: 3000, // 3 seconds
  [AUDIO_PATHS.applauseLong]: 6000, // 6 seconds
  [AUDIO_PATHS.cameraShutter]: 1500, // 1.5 seconds
  [AUDIO_PATHS.cameraFlashMultiple]: 2500, // 2.5 seconds
  [AUDIO_PATHS.gasp]: 2000, // 2 seconds
};

// Helper function to play audio with auto-stop
const playAudioWithAutoStop = async (
  audioPath: string,
  volume: number = 0.5
): Promise<HTMLAudioElement | null> => {
  try {
    const audio = new Audio(audioPath);
    audio.volume = volume;

    const maxDuration = AUDIO_MAX_DURATION[audioPath];
    if (maxDuration) {
      // Auto-stop after max duration with fade out
      setTimeout(() => {
        if (!audio.paused) {
          // Fade out over 200ms
          const fadeInterval = setInterval(() => {
            if (audio.volume > 0.05) {
              audio.volume = Math.max(0, audio.volume - 0.1);
            } else {
              audio.pause();
              clearInterval(fadeInterval);
            }
          }, 20);
        }
      }, maxDuration);
    }

    audio.onerror = () => {
      console.warn(`Effect audio not found: ${audioPath}`);
    };

    await audio.play();
    return audio;
  } catch (e) {
    // Failed to play audio
    return null;
  }
};

interface CompetitionAudioManagerProps {
  atmosphere: AtmosphereSettings;
  soundEnabled: boolean;
  isTimerRunning?: boolean;
  onSolveComplete?: boolean;
  isPB?: boolean;
}

export default function CompetitionAudioManager({
  atmosphere,
  soundEnabled,
  isTimerRunning = false,
  onSolveComplete = false,
  isPB = false,
}: CompetitionAudioManagerProps) {
  const crowdAudioRef = useRef<HTMLAudioElement | null>(null);
  const effectAudioRef = useRef<HTMLAudioElement | null>(null);
  const distractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Get crowd audio based on noise level
  const getCrowdAudioPath = useCallback((noiseLevel: number): string => {
    if (noiseLevel >= 70) return AUDIO_PATHS.crowdAmbientLoud;
    if (noiseLevel >= 35) return AUDIO_PATHS.crowdAmbientMedium;
    return AUDIO_PATHS.crowdAmbientLight;
  }, []);

  // Initialize crowd ambient audio
  useEffect(() => {
    if (!soundEnabled || atmosphere.crowdNoise === 0) {
      if (crowdAudioRef.current) {
        crowdAudioRef.current.pause();
        crowdAudioRef.current = null;
      }
      return;
    }

    const initAudio = async () => {
      try {
        const audioPath = getCrowdAudioPath(atmosphere.crowdNoise);

        // Initialize or update audio element
        if (!crowdAudioRef.current || crowdAudioRef.current.src !== audioPath) {
          if (crowdAudioRef.current) {
            crowdAudioRef.current.pause();
          }

          crowdAudioRef.current = new Audio(audioPath);
          crowdAudioRef.current.loop = true;
          crowdAudioRef.current.preload = "auto";

          crowdAudioRef.current.onerror = () => {
            setAudioError(`Failed to load crowd audio: ${audioPath}`);
            console.warn(
              `Competition audio not found: ${audioPath}. Please add audio files to /public/sounds/competition/`
            );
          };

          crowdAudioRef.current.oncanplaythrough = () => {
            setAudioLoaded(true);
            setAudioError(null);
          };
        }

        // Set volume based on atmosphere setting (0-100 -> 0-0.5)
        const volume = (atmosphere.crowdNoise / 100) * 0.5;
        crowdAudioRef.current.volume = volume;

        // Play if not already playing
        if (crowdAudioRef.current.paused) {
          try {
            await crowdAudioRef.current.play();
          } catch (e) {
            // Audio autoplay blocked
            console.log(
              "Audio autoplay blocked - will play on user interaction"
            );
          }
        }
      } catch (e) {
        console.error("Failed to initialize crowd audio:", e);
      }
    };

    initAudio();

    return () => {
      if (crowdAudioRef.current) {
        crowdAudioRef.current.pause();
      }
    };
  }, [soundEnabled, atmosphere.crowdNoise, getCrowdAudioPath]);

  // Play effect sound with auto-stop
  const playEffect = useCallback(
    async (audioPath: string, volume: number = 0.5) => {
      if (!soundEnabled) return;
      await playAudioWithAutoStop(audioPath, volume);
    },
    [soundEnabled]
  );

  // Handle distractions during timer
  useEffect(() => {
    if (!soundEnabled || !atmosphere.distractions || !isTimerRunning) {
      if (distractionTimeoutRef.current) {
        clearTimeout(distractionTimeoutRef.current);
      }
      return;
    }

    const scheduleDistraction = () => {
      // Random delay between 3-15 seconds
      const delay = 3000 + Math.random() * 12000;

      distractionTimeoutRef.current = setTimeout(() => {
        if (!isTimerRunning) return;

        // Randomly choose a distraction
        const distractions = [
          { path: AUDIO_PATHS.cameraShutter, volume: 0.3 },
          { path: AUDIO_PATHS.cameraFlashMultiple, volume: 0.25 },
        ];

        const distraction =
          distractions[Math.floor(Math.random() * distractions.length)];
        playEffect(distraction.path, distraction.volume);

        // Schedule next distraction
        scheduleDistraction();
      }, delay);
    };

    scheduleDistraction();

    return () => {
      if (distractionTimeoutRef.current) {
        clearTimeout(distractionTimeoutRef.current);
      }
    };
  }, [soundEnabled, atmosphere.distractions, isTimerRunning, playEffect]);

  // Handle solve completion sounds
  useEffect(() => {
    if (!onSolveComplete || !soundEnabled) return;

    if (isPB) {
      playEffect(AUDIO_PATHS.applauseLong, 0.6);
    } else if (atmosphere.crowdNoise > 50) {
      playEffect(AUDIO_PATHS.applauseShort, 0.4);
    }
  }, [onSolveComplete, isPB, soundEnabled, atmosphere.crowdNoise, playEffect]);

  // Enable audio on user interaction if blocked
  useEffect(() => {
    const enableAudio = async () => {
      if (
        crowdAudioRef.current &&
        crowdAudioRef.current.paused &&
        soundEnabled
      ) {
        try {
          await crowdAudioRef.current.play();
        } catch (e) {
          // Still blocked
        }
      }
    };

    window.addEventListener("click", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });
    window.addEventListener("touchstart", enableAudio, { once: true });

    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("keydown", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
    };
  }, [soundEnabled]);

  // Render nothing
  return null;
}

// Hook for using the audio manager
export function useCompetitionAudio(
  atmosphere: AtmosphereSettings,
  soundEnabled: boolean
) {
  const crowdAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetVolumeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Smoothly transition volume to target
  const smoothVolumeTransition = useCallback(() => {
    if (!crowdAudioRef.current) return;

    const currentVolume = crowdAudioRef.current.volume;
    const targetVolume = targetVolumeRef.current;
    const diff = targetVolume - currentVolume;

    // Smooth transition (move 10% of the difference each step)
    if (Math.abs(diff) > 0.01) {
      crowdAudioRef.current.volume = currentVolume + diff * 0.1;
    } else {
      crowdAudioRef.current.volume = targetVolume;
    }
  }, []);

  // Random volume fluctuation for realistic crowd ambiance
  const startVolumeFluctuation = useCallback(() => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
    }

    const baseVolume = (atmosphere.crowdNoise / 100) * 0.5;

    // Set initial target
    targetVolumeRef.current = baseVolume;

    // Fluctuate volume every 2-5 seconds
    const fluctuate = () => {
      // Random fluctuation: ±30% of base volume
      const fluctuation = (Math.random() - 0.5) * 0.3;
      const newVolume = Math.max(
        0.05,
        Math.min(0.7, baseVolume * (1 + fluctuation))
      );
      targetVolumeRef.current = newVolume;
    };

    // Smooth volume updates every 100ms
    volumeIntervalRef.current = setInterval(() => {
      smoothVolumeTransition();
    }, 100);

    // Schedule random fluctuations
    const scheduleFluctuation = () => {
      const delay = 2000 + Math.random() * 3000; // 2-5 seconds
      setTimeout(() => {
        if (crowdAudioRef.current && !crowdAudioRef.current.paused) {
          fluctuate();
          scheduleFluctuation();
        }
      }, delay);
    };

    scheduleFluctuation();
  }, [atmosphere.crowdNoise, smoothVolumeTransition]);

  // Play a one-shot effect with random volume variation and auto-stop
  const playEffect = useCallback(
    async (type: "applause" | "gasp" | "camera") => {
      if (!soundEnabled) return;

      const paths: Record<typeof type, string> = {
        applause: AUDIO_PATHS.applauseShort,
        gasp: AUDIO_PATHS.gasp,
        camera: AUDIO_PATHS.cameraShutter,
      };

      // Add slight random volume variation (0.3 to 0.5)
      const volume = 0.3 + Math.random() * 0.2;
      await playAudioWithAutoStop(paths[type], volume);
    },
    [soundEnabled]
  );

  // Start crowd noise with dynamic volume
  const startCrowdNoise = useCallback(async () => {
    if (!soundEnabled || atmosphere.crowdNoise === 0) return;

    try {
      let path: string = AUDIO_PATHS.crowdAmbientLight;
      if (atmosphere.crowdNoise >= 70) path = AUDIO_PATHS.crowdAmbientLoud;
      else if (atmosphere.crowdNoise >= 35)
        path = AUDIO_PATHS.crowdAmbientMedium;

      crowdAudioRef.current = new Audio(path);
      crowdAudioRef.current.loop = true;
      crowdAudioRef.current.volume = (atmosphere.crowdNoise / 100) * 0.5;

      await crowdAudioRef.current.play();
      setIsPlaying(true);

      // Start dynamic volume fluctuation
      startVolumeFluctuation();
    } catch (e) {
      console.warn("Failed to start crowd noise");
    }
  }, [soundEnabled, atmosphere.crowdNoise, startVolumeFluctuation]);

  // Stop crowd noise
  const stopCrowdNoise = useCallback(() => {
    if (crowdAudioRef.current) {
      crowdAudioRef.current.pause();
      crowdAudioRef.current = null;
      setIsPlaying(false);
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
  }, []);

  // Update base volume when atmosphere changes
  useEffect(() => {
    if (crowdAudioRef.current) {
      targetVolumeRef.current = (atmosphere.crowdNoise / 100) * 0.5;
    }
  }, [atmosphere.crowdNoise]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (crowdAudioRef.current) {
        crowdAudioRef.current.pause();
      }
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  }, []);

  return {
    playEffect,
    startCrowdNoise,
    stopCrowdNoise,
    isPlaying,
  };
}