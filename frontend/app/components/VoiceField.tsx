import { useVoice } from '@/lib/hooks/useVoice';

interface Props {
  label: string;
  context: string;
  lang: string;
  children: React.ReactNode;
}

export const VoiceField = ({ label, context, lang, children }: Props) => {
  const { speak, isPlaying } = useVoice(lang);

  return (
    <div className="mb-4 p-2 border rounded-lg hover:bg-green-50 transition">
      <div className="flex justify-between items-center mb-2">
        <label className="font-bold text-gray-700">{label}</label>
        <button 
          onClick={() => speak(label)}
          className={`p-2 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-gray-200'}`}
        >
          🔊
        </button>
      </div>
      {children}
    </div>
  );
};