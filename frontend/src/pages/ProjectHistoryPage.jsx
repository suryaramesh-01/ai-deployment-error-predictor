import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  TrendingUp,
  TrendingDown,
  Download,
  FolderGit2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../api/client';

export const ProjectHistoryPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success && res.data.data.length > 0) {
          setProjects(res.data.data);
          const firstId = res.data.data[0]._id;
          setSelectedProjectId(firstId);
          fetchHistory(firstId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchHistory = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/project/${projectId}/history`);
      if (res.data.success) {
        setHistoryData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (id) => {
    setSelectedProjectId(id);
    fetchHistory(id);
  };

  const chartData = (historyData?.timeline || []).map((t, idx) => ({
    name: `Scan #${idx + 1}`,
    date: new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: t.readinessScore,
    critical: t.criticalCount,
    total: t.totalIssues
  }));

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
            <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <span>Scan History & Score Progress</span>
          </h1>
          <p className="text-xs text-[#6A6282] mt-0.5">
            Track how your readiness score improves as you clear errors across different ZIP uploads.
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center space-x-2 bg-white border border-[#E7E2F0] px-3.5 py-1.5 rounded-2xl shadow-xs">
            <FolderGit2 className="w-4 h-4 text-[#8B78C6]" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#302B43] outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-white text-[#302B43]">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6A6282]">Loading historical scans...</div>
      ) : !historyData || historyData.timeline.length === 0 ? (
        <div className="bg-white border border-[#E7E2F0] rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <History className="w-10 h-10 text-[#A29BB8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#302B43]">No Scan History Yet</h3>
          <p className="text-xs text-[#6A6282] mt-1 mb-4">
            Upload your project ZIP archive to generate the initial deployment readiness score.
          </p>
          {selectedProjectId && (
            <Link
              to={`/upload?projectId=${selectedProjectId}`}
              className="px-4 py-2 bg-[#8B78C6] hover:bg-[#7865B3] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#8B78C6]/25 inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Upload ZIP</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Trend Chart */}
          <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#302B43] flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#8B78C6]" />
                  <span>Deployment Readiness Score Trend</span>
                </h3>
                <p className="text-xs text-[#6A6282]">Progression from initial baseline scan to current state</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#4D3E7B] bg-[#E9E2FF] px-2.5 py-1 rounded-full border border-[#D9CFFF]">
                {historyData.totalScans} Total Scans
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2F0" />
                  <XAxis dataKey="date" stroke="#6A6282" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#6A6282" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E7E2F0', borderRadius: '12px', color: '#302B43', fontSize: '12px', boxShadow: '0 4px 12px rgba(139, 120, 198, 0.12)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8B78C6"
                    strokeWidth={3}
                    dot={{ fill: '#8B78C6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Scans List */}
          <div className="bg-white border border-[#E7E2F0] rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E7E2F0] flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#302B43]">Scan Logs</h3>
              <span className="text-xs text-[#6A6282] font-semibold">Download reports or inspect findings per scan</span>
            </div>

            <div className="divide-y divide-[#E7E2F0]">
              {historyData.timeline.map((item, idx) => {
                const isImproved = item.scoreDiff > 0;

                return (
                  <div key={item.id} className="p-4 hover:bg-[#FAF8FF] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[#302B43] text-sm">
                          Scan #{historyData.timeline.length - idx}
                        </span>
                        <span className="text-[#6A6282]">
                          • {new Date(item.date).toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] text-[#4D3E7B] bg-[#E9E2FF] px-2 py-0.5 rounded font-semibold border border-[#D9CFFF]">
                          {item.zipFileName || 'Uploaded Archive'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[#6A6282] font-medium">
                        <span className="flex items-center space-x-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-600 font-bold">{item.criticalCount} Critical</span>
                        </span>
                        <span>•</span>
                        <span>{item.totalIssues} Total Errors</span>
                        <span>•</span>
                        <span className="text-[#1E7E52] font-bold">{item.passedChecks} Checks Passed</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-base font-mono font-extrabold text-[#302B43]">
                          {item.readinessScore}/100
                        </div>
                        {item.scoreDiff !== 0 && (
                          <div className={`text-[10px] font-mono font-bold flex items-center justify-end space-x-0.5 ${
                            isImproved ? 'text-[#1E7E52]' : 'text-rose-600'
                          }`}>
                            {isImproved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{item.scoreDiff > 0 ? `+${item.scoreDiff}` : item.scoreDiff}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/analyses/${item.id}`}
                          className="px-3 py-1.5 bg-[#FAF8FF] hover:bg-[#E9E2FF] border border-[#E7E2F0] text-[#302B43] font-bold rounded-xl transition"
                        >
                          View Scan
                        </Link>

                        <a
                          href={`/api/reports/project/${historyData.project._id}/analysis/${item.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-[#E9E2FF] text-[#4D3E7B] hover:bg-[#D9CFFF] border border-[#D9CFFF] rounded-xl transition cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
