import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Background from "../components/background.jsx";
import { ALL_PERMISSION_IDS } from '../config/permissions';
import { loginUser } from '../services/dcmchee';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

    try {
      let user;

      // Dummy admin login (supports both email and username)
      if ((email === 'admin@hospital.com' || email === 'admin') && password === 'admin123') {
        user = {
          id: 'dummy-admin-id',
          username: 'admin',
          isAdmin: true,
          permissions: ALL_PERMISSION_IDS,
        };
      } else {
        // Call real API
        const response = await loginUser(email, password);
        user = response.user;
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      localStorage.setItem('authToken', user.id);
      localStorage.setItem('authMode', 'curalink');
      localStorage.setItem('userEmail', user.username);
      localStorage.setItem('isAdmin', String(user.isAdmin));
      localStorage.setItem('userPermissions', JSON.stringify(user.isAdmin ? ALL_PERMISSION_IDS : user.permissions));
      localStorage.setItem('isAuthenticated', 'true');

      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
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
            <label className="block text-xl text-white mb-1">Email or Username</label>
            <input
              type="text"
              placeholder="Enter email or username"
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
