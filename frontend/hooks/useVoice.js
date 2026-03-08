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
        console.error("Backend returned TTS error:", data.error);
        if (data.error.includes("NoneType") || data.error.includes("Client")) {
           alert("Voice Assistant Error: Please add ELEVENLABS_API_KEY to your backend .env file and restart the backend.");
        } else {
           alert("Voice Assistant Error: " + data.error);
        }
      }
    } catch (err) {
      console.error("Voice error:", err);
    }
  };

  return { speak, isSpeaking };
};
