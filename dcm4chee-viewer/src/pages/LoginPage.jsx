import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from "../components/background.jsx";

// Dummy account credentials (fallback)
const DUMMY_ACCOUNT = {
  email: 'admin@hospital.com',
  password: 'admin123'
};

// Keycloak configuration
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'https://172.16.16.221:8843';
const KEYCLOAK_REALM = 'dcm4che';
const KEYCLOAK_CLIENT_ID = 'dcm4chee-arc-ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState('static'); // 'keycloak' or 'static'
  const navigate = useNavigate();

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedAuthMode = localStorage.getItem('authMode') || 'static';
    
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
    setAuthMode(savedAuthMode);
  }, []);

  // // Keycloak authentication
  // const authenticateWithKeycloak = async (username, password) => {
  //   try {
  //     const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
      
  //     const formData = new URLSearchParams();
  //     formData.append('grant_type', 'password');
  //     formData.append('client_id', KEYCLOAK_CLIENT_ID);
  //     formData.append('username', username);
  //     formData.append('password', password);

  //     const response = await fetch(tokenUrl, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //       body: formData.toString(),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.error_description || 'Authentication failed');
  //     }

  //     const data = await response.json();
  //     return {
  //       accessToken: data.access_token,
  //       refreshToken: data.refresh_token,
  //       expiresIn: data.expires_in,
  //     };
  //   } catch (error) {
  //     console.error('Keycloak authentication error:', error);
  //     throw error;
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let authSuccess = false;
      let tokens = null;

      if (authMode === 'keycloak') {
        // Try Keycloak authentication first
        try {
          tokens = await authenticateWithKeycloak(email, password);
          authSuccess = true;
          
          // Store Keycloak tokens
          localStorage.setItem('authToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('tokenExpiry', Date.now() + (tokens.expiresIn * 1000));
          localStorage.setItem('authMode', 'keycloak');
          
        } catch (keycloakError) {
          console.error('Keycloak auth failed:', keycloakError);
          setError('Keycloak authentication failed. ' + keycloakError.message);
          setIsLoading(false);
          return;
        }
      } else {
        // Static authentication
        if (email === DUMMY_ACCOUNT.email && password === DUMMY_ACCOUNT.password) {
          authSuccess = true;
          localStorage.setItem('authToken', 'dummy-auth-token-12345');
          localStorage.setItem('authMode', 'static');
        } else {
          setError('Invalid username or password. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      if (authSuccess) {
        // Handle "Remember Me"
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }

        // Store user info
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAuthenticated', 'true');

        // Simulate slight delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Login successful - redirect to patients page
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="w-full flex flex-col lg:flex-row items-center justify-end relative ">
        <Background />
        <div className='h-[250px] md:h-[350px] lg:hidden'></div>
      <div className="flex flex-col lg:min-h-screen space-y-6 w-full md:w-[50%] lg:w-[40%] justify-center m-auto p-7 lg:mr-16 lg:p-10 z-10">
        <h1 className="text-3xl leading-4  lg:text-5xl font-bold text-center text-white">Welcome Again!</h1>
        
        <h3 className="text-xl leading-4 lg:text-3xl font-semibold text-white text-center">Log in</h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col justify-center">
          <div>
            <label className="block text-xl text-white mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-[16px] outline-none focus:ring-2 focus:ring-slate-400"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mt-6">
            <label className="block text-xl text-white mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-[16px] outline-none focus:ring-2 focus:ring-slate-400"
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
              className="w-4 h-4 text-slate-800 border-gray-300 accent-[#076371] rounded focus:ring-slate-400"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-white">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-[50%] md:w-[25%] mx-auto mt-4 bg-[#076371] text-white py-2 px-3 rounded-full hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Log In'}
          </button>
        </form>
      </div>
      </div>
      </>
  );
}