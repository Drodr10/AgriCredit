import React, { useState } from 'react';
import { useVoiceAssistant } from '../hooks/useVoice';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export const VoiceInput = ({ label, name, options, lang, context = "inputs", value, onChange, className, placeholder, hiddenInput = false, labelClassName, ...props }) => {
  const { speak, isSpeaking } = useVoiceAssistant(lang);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition(lang);

  // When transcript updates and we are listening, fire the onChange handler
  React.useEffect(() => {
    if (transcript && onChange) {
      if (options) {
        // Try to match transcript with an option label or value
        const lowerTranscript = transcript.toLowerCase();
        const matchedOpt = options.find(opt => 
          (opt.label && opt.label.toLowerCase().includes(lowerTranscript)) || 
          (opt.value && opt.value.toLowerCase().includes(lowerTranscript)) ||
          lowerTranscript.includes((opt.label || "").toLowerCase()) ||
          lowerTranscript.includes((opt.value || "").toLowerCase())
        );
        if (matchedOpt) {
          onChange({ target: { name, value: matchedOpt.value || matchedOpt } });
          setTimeout(() => stopListening(), 500); // Stop automatically when matched
        }
      } else {
        // Just text input
        // If it's a number/tel/amount field, strip non-digits
        const isNumericField = name.includes("amount") || name.includes("size") || name.includes("experience") || name.includes("phone");
        if (isNumericField) {
           const matches = transcript.match(/\d+/g);
           const num = matches ? matches.join("") : transcript;
           onChange({ target: { name, value: num } });
        } else {
           onChange({ target: { name, value: transcript } });
        }
      }
    }
  }, [transcript]);

  const toggleListen = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const defaultInputClass = "p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500";
  const appliedClass = className || defaultInputClass;

  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <div className="flex items-center justify-between">
        <label className={labelClassName || "text-sm font-medium text-gray-700"}>{label}</label>
        <div className="flex gap-1">
          {isSupported && (
            <button 
              type="button"
              onClick={toggleListen}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'text-red-500 bg-red-50 animate-pulse' 
                  : 'text-gray-400 hover:bg-slate-100'
              }`}
              title="Speak"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
          <button 
            type="button"
            onClick={() => speak(label, context)}
            className={`p-2 rounded-full hover:bg-green-100 transition-colors ${isSpeaking ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
            title="Listen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h4l5 5V3l-5 5H7a2 2 0 00-2 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {!hiddenInput && (
        options ? (
          <select 
            name={name} 
            value={value}
            onChange={onChange}
            className={appliedClass}
          >
            <option value="">-- {lang === 'hi' ? 'चुनें' : lang === 'pa' ? 'ਚੁਣੋ' : 'Select'} --</option>
            {options.map((opt, idx) => (
               <option key={idx} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
          </select>
        ) : (
          <input 
            type="text"
            {...props}
            name={name} 
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            className={appliedClass} 
          />
        )
      )}
    </div>
  );
};
