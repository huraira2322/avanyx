import React from 'react';
import { useAvanyx } from '../context/AvanyxContext';
import { Sparkles } from 'lucide-react';

export const FloatingAiAssistant: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    setActiveMode,
  } = useAvanyx();

  // If the user is already on the central Chat with Avanyx page, do not render the shortcut
  if (currentModule === 'ask_avanyx') {
    return null;
  }

  const handleOpenCentralChat = () => {
    setActiveMode('business');
    setCurrentModule('ask_avanyx');
  };

  return (
    <button
      id="btn-floating-ask-avanyx"
      onClick={handleOpenCentralChat}
      className="fixed bottom-5 right-5 z-40 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-primary hover:bg-primary-hover text-white rounded-full shadow-xl shadow-primary/25 flex items-center gap-2 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer group select-none"
      title="Ask Avanyx - Open Central AI Chat"
      aria-label="Open Avanyx AI Chat"
    >
      <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
      <span className="text-xs font-extrabold tracking-wide">Ask Avanyx</span>
    </button>
  );
};
