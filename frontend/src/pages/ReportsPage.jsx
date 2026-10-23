import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  UploadCloud,
} from 'lucide-react';
import api from '../api/client';

export const ReportsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success) {
          const enriched = await Promise.all(
            res.data.data.map(async (p) => {
              try {
                const aRes = await api.get(`/projects/${p._id}/analyses`);
                return {
                  ...p,
                  analyses: aRes.data.success ? aRes.data.data : []
                };
              } catch (e) {
                return { ...p, analyses: [] };
              }
            })
          );
          setProjects(enriched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
          <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <span>Deployment Audit Reports & PDF Export</span>
        </h1>
        <p className="text-xs text-[#6A6282] mt-0.5">
          Download certified pre-deployment PDF reports detailing all findings, readiness scores, and clearing checklists.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#6A6282]">Loading audit records...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#E7E2F0] rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <FileText className="w-10 h-10 text-[#A29BB8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#302B43]">No Reports Yet</h3>
          <p className="text-xs text-[#6A6282] mt-1 mb-4">
            Upload your project ZIP to generate audit reports and download PDFs.
          </p>
          <Link
            to="/upload"
            className="px-4 py-2 bg-[#8B78C6] hover:bg-[#7865B3] text-white text-xs font-bold rounded-xl inline-flex items-center space-x-1.5 shadow-sm shadow-[#8B78C6]/25 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload ZIP</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const latest = project.analyses?.[0];

            return (
              <div
                key={project._id}
                className="bg-white border border-[#E7E2F0] rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E2F0]">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF8FF] border border-[#E7E2F0] text-[#6A6282]">
                        {project.deploymentPlatform}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#302B43]">{project.name}</h3>
                  </div>

                  {latest && (
                    <a
                      href={`/api/reports/project/${project._id}/analysis/${latest._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl transition flex items-center space-x-1.5 shadow-sm shadow-[#8B78C6]/25 self-start sm:self-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Audit</span>
                    </a>
                  )}
                </div>

                {latest ? (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF8FF] rounded-xl text-xs border border-[#E7E2F0]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6A6282] block">Readiness</span>
                      <span className="font-mono font-bold text-[#302B43] text-sm">{latest.readinessScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Errors Found</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">{latest.metrics?.totalIssues || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#1E7E52] block">Checks Passed</span>
                      <span className="font-mono font-bold text-[#1E7E52] text-sm">{latest.metrics?.passedChecks || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6A6282]">No scans executed yet for this project.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
