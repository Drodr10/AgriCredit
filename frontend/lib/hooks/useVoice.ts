import { useState } from 'react';

export const useVoice = (lang: string = 'hi') => {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = async (text_id: string) => {
    setIsPlaying(true);
    try {
      const res = await fetch('http://localhost:8000/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_id, lang })
      });
      const data = await res.json();
      const audio = new Audio(`data:audio/mp3;base64,${data.audio_b64}`);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    } catch (err) {
      console.error("TTS Error:", err);
      setIsPlaying(false);
    }
  };

  return { speak, isPlaying };
};