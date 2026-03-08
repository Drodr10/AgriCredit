"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [lang, setLang] = useState('hi');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/voice/set_language?lang=${lang}`, {
      method: 'POST'
    }).catch(console.error);
  }, [lang]);

  return (
    <VoiceContext.Provider value={{ lang, setLang, isVoiceEnabled, setIsVoiceEnabled }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoiceContext = () => useContext(VoiceContext);
