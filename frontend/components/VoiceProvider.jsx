"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [lang, setLang] = useState('hi');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  useEffect(() => {
    // Set language on backend, but don't block rendering if it fails
    const timer = setTimeout(() => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${API_URL}/voice/set_language?lang=${lang}`, {
        method: 'POST'
      }).catch(() => {
        // Silently fail - voice service is optional
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [lang]);

  return (
    <VoiceContext.Provider value={{ lang, setLang, isVoiceEnabled, setIsVoiceEnabled }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoiceContext = () => useContext(VoiceContext);
