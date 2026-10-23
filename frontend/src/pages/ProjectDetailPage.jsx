import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { ReadinessGauge } from '../components/ReadinessGauge';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

export const ProjectDetailPage = () => {
  const { id } = useParams();

  const [projectData, setProjectData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data.success) {
        setProjectData(res.data.data);
      }

      const taskRes = await api.get(`/tasks/project/${id}`);
      if (taskRes.data.success) setTasks(taskRes.data.data);

      const issueRes = await api.get(`/issues/project/${id}`);
      if (issueRes.data.success) setIssues(issueRes.data.data);

    } catch (err) {
      setError('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#6A6282]">Loading project details...</div>;
  }

  if (error || !projectData) {
    return <div className="p-12 text-center text-xs text-rose-600 font-bold">{error || 'Project not found.'}</div>;
  }

  const { project, latestAnalysis, summary } = projectData;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#6A6282] mb-1">
            <Link to="/projects" className="hover:text-[#8B78C6] font-bold">Projects</Link>
            <span>/</span>
            <span className="text-[#302B43] font-extrabold">{project.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-[#302B43]">{project.name}</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E9E2FF] border border-[#D9CFFF] text-[#4D3E7B]">
              {project.deploymentPlatform}
            </span>
          </div>
          <p className="text-xs text-[#6A6282] mt-0.5 font-medium">{project.description || 'Uploaded software codebase.'}</p>
        </div>

        <Link
          to={`/upload?projectId=${project._id}`}
          className="px-4 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Scan ZIP Again</span>
        </Link>
      </div>

      {/* Main Readiness Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm">
        
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E7E2F0] pb-6 md:pb-0 md:pr-6">
          <ReadinessGauge
            score={project.latestReadinessScore || 0}
            size={160}
            passedChecks={latestAnalysis?.metrics?.passedChecks || 0}
            criticalCount={summary?.criticalIssuesCount || 0}
          />
        </div>

        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${summary?.criticalIssuesCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              <h3 className="text-base font-extrabold text-[#302B43]">
                {summary?.criticalIssuesCount > 0
                  ? `${summary?.criticalIssuesCount} critical blocker(s) found in this project`
                  : 'All critical checks passed!'}
              </h3>
            </div>
            <p className="text-xs text-[#6A6282] leading-relaxed font-medium">
              {latestAnalysis?.scoreExplanation || 'No scans executed yet. Upload your project ZIP to get error check results.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF8FF] rounded-2xl border border-[#E7E2F0] text-xs">
            <div>
              <span className="text-[10px] text-[#6A6282] uppercase font-bold block">Must Fix</span>
              <span className="text-lg font-extrabold text-rose-600">{summary?.criticalIssuesCount || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6A6282] uppercase font-bold block">Open Issues</span>
              <span className="text-lg font-extrabold text-[#302B43]">{summary?.openIssuesCount || 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#1E7E52] uppercase font-bold block">Cleared</span>
              <span className="text-lg font-extrabold text-[#1E7E52]">{summary?.resolvedIssuesCount || 0}</span>
            </div>
          </div>

          {latestAnalysis && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-[#E7E2F0]">
              <Link
                to={`/analyses/${latestAnalysis._id}`}
                className="text-xs font-bold text-[#8B78C6] hover:text-[#7865B3] hover:underline flex items-center space-x-1"
              >
                <span>View All Errors & Step-by-Step Fix Guides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href={`/api/reports/project/${project._id}/analysis/${latestAnalysis._id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-[#6A6282] hover:text-[#302B43] font-semibold flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5 text-[#8B78C6]" />
                <span>PDF Report</span>
              </a>
            </div>
          )}
        </div>

      </div>

      {/* Identified Errors Preview */}
      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#302B43] flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Identified Errors ({issues.length})</span>
          </h3>
          {latestAnalysis && (
            <Link to={`/analyses/${latestAnalysis._id}`} className="text-xs font-bold text-[#8B78C6] hover:underline">
              See Fix Instructions →
            </Link>
          )}
        </div>

        <div className="space-y-2.5">
          {issues.slice(0, 5).map((iss) => (
            <div
              key={iss._id}
              className="p-3 bg-[#FAF8FF] hover:border-[#8B78C6] border border-[#E7E2F0] rounded-xl flex items-center justify-between text-xs transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <SeverityBadge severity={iss.severity} />
                  <span className="font-mono text-[11px] font-bold text-[#6A6282]">{iss.file}:{iss.line || 1}</span>
                </div>
                <div className="font-bold text-[#302B43]">{iss.title}</div>
              </div>
              <StatusBadge status={iss.status} />
            </div>
          ))}

          {issues.length === 0 && (
            <p className="text-xs text-[#6A6282] py-3">No errors found. Everything looks clean!</p>
          )}
        </div>
      </div>

    </div>
  );
};
