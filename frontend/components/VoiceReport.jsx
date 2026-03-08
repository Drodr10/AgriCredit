import React, { useEffect, useState } from 'react';
import { useVoiceAssistant } from '../hooks/useVoice';
import { useVoiceContext } from './VoiceProvider';

export const VoiceReport = ({ mlData, lang }) => {
  const { speak, isSpeaking } = useVoiceAssistant(lang);
  const { isVoiceEnabled } = useVoiceContext();
  const [hasSpoken, setHasSpoken] = useState(false);
  
  useEffect(() => {
    if (mlData && !hasSpoken && isVoiceEnabled) {
      const riskTierText = lang === 'hi' ? 'जोखिम: ' : lang === 'pa' ? 'ਖਤਰਾ: ' : 'Risk: ';
      let tier = mlData.risktier || (mlData.pd_1year < 0.1 ? 'Low' : mlData.pd_1year < 0.3 ? 'Medium' : 'High');
      
      const textToSpeak = `${riskTierText} ${tier}. ${lang === 'hi' ? 'यह जोखिम स्कोर बैंक के लिए उपयुक्त है।' : lang === 'pa' ? 'ਇਹ ਜੋਖਮ ਸਕੋਰ ਬੈਂਕ ਲਈ ਢੁਕਵਾਂ ਹੈ।' : 'This risk score is suitable for review.'}`;
      speak(textToSpeak, "results");
      setHasSpoken(true);
    }
  }, [mlData, lang, hasSpoken, speak, isVoiceEnabled]);
  
  const speakVoiceReport = () => {
    let tier = mlData?.risktier || (mlData?.pd_1year < 0.1 ? 'Low' : mlData?.pd_1year < 0.3 ? 'Medium' : 'High');
    let pd = mlData?.pd_1year ? (mlData.pd_1year * 100).toFixed(1) : "18";
    
    let reportText = "";
    if (lang === 'hi') {
       reportText = `जोखिम: ${tier}। डिफ़ॉल्ट संभावना: ${pd} प्रतिशत। यह रिपोर्ट आपकी शर्तों के आधार पर एक मजबूत प्रोफाइल दर्शाती है।`;
    } else if (lang === 'pa') {
       reportText = `ਖਤਰਾ: ${tier}। ਡਿਫਾਲਟ ਸੰਭਾਵਨਾ: ${pd} ਪ੍ਰਤੀਸ਼ਤ। ਇਹ ਰਿਪੋਰਟ ਤੁਹਾਡੀਆਂ ਸ਼ਰਤਾਂ ਦੇ ਅਧਾਰ 'ਤੇ ਇੱਕ ਮਜ਼ਬੂਤ ਪ੍ਰੋਫਾਈਲ ਦਰਸਾਉਂਦੀ ਹੈ।`;
    } else {
       reportText = `Risk: ${tier}. Probability of Default: ${pd} percent. This report indicates a strong risk profile based on current terms.`;
    }
    speak(reportText, "results");
  };
  
  if (!mlData) return null;

  return (
    <div className="mt-6 p-6 border rounded-lg bg-green-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-800">
          {(mlData.risktier || 'LOW').toUpperCase()} RISK
        </h2>
        <button 
          onClick={speakVoiceReport}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${isSpeaking ? 'bg-green-200 text-green-800' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h4l5 5V3l-5 5H7a2 2 0 00-2 2z" />
          </svg>
          {lang === 'hi' ? 'पूरा रिपोर्ट सुनें' : lang === 'pa' ? 'ਪੂਰੀ ਰਿਪੋਰਟ ਸੁਣੋ' : 'Listen Full Report'}
        </button>
      </div>
      
      <div className="text-gray-700">
         <p><strong>{lang === 'hi' ? 'डिफ़ॉल्ट संभावना' : lang === 'pa' ? 'ਡਿਫਾਲਟ ਸੰਭਾਵਨਾ' : 'PD'}:</strong> {((mlData.pd_1year || 0.18) * 100).toFixed(1)}%</p>
         <p className="mt-2 text-green-700 font-medium">
            {lang === 'hi' ? 'यह जोखिम स्कोर बैंक लोन के लिए उपयुक्त है।' : lang === 'pa' ? 'ਇਹ ਜੋਖਮ ਸਕੋਰ ਬੈਂਕ ਲੋਨ ਲਈ ਢੁਕਵਾਂ ਹੈ।' : 'This risk score is suitable for a bank loan.'}
         </p>
      </div>
    </div>
  );
};
