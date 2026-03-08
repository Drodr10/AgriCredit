import React from 'react';

export const LanguageHeader = ({ lang, setLang }: { lang: string, setLang: (l: string) => void }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
      <div className="flex gap-2">
        <button 
          onClick={() => setLang('hi')}
          className={`px-4 py-1 rounded-full border ${lang === 'hi' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
        >
          हिन्दी
        </button>
        <button 
          onClick={() => setLang('en')}
          className={`px-4 py-1 rounded-full border ${lang === 'en' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
        >
          English
        </button>
      </div>
      
      <div className="flex items-center gap-2 text-green-700">
        <span className="text-sm font-medium">आवाज सहायक</span>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};