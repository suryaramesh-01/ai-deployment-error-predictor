import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, LogOut, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E2F0] px-6 py-3.5 flex items-center justify-between shadow-xs">
      
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#8B78C6] flex items-center justify-center text-white shadow-sm shadow-[#8B78C6]/30 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-tight flex items-center">
              <span className="text-[#8B78C6]">E</span>
              <span className="text-[#302B43] ml-0.5">Predict</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Simple Status Pill */}
      <div className="hidden md:flex items-center space-x-2 bg-[#E9E2FF] border border-[#D9CFFF] px-3 py-1 rounded-full text-xs text-[#4D3E7B]">
        <span className="w-2 h-2 rounded-full bg-[#8B78C6] animate-pulse"></span>
        <span className="font-bold text-[#4D3E7B]">Ready</span>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-3">
        <Link
          to="/upload"
          className="inline-flex items-center space-x-1.5 bg-[#8B78C6] hover:bg-[#7865B3] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-[#8B78C6]/25 transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload ZIP</span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E7E2F0]">
            <Link
              to="/settings"
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-[#F5F3FF] transition"
              title="Profile & Settings"
            >
              <div className="w-7 h-7 rounded-full bg-[#E9E2FF] text-[#4D3E7B] font-bold text-xs flex items-center justify-center border border-[#D9CFFF]">
                {(typeof user.name === 'string' && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-[#302B43] hidden lg:inline max-w-[110px] truncate">
                {user.name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 text-[#6A6282] hover:text-[#302B43] rounded-lg hover:bg-[#F5F3FF] transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs font-bold text-[#8B78C6] hover:text-[#7865B3] px-2"
          >
            Sign In
          </Link>
        )}
      </div>

    </header>
  );
};
