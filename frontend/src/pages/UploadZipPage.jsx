import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileArchive,
  AlertCircle,
  ShieldCheck,
  FileDown,
  Sparkles,
  ArrowRight,
  Server
} from 'lucide-react';
import api from '../api/client';

export const UploadZipPage = () => {
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [platform, setPlatform] = useState('Docker');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.zip')) {
        setError('Please choose a .zip file.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
      if (!projectName) {
        const cleanName = selected.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
        setProjectName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.zip')) {
        setError('Please drop a .zip file.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
      if (!projectName) {
        const cleanName = selected.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
        setProjectName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drop a project ZIP file first.');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(30);

    const formData = new FormData();
    formData.append('projectZip', file);
    formData.append('projectName', projectName || file.name.replace(/\.zip$/i, ''));
    formData.append('deploymentPlatform', platform);

    try {
      setProgress(60);
      const res = await api.post('/projects/quick-upload-and-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 80) / progressEvent.total);
          setProgress(percent);
        }
      });

      setProgress(100);
      if (res.data.success) {
        navigate(`/analyses/${res.data.data.analysis._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Scan failed. Please verify the ZIP archive.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#302B43] flex items-center space-x-2.5">
          <div className="p-2 bg-[#E9E2FF] text-[#8B78C6] rounded-2xl border border-[#D9CFFF] shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span>Upload ZIP & Check Errors</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#6A6282] mt-1 max-w-2xl leading-relaxed">
          Inspect source code, dependencies, Dockerfiles, and cloud settings to spot deployment issues and view step-by-step solutions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#302B43] mb-1.5">
                Project Name (Optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Payment API or Web App"
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#302B43] mb-1.5 flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-[#8B78C6]" />
                <span>Target Deployment Platform</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] outline-none cursor-pointer"
              >
                <option value="Docker">Docker Container</option>
                <option value="AWS">AWS (ECS / Elastic Beanstalk)</option>
                <option value="Kubernetes">Kubernetes Cluster</option>
                <option value="Traditional Server">Traditional Linux VPS</option>
                <option value="Vercel / Netlify">Vercel / Netlify</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('projectZipInput').click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              dragOver
                ? 'border-[#8B78C6] bg-[#E9E2FF]/40'
                : file
                ? 'border-[#8B78C6] bg-[#E9E2FF]/20'
                : 'border-[#D9CFFF] hover:border-[#8B78C6] bg-[#FAF8FF] hover:bg-[#F5F3FF]'
            }`}
          >
            <input
              id="projectZipInput"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#8B78C6] flex items-center justify-center mx-auto shadow-xs">
                  <FileArchive className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#302B43]">{file.name}</h4>
                  <p className="text-xs text-[#6A6282] font-mono mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                  </p>
                </div>
                <span className="inline-block text-xs text-[#8B78C6] font-bold hover:underline">
                  Click or drop another file to change
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#E9E2FF] border border-[#D9CFFF] text-[#8B78C6] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#302B43]">Drop your project ZIP file here</h4>
                  <p className="text-xs text-[#6A6282] mt-0.5">or click to browse from your computer</p>
                </div>
                <span className="text-[11px] text-[#A29BB8] font-mono">
                  Supported format: .ZIP (Max 50MB)
                </span>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {uploading && (
            <div className="space-y-2 p-4 bg-[#FAF8FF] border border-[#E7E2F0] rounded-2xl">
              <div className="flex justify-between text-xs text-[#302B43] font-bold">
                <span>Checking code, syntax, dependencies, and Docker configurations...</span>
                <span className="font-mono text-[#8B78C6]">{progress}%</span>
              </div>
              <div className="w-full bg-[#E9E2FF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#8B78C6] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Big Action Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className={`w-full py-3.5 px-4 font-extrabold rounded-2xl transition flex items-center justify-center space-x-2 shadow-sm ${
              uploading || !file
                ? 'bg-[#E9E2FF]/50 text-[#A29BB8] cursor-not-allowed border border-[#E7E2F0]'
                : 'bg-[#8B78C6] hover:bg-[#7865B3] text-white shadow-[#8B78C6]/25 cursor-pointer'
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{uploading ? 'Analyzing Code & Config...' : 'Check For Deployment Errors Now'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Safety Note */}
        <div className="mt-6 pt-5 border-t border-[#E7E2F0] flex items-center space-x-2 text-xs text-[#6A6282]">
          <ShieldCheck className="w-4 h-4 text-[#8B78C6] shrink-0" />
          <span>
            <strong className="text-[#302B43]">Safe Inspection:</strong> Your project files are statically parsed. Code is never executed on our servers.
          </span>
        </div>
      </div>

      {/* 1-Click Ready Test Projects */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-[#302B43] uppercase tracking-wider flex items-center space-x-1.5">
            <FileDown className="w-4 h-4 text-[#8B78C6]" />
            <span>Want to test immediately? Download a sample project:</span>
          </span>
          <span className="text-[11px] text-[#6A6282]">Pre-configured with real errors</span>
        </div>
        <p className="text-xs text-[#6A6282] mb-4">
          Download either test project, then drop it into the upload box above to see how errors are detected and explained:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/samples/sample-node-project.zip"
            download
            className="p-3.5 rounded-2xl bg-[#FAF8FF] hover:bg-[#E9E2FF]/40 border border-[#E7E2F0] hover:border-[#8B78C6] transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-[#302B43] group-hover:text-[#8B78C6]">
                sample-node-project.zip
              </div>
              <div className="text-[11px] text-[#6A6282] mt-0.5">
                Node.js API: missing axios, port 5000, loopback 127.0.0.1
              </div>
            </div>
            <FileDown className="w-4 h-4 text-[#8B78C6] shrink-0 ml-2" />
          </a>

          <a
            href="/samples/sample-python-project.zip"
            download
            className="p-3.5 rounded-2xl bg-[#FAF8FF] hover:bg-[#E9E2FF]/40 border border-[#E7E2F0] hover:border-[#8B78C6] transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-[#302B43] group-hover:text-[#8B78C6]">
                sample-python-project.zip
              </div>
              <div className="text-[11px] text-[#6A6282] mt-0.5">
                Python Flask: missing requests, DEBUG=True, hardcoded DB
              </div>
            </div>
            <FileDown className="w-4 h-4 text-[#8B78C6] shrink-0 ml-2" />
          </a>
        </div>
      </div>

    </div>
  );
};
