import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CuraLinkLogo } from '../components/CUraLinkLogo.jsx';



// Dummy account credentials
const DUMMY_ACCOUNT = {
  email: 'admin@hospital.com',
  password: 'admin123'
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Check against dummy account
      if (email === DUMMY_ACCOUNT.email && password === DUMMY_ACCOUNT.password) {
        // Handle "Remember Me"
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }

        // Store auth token (dummy)
        localStorage.setItem('authToken', 'dummy-auth-token-12345');
        localStorage.setItem('userEmail', email);

        // Login successful - redirect to mwl page
        navigate('/mwl');
      } else {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-end relative">
      {/* Card */}
      
      <div className="flex flex-col min-h-screen space-y-6 w-[40%] justify-center bg-[rgba(255,255,255,0.8)] backdrop-blur-md border shadow-lg rounded-xl p-8 z-10">
        {/* <span className="flex text-7xl justify-center  text-[rgb(215,160,56)] ">✴ </span> */}
        <CuraLinkLogo size="default" />

        <h2 className="text-3xl font-bold text-center">Welcome Again!</h2>
        
        {/* <h3 className="text-2xl font-semibold text-center">Login</h3> */}

        {/* Demo Credentials Info
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
          <p className="font-semibold mb-1">Demo Credentials:</p>
          <p>Email: admin@hospital.com</p>
          <p>Password: admin123</p>
        </div> */}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col justify-center">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-slate-400"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-slate-400"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-slate-800 border-gray-300 rounded focus:ring-slate-400"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}