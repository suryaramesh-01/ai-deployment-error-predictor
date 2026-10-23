import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  FolderGit2,
  Activity
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await api.get('/projects/stats/dashboard');
        if (isMounted && res.data && res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-12 flex items-center justify-center text-xs text-[#6A6282]">
        <div className="w-8 h-8 border-2 border-[#8B78C6] border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="font-semibold">Loading overview metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn bg-[#F5F3FF] text-[#302B43]">
      
      {/* Direct Upload Hero */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-[#E9E2FF] text-[#4D3E7B] px-3 py-1 rounded-full text-xs font-bold border border-[#D9CFFF]">
            <Sparkles className="w-3.5 h-3.5 text-[#8B78C6]" />
            <span>Deployment Scanner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#302B43]">
            Hi {user?.name || 'Developer'}! Ready to deploy?
          </h1>
          <p className="text-xs sm:text-sm text-[#6A6282] max-w-xl leading-relaxed font-medium">
            Scan your project ZIP to catch deployment errors and view instant fixes.
          </p>
        </div>

        <Link
          to="/upload"
          className="px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-2xl shadow-sm shadow-[#8B78C6]/30 transition flex items-center justify-center space-x-2 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <UploadCloud className="w-5 h-5 text-white" />
          <span>Upload Project ZIP</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Critical Issues */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6A6282] font-bold mb-2">
            <span>Critical Errors</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">
            {stats?.criticalDeploymentIssues || 0}
          </div>
          <span className="text-[11px] text-[#6A6282] mt-1 block font-medium">
            Must clear before cloud release
          </span>
        </div>

        {/* Cleared Errors */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6A6282] font-bold mb-2">
            <span>Cleared Errors</span>
            <div className="w-8 h-8 rounded-xl bg-[#EEFBF4] text-[#1E7E52] flex items-center justify-center border border-[#C6EFDA]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1E7E52]">
            {stats?.resolvedIssues || 0}
          </div>
          <span className="text-[11px] text-[#6A6282] mt-1 block font-medium">
            Issues marked as fixed
          </span>
        </div>

        {/* Total Projects */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6A6282] font-bold mb-2">
            <span>Total Projects</span>
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] text-[#8B78C6] flex items-center justify-center border border-[#D9CFFF]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#302B43]">
            {stats?.totalProjects || 0}
          </div>
          <span className="text-[11px] text-[#6A6282] mt-1 block font-medium">
            Active repositories scanned
          </span>
        </div>

        {/* Average Readiness */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#6A6282] font-bold mb-2">
            <span>Average Readiness</span>
            <div className="w-8 h-8 rounded-xl bg-[#E9E2FF] text-[#8B78C6] flex items-center justify-center border border-[#D9CFFF]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#302B43]">
            {stats?.avgHealthScore || 100}
            <span className="text-sm font-bold text-[#6A6282]">/100</span>
          </div>
          <span className="text-[11px] text-[#6A6282] mt-1 block font-medium">
            Score across recent scans
          </span>
        </div>

      </div>

      {/* Two Column Section: Recent Scans & Quick Test Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Scans */}
        <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#302B43] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#8B78C6]" />
              <span>Recent Project Scans</span>
            </h3>
            <Link to="/projects" className="text-xs text-[#8B78C6] hover:text-[#7865B3] hover:underline font-bold">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-[#FAF8FF] hover:bg-[#F5F3FF] border border-[#E7E2F0] rounded-2xl flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      act.score >= 80 ? 'bg-[#EEFBF4] text-[#1E7E52] border border-[#C6EFDA]' :
                      act.score >= 50 ? 'bg-[#FFF9EB] text-[#A66D14] border border-[#FDE3A7]' : 'bg-[#FDF2F4] text-[#B82B46] border border-[#F9CAD2]'
                    }`}>
                      {act.score}%
                    </span>
                    <div>
                      <div className="font-bold text-[#302B43]">{act.text}</div>
                      <div className="text-[10px] text-[#6A6282]">{new Date(act.date).toLocaleString()}</div>
                    </div>
                  </div>

                  <Link
                    to={`/analyses/${act.id}`}
                    className="text-xs text-[#8B78C6] hover:text-[#7865B3] font-bold p-1 hover:underline"
                  >
                    View Errors
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#6A6282]">
                No project scans recorded yet. Drop a ZIP file to get your first deployment report.
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Test Sample Projects */}
        <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-[#302B43] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#8B78C6]" />
              <span>Quick Test Sample Projects</span>
            </h3>
            <p className="text-xs text-[#6A6282] mt-0.5">
              Don't have a project on hand? Download either pre-configured test project and upload it:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E7E2F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#302B43]">Node.js Express API Sample</span>
                <a
                  href="/samples/sample-node-project.zip"
                  download
                  className="text-xs font-bold text-[#8B78C6] hover:text-[#7865B3] hover:underline"
                >
                  Download .ZIP
                </a>
              </div>
              <p className="text-xs text-[#6A6282] leading-relaxed">
                Contains real deployment traps: undeclared <code className="bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded font-semibold">axios</code> dependency, hardcoded port 5000, missing Docker CMD, and loopback binding.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E7E2F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#302B43]">Python Flask API Sample</span>
                <a
                  href="/samples/sample-python-project.zip"
                  download
                  className="text-xs font-bold text-[#8B78C6] hover:text-[#7865B3] hover:underline"
                >
                  Download .ZIP
                </a>
              </div>
              <p className="text-xs text-[#6A6282] leading-relaxed">
                Contains real Python deployment traps: undeclared <code className="bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded font-semibold">requests</code>, hardcoded <code className="bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded font-semibold">DEBUG=True</code>, and plaintext database credentials.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
