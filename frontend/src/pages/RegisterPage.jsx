import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, register } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col justify-center items-center p-6 text-[#302B43]">
      
      {/* Brand logo */}
      <Link to="/" className="flex items-center space-x-2.5 mb-6 group">
        <div className="w-9 h-9 rounded-xl bg-[#8B78C6] flex items-center justify-center text-white shadow-sm shadow-[#8B78C6]/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-[#302B43]">
          <span className="text-[#8B78C6]">E</span> Predict
        </span>
      </Link>

      <div className="w-full max-w-sm bg-white border border-[#E7E2F0] rounded-3xl p-7 shadow-sm">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-extrabold text-[#302B43]">Create Free Account</h1>
          <p className="text-xs text-[#6A6282] mt-1">Start checking your project ZIPs for errors</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#302B43] mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8B78C6] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#302B43] mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8B78C6] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#302B43] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8B78C6] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#8B78C6] hover:bg-[#7865B3] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm shadow-[#8B78C6]/25 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>{loading ? 'Creating...' : 'Register'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#6A6282]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#8B78C6] hover:underline font-extrabold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
