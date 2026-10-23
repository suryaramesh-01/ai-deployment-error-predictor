import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Search,
  UploadCloud,
  Server,
  Trash2,
  ArrowRight
} from 'lucide-react';
import api from '../api/client';

export const MyProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and its scan history?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.technologies?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
            <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <span>My Projects & Scans</span>
          </h1>
          <p className="text-xs text-[#6A6282] mt-0.5">
            View all uploaded codebases, their deployment readiness, and cleared error counts.
          </p>
        </div>

        <Link
          to="/upload"
          className="px-4 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Project ZIP</span>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#E7E2F0] p-3 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#6A6282] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#302B43] placeholder-[#A29BB8] outline-none transition"
          />
        </div>
        <span className="text-xs font-semibold text-[#6A6282]">{filtered.length} project(s)</span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6A6282]">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E7E2F0] rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <FolderGit2 className="w-10 h-10 text-[#A29BB8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#302B43]">No Projects Found</h3>
          <p className="text-xs text-[#6A6282] mt-1 mb-4">
            Upload your first project ZIP archive to scan for deployment errors.
          </p>
          <Link
            to="/upload"
            className="px-4 py-2 bg-[#8B78C6] hover:bg-[#7865B3] text-white text-xs font-extrabold rounded-xl inline-flex items-center space-x-1.5 shadow-sm shadow-[#8B78C6]/25 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload ZIP</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const hasScore = p.latestReadinessScore !== null && p.latestReadinessScore !== undefined;
            const score = p.latestReadinessScore || 0;
            const scoreColor = score >= 80 ? 'text-[#1E7E52] bg-[#EEFBF4] border-[#C6EFDA]' :
                               score >= 50 ? 'text-[#A66D14] bg-[#FFF9EB] border-[#FDE3A7]' :
                               'text-[#B82B46] bg-[#FDF2F4] border-[#F9CAD2]';

            return (
              <div
                key={p._id}
                className="bg-white border border-[#E7E2F0] hover:border-[#8B78C6] rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="inline-flex items-center space-x-1 text-[#6A6282] font-mono text-[11px] bg-[#FAF8FF] px-2.5 py-0.5 rounded-full border border-[#E7E2F0]">
                      <Server className="w-3 h-3 text-[#8B78C6]" />
                      <span>{p.deploymentPlatform}</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#6A6282]">{p.status}</span>
                  </div>

                  <Link to={`/projects/${p._id}`}>
                    <h3 className="text-sm font-extrabold text-[#302B43] hover:text-[#8B78C6] transition truncate">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-[#6A6282] mt-0.5 line-clamp-2 min-h-[32px] font-medium">
                    {p.description || 'Uploaded software codebase.'}
                  </p>

                  {/* Readiness Pill */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#FAF8FF] border border-[#E7E2F0] flex items-center justify-between text-xs">
                    <span className="text-[#6A6282] font-bold">Readiness:</span>
                    {hasScore ? (
                      <span className={`font-mono font-extrabold px-2 py-0.5 rounded-md border text-xs ${scoreColor}`}>
                        {score}/100
                      </span>
                    ) : (
                      <span className="text-[#A29BB8] font-mono text-[11px]">Not Scanned</span>
                    )}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="mt-4 pt-3 border-t border-[#E7E2F0] flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(p._id, p.name)}
                    disabled={deletingId === p._id}
                    className="p-1 text-[#A29BB8] hover:text-rose-600 transition cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/upload?projectId=${p._id}`}
                      className="px-2.5 py-1 text-xs text-[#4D3E7B] hover:bg-[#E9E2FF] border border-[#D9CFFF] rounded-lg font-bold transition"
                    >
                      Scan ZIP
                    </Link>
                    <Link
                      to={`/projects/${p._id}`}
                      className="px-2.5 py-1 text-xs font-bold text-[#302B43] bg-[#FAF8FF] hover:bg-[#E9E2FF] border border-[#E7E2F0] rounded-lg flex items-center space-x-1 transition"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
