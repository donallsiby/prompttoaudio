import { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from 'react-use-audio-player';
import { Music2, Play, Pause, Download, Menu, X, Trash2 } from 'lucide-react';
import Login from './components/Login';
import Register from './components/Register';
import MainPage from './components/MainPage';

interface PromptHistory {
  id: number;
  prompt: string;
  audio_file_path: string | null;
  model: string;
  timestamp: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState<boolean>(false);
  const [showMainPage, setShowMainPage] = useState<boolean>(true);
  const [prompt, setPrompt] = useState('');
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('soundscape-theme');
    return savedTheme ? (savedTheme as 'dark' | 'light') : 'dark';
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('musicgen');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const audioRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { load, playing, pause, play } = useAudioPlayer();

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
      setIsLoggedIn(true);
      setShowMainPage(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchHistory();
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    if (isLoggedIn && initialPrompt) {
      setPrompt(initialPrompt);
      handlePrompt();
      setInitialPrompt(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('soundscape-theme', theme);
  }, [theme]);

  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:5000/history/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHistory(data);
      } else {
        setError(`Failed to fetch history: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Error fetching history: Network issue or server unavailable');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogin = (userId: number) => {
    setUserId(userId);
    setIsLoggedIn(true);
    setShowMainPage(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserId(null);
    setCurrentSound(null);
    audioRef.current = null;
    setHistory([]);
    setShowMainPage(true);
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
    setShowMainPage(false);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowMainPage(false);
  };

  const handleSwitchToMainPage = () => {
    setShowRegister(false);
    setShowMainPage(true);
  };

  const handleGenerateFromMainPage = (prompt: string) => {
    setInitialPrompt(prompt);
    setShowMainPage(false);
    setShowRegister(false);
  };

  const handleDelete = async (historyId: number) => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:5000/history/${userId}/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== historyId));
      } else {
        setError(`Failed to delete history entry: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Error deleting history entry: Network issue or server unavailable');
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white';
  const navBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const buttonHoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';
  const sidebarBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';

  const predefinedPrompts: { [key: string]: string } = {
    rain: 'https://assets.mixkit.co/music/preview/mixkit-rain-and-thunder-1255.mp3',
    ocean: 'https://assets.mixkit.co/music/preview/mixkit-ocean-waves-1192.mp3',
    forest: 'https://assets.mixkit.co/music/preview/mixkit-forest-birds-1217.mp3',
  };

  const togglePlay = (url: string) => {
    if (!url) return;

    if (audioRef.current !== url) {
      load(url, {
        autoplay: true,
        onend: () => setCurrentSound(null),
      });
      audioRef.current = url;
      setCurrentSound(url);
    } else {
      if (playing) {
        pause();
      } else {
        play();
      }
    }
  };

  const downloadAudio = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `soundscape-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      setError(`Failed to download audio file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const lowercasePrompt = prompt.trim().toLowerCase();
      if (predefinedPrompts[lowercasePrompt]) {
        const response = await fetch('http://localhost:5000/generate-sound', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            model: 'predefined',
            userId,
            audioFilePath: predefinedPrompts[lowercasePrompt],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to store predefined prompt in backend.');
        }

        const data = await response.json();
        if (data.audioFilePath) {
          setCurrentSound(data.audioFilePath);
          load(data.audioFilePath, {
            autoplay: true,
            onend: () => setCurrentSound(null),
          });
          audioRef.current = data.audioFilePath;
          await fetchHistory();
        } else {
          throw new Error(data.error || 'No audio file returned.');
        }
      } else {
        const response = await fetch('http://localhost:5000/generate-sound', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, model, userId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to generate sound.');
        }

        const data = await response.json();
        if (data.audioFilePath) {
          setCurrentSound(data.audioFilePath);
          load(data.audioFilePath, {
            autoplay: true,
            onend: () => setCurrentSound(null),
          });
          audioRef.current = data.audioFilePath;
          await fetchHistory();
        } else {
          throw new Error(data.error || 'No audio file returned.');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled.');
      } else {
        setError(`Error generating sound: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = (historyPrompt: string, historyModel: string) => {
    setPrompt(historyPrompt);
    setModel(historyModel);
    handlePrompt();
  };

  if (showMainPage) {
    return (
      <MainPage
        theme={theme}
        onGenerate={handleGenerateFromMainPage}
        onSwitchToLogin={handleSwitchToLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />
    );
  }

  if (!isLoggedIn) {
    return showRegister ? (
      <Register theme={theme} onRegister={handleSwitchToLogin} onSwitchToMainPage={handleSwitchToMainPage} />
    ) : (
      <Login theme={theme} onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} onSwitchToMainPage={handleSwitchToMainPage} />
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-300 flex`}>
      <div
        className={`fixed top-0 left-0 h-full ${sidebarBg} shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 md:w-80 p-4 overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Prompt History
          </h2>
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className={`${inputBg} p-3 rounded-lg flex flex-col gap-2 transition-colors duration-300`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{item.prompt}</span>
                  <div className="flex gap-2">
                    <button
                      aria-label="Regenerate sound"
                      onClick={() => handleRegenerate(item.prompt, item.model)}
                      className="p-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-xs"
                      disabled={isLoading}
                    >
                      Regenerate
                    </button>
                    <button
                      aria-label="Delete history entry"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.audio_file_path && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => item.audio_file_path && togglePlay(item.audio_file_path)}
                      className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors"
                    >
                      {playing && currentSound === item.audio_file_path ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => item.audio_file_path && downloadAudio(item.audio_file_path)}
                      className="p-2 text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No prompts yet.</p>
        )}
      </div>

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64 md:ml-80' : 'ml-0'}`}>
        <nav className={`fixed top-0 w-full ${navBg} shadow-lg z-10 transition-colors duration-300`}>
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg ${buttonHoverBg} transition-colors duration-300 mr-2`}
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Music2 className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                SoundScape
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${buttonHoverBg} transition-colors duration-300`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <span className="text-2xl">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className={`${cardBg} p-8 rounded-2xl shadow-xl transition-colors duration-300 mb-8`}>
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Generate Sound from Text
            </h2>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the sound you want to hear..."
                className={`w-full h-32 px-4 py-3 ${inputBg} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 ${textColor}`}
                disabled={isLoading}
              />
              <div className="flex gap-4 justify-center">
                <div className="relative">
                  <button
                    aria-label="Select model"
                    onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                    className={`px-4 py-2 ${inputBg} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 ${textColor} flex items-center gap-2`}
                    disabled={isLoading}
                  >
                    <span>
                      {model === 'musicgen' ? 'MusicGen (Music)' : model === 'audiogen' ? 'AudioGen (Sound Effects)' : 'Text to Speech'}
                    </span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {isModelDropdownOpen && (
                    <div className={`absolute top-12 ${inputBg} rounded-lg shadow-lg z-10 w-48`}>
                      <button
                        onClick={() => {
                          setModel('musicgen');
                          setIsModelDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 ${textColor} hover:bg-purple-500 hover:text-white transition-colors`}
                      >
                        MusicGen (Music)
                      </button>
                      <button
                        onClick={() => {
                          setModel('audiogen');
                          setIsModelDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 ${textColor} hover:bg-purple-500 hover:text-white transition-colors`}
                      >
                        AudioGen (Sound Effects)
                      </button>
                      <button
                        onClick={() => {
                          setModel('text_to_speech');
                          setIsModelDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 ${textColor} hover:bg-purple-500 hover:text-white transition-colors`}
                      >
                        Text to Speech
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <div className="flex gap-4">
                <button
                  onClick={handlePrompt}
                  disabled={isLoading}
                  className={`flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Sound'
                  )}
                </button>
                {isLoading && (
                  <button
                    onClick={handleCancelGeneration}
                    className="flex-1 py-3 bg-red-500 rounded-lg font-semibold hover:bg-red-600 transition-colors text-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Latest Generated Audio</h2>
            {history.length > 0 && history[0].audio_file_path ? (
              <div className={`${inputBg} p-4 rounded-lg flex flex-col gap-3 transition-colors duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlay(history[0].audio_file_path!)}
                      className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors"
                    >
                      {playing && currentSound === history[0].audio_file_path ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <span className="font-medium">{history[0].prompt}</span>
                  </div>
                  <button
                    onClick={() => downloadAudio(history[0].audio_file_path!)}
                    className="p-2 text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  Generated on: {new Date(history[0].timestamp).toLocaleString()}
                </span>
              </div>
            ) : (
              <p className="text-gray-500">No audio generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;