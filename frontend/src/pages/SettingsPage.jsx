import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Check,
  Cpu,
  Database,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'developer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, role };
      if (password) payload.password = password;

      await updateProfile(payload);
      setMessage('Profile and settings updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
          <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <span>Account & Preferences</span>
        </h1>
        <p className="text-xs text-[#6A6282] mt-0.5">
          Manage your personal developer profile and review analysis engine status.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-[#EEFBF4] border border-[#C6EFDA] rounded-xl text-[#1E7E52] text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0 text-[#1E7E52]" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#302B43] mb-4 flex items-center space-x-2">
          <User className="w-4 h-4 text-[#8B78C6]" />
          <span>Profile Details</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#302B43] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3 py-2 text-xs sm:text-sm text-[#302B43] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#302B43] mb-1">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#A29BB8] cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E7E2F0]">
            <h4 className="text-xs font-bold text-[#302B43] mb-2 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8B78C6]" />
              <span>Change Password (Optional)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-[#6A6282] mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3 py-1.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6A6282] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3 py-1.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#8B78C6] hover:bg-[#7865B3] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#8B78C6]/25 transition cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Engine Status */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#302B43]">Analysis Engine Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#FAF8FF] rounded-xl border border-[#E7E2F0] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#1E7E52] font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB</span>
            </div>
            <p className="text-[#6A6282] text-[11px]">Active & securely isolated per user account.</p>
          </div>

          <div className="p-3 bg-[#FAF8FF] rounded-xl border border-[#E7E2F0] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#8B78C6] font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Static AST Parser</span>
            </div>
            <p className="text-[#6A6282] text-[11px]">Node.js & Python AST parsers active without code execution.</p>
          </div>

          <div className="p-3 bg-[#FAF8FF] rounded-xl border border-[#E7E2F0] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#4D3E7B] font-bold">
              <Key className="w-3.5 h-3.5" />
              <span>AI Fix Guides</span>
            </div>
            <p className="text-[#6A6282] text-[11px]">Contextual step-by-step fix explanations enabled.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
