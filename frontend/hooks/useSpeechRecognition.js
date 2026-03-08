"use client";
import { useState, useRef, useCallback } from 'react';

export const useSpeechRecognition = (lang = 'hi') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());

        // Send to backend
        const formData = new FormData();
        formData.append('file', audioBlob, 'record.webm');

        try {
          const response = await fetch('http://localhost:8000/voice/stt', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.transcript) {
            setTranscript(data.transcript);
          }
        } catch (err) {
          console.error("Transcription failed:", err);
          setError("Transcription failed.");
          alert("Failed to transcribe audio. Please check your backend connection and ElevenLabs API key.");
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      if (err.name === 'NotAllowedError') {
        alert("Microphone Access Denied: Please allow microphone permissions in your browser settings to use voice dictation.");
      } else {
        alert("Failed to access microphone. " + err.message);
      }
      setError(err);
      setIsListening(false);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported: typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
};
