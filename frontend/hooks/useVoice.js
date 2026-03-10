import { useState, useEffect } from 'react';

export const useVoiceAssistant = (lang = 'hi') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speak = async (text, context) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context, lang })
      });
      const data = await response.json();
      
      if (data.audio_b64) {
        const audio = new window.Audio(`data:audio/mp3;base64,${data.audio_b64}`);
        audio.play();
        setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
      } else if (data.error) {
        console.warn("Voice Assistant TTS error:", data.error);
        setIsSpeaking(false);
        return;
      }
    } catch (err) {
      console.error("Voice error:", err);
    }
  };

  return { speak, isSpeaking };
};
