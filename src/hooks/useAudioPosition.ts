import { useState, useEffect } from 'react';
import { useAudioPlayer } from 'react-use-audio-player';

export function useAudioPosition() {
  const [position, setPosition] = useState(0);
  const { duration, playing } = useAudioPlayer();

  useEffect(() => {
    let interval: number | null = null;

    if (playing) {
      interval = window.setInterval(() => {
        const audioPlayer = useAudioPlayer();
        const currentPosition = audioPlayer.getPosition ? audioPlayer.getPosition() : 0;
        setPosition(currentPosition);
      }, 100); // Update every 100ms for smoother progress
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [playing]); // Re-run effect when playing state changes

  return { position, duration };
}