import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface RegisterProps {
  theme: 'dark' | 'light';
  onRegister: () => void;
  onSwitchToMainPage: () => void;
}

function Register({ theme, onRegister, onSwitchToMainPage }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        onRegister();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} flex items-center justify-center transition-colors duration-300 p-4`}>
      <div className="absolute top-4 left-4">
        <button
          onClick={onSwitchToMainPage}
          className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
          aria-label="Go back to main page"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className={`${cardBg} p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors duration-300`}>
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          Register for SoundScape
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 ${inputBg} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 ${textColor}`}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 ${inputBg} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors duration-300 ${textColor}`}
              placeholder="Create a password"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <button
            onClick={onRegister}
            className="text-purple-500 hover:underline focus:outline-none"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;