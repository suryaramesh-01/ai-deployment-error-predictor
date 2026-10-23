import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  FileDown,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-[#302B43] flex flex-col">
      
      {/* Header */}
      <header className="border-b border-[#E7E2F0] bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8B78C6] flex items-center justify-center text-white shadow-sm shadow-[#8B78C6]/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[#302B43]">
              <span className="text-[#8B78C6]">E</span> Predict
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-xs font-bold text-[#302B43] bg-[#FAF8FF] hover:bg-[#E9E2FF] border border-[#E7E2F0] rounded-xl transition"
              >
                Dashboard
              </Link>
              <Link
                to="/upload"
                className="px-4 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 transition flex items-center space-x-1.5"
              >
                <span>Upload ZIP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-[#6A6282] hover:text-[#302B43] transition px-3 py-1.5">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 transition"
              >
                Create Account
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 max-w-5xl mx-auto text-center flex-1">
        
        <div className="inline-flex items-center space-x-2 bg-[#E9E2FF] border border-[#D9CFFF] px-3.5 py-1.5 rounded-full text-xs text-[#4D3E7B] font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#8B78C6]" />
          <span>Error Check & Fix Guides</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#302B43] max-w-3xl mx-auto leading-tight">
          Deploy Clean.<br />
          <span className="text-[#8B78C6]">
            Catch Errors Before Launch.
          </span>
        </h1>

        <p className="mt-4 text-base text-[#6A6282] max-w-md mx-auto leading-relaxed font-medium">
          Upload ZIP. Identify errors. Follow guides to clear them.
        </p>

        {/* Big Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? "/upload" : "/register"}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-extrabold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-2xl shadow-sm shadow-[#8B78C6]/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload ZIP</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-[#302B43] bg-white hover:bg-[#FAF8FF] border border-[#E7E2F0] rounded-2xl transition shadow-xs"
          >
            Dashboard
          </Link>
        </div>

        {/* Pre-packaged sample project downloads */}
        <div className="mt-12 p-6 bg-white border border-[#E7E2F0] rounded-3xl max-w-xl mx-auto text-left shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#302B43] uppercase tracking-wider flex items-center space-x-1.5">
              <FileDown className="w-4 h-4 text-[#8B78C6]" />
              <span>Ready-To-Test Sample Archives</span>
            </span>
            <span className="text-[11px] text-[#6A6282] font-semibold">Try in 30 seconds</span>
          </div>
          <p className="text-xs text-[#6A6282] mb-3 leading-relaxed">
            Download a sample ZIP, then upload it to test error detection and clearing guides:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/samples/sample-node-project.zip"
              download
              className="p-3 rounded-2xl bg-[#FAF8FF] hover:bg-[#E9E2FF]/40 border border-[#E7E2F0] hover:border-[#8B78C6] transition flex items-center justify-between text-xs group"
            >
              <div>
                <span className="font-bold text-[#302B43] group-hover:text-[#8B78C6] block">Node.js Express App</span>
                <span className="text-[10px] text-[#6A6282]">Missing axios, port 5000</span>
              </div>
              <FileDown className="w-4 h-4 text-[#8B78C6]" />
            </a>

            <a
              href="/samples/sample-python-project.zip"
              download
              className="p-3 rounded-2xl bg-[#FAF8FF] hover:bg-[#E9E2FF]/40 border border-[#E7E2F0] hover:border-[#8B78C6] transition flex items-center justify-between text-xs group"
            >
              <div>
                <span className="font-bold text-[#302B43] group-hover:text-[#8B78C6] block">Python Flask App</span>
                <span className="text-[10px] text-[#6A6282]">DEBUG=True, missing reqs</span>
              </div>
              <FileDown className="w-4 h-4 text-[#8B78C6]" />
            </a>
          </div>
        </div>

      </section>

      {/* Human 3-Step Walkthrough */}
      <section className="py-12 px-6 bg-white border-t border-[#E7E2F0] max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-extrabold text-[#302B43] text-center mb-8">
          How It Works in 3 Simple Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#E7E2F0] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#4D3E7B] font-extrabold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-sm font-bold text-[#302B43]">Upload Your Project ZIP</h3>
            <p className="text-xs text-[#6A6282] leading-relaxed">
              Safely inspect project files, packages, and Dockerfiles without executing code on the server.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#E7E2F0] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#4D3E7B] font-extrabold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-sm font-bold text-[#302B43]">Check What Breaks</h3>
            <p className="text-xs text-[#6A6282] leading-relaxed">
              Scan for missing dependencies, port issues, Docker configs, and missing environment variables.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#E7E2F0] space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#4D3E7B] font-extrabold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-sm font-bold text-[#302B43]">Clear Errors Step-by-Step</h3>
            <p className="text-xs text-[#6A6282] leading-relaxed">
              Follow plain-English guides, copy fixed code, and mark errors as cleared before release.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E7E2F0] py-6 px-6 text-center text-xs text-[#6A6282] bg-white">
        <p>© 2026 E Predict</p>
      </footer>

    </div>
  );
};
