import { useState } from 'react';
import { Search } from 'lucide-react';

interface MainPageProps {
  theme: 'dark' | 'light';
  onGenerate: (prompt: string) => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}

function MainPage({ theme, onGenerate, onSwitchToLogin, onSwitchToRegister }: MainPageProps) {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText);
    onGenerate(promptText);
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
  const buttonBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300';
  const buttonHoverBg = theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-400';

  return (
    <div
      className={`h-screen w-screen flex flex-col items-center justify-center transition-colors duration-300 bg-cover bg-center overflow-hidden relative ${textColor}`}
      style={{ backgroundImage: `url('/background-waveform.jpg.jpg')` }}
    >
      {/* Dark Transparent Box */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* Greeting Message */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            SoundScape
          </h1>
          <p className="text-2xl mt-3 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            How can I help you today?
          </p>
        </div>

        {/* Search Bar and Generate Button */}
        <div className="w-full max-w-lg flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to generate sound"
              className={`w-full px-4 py-3 ${inputBg} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 ${textColor} pr-10`}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
          >
            Generate
          </button>
        </div>

        {/* Small Prompt Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap justify-center max-w-2xl">
          <button
            onClick={() => handlePromptClick('Rain')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Rain
          </button>
          <button
            onClick={() => handlePromptClick('Ocean')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Ocean
          </button>
          <button
            onClick={() => handlePromptClick('Forest')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Forest
          </button>
          <button
            onClick={() => handlePromptClick('Thunder')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Thunder
          </button>
          <button
            onClick={() => handlePromptClick('Birds')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Birds
          </button>
          <button
            onClick={() => handlePromptClick('Wind')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Wind
          </button>
          <button
            onClick={() => handlePromptClick('Piano')}
            className={`px-4 py-2 ${buttonBg} ${buttonHoverBg} rounded-lg text-sm transition-colors duration-300 ${textColor}`}
          >
            Piano
          </button>
        </div>

        {/* Sign Up and Register Buttons */}
        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={onSwitchToLogin}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Sign Up
          </button>
          <button
            onClick={onSwitchToRegister}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Register
          </button>
        </div>

        {/* Description (Bottom of the Page) */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-gray-300 text-sm px-4">
            SoundScape lets you create unique audio experiences from text prompts. Generate music, sound effects, or speech with AI and explore a world of sound!
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainPage;