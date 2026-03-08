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
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer transition-colors hover:bg-gray-50 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234B5563%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em_auto] bg-no-repeat bg-[position:right_0.7rem_center]"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="pa">ਪੰਜਾਬੀ</option>
      </select>
    </div>
  );
};
