"use client";
import React from 'react';
import { useVoiceAssistant } from '../hooks/useVoice';
import { useVoiceContext } from './VoiceProvider';

export const LanguageSelector = () => {
  const { lang, setLang, isVoiceEnabled } = useVoiceContext();
  const { speak } = useVoiceAssistant(lang);

  const handleLanguageChange = (code) => {
    setLang(code);
  };

  return (
    <div className="flex gap-2">
      {[
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिंदी' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ' }
      ].map((l) => (
        <button
          key={l.code}
          onClick={() => handleLanguageChange(l.code)}
          className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
            lang === l.code 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
