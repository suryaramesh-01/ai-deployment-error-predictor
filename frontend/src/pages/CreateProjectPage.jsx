import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderPlus, Code, ArrowRight } from 'lucide-react';
import api from '../api/client';

export const CreateProjectPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    technologies: 'Node.js, Express, Docker',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletionDate: '',
    deploymentPlatform: 'Docker',
    status: 'In Progress'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availablePlatforms = [
    'Docker',
    'AWS',
    'Kubernetes',
    'Traditional Server',
    'Vercel / Netlify'
  ];

  const commonTechnologies = [
    'Node.js', 'Express.js', 'React', 'Python', 'Flask', 'Django',
    'Docker', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Redis', 'AWS'
  ];

  const handleTechClick = (tech) => {
    const list = formData.technologies ? formData.technologies.split(',').map(s => s.trim()) : [];
    if (!list.includes(tech)) {
      list.push(tech);
      setFormData({ ...formData, technologies: list.join(', ') });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/projects', {
        ...formData,
        technologies: formData.technologies.split(',').map(s => s.trim()).filter(Boolean)
      });

      if (res.data.success) {
        navigate(`/upload?projectId=${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-xs text-[#6A6282] mb-1">
          <Link to="/projects" className="hover:text-[#8B78C6] font-bold">My Projects</Link>
          <span>/</span>
          <span className="text-[#302B43] font-extrabold">Create New Project</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2.5">
          <div className="p-2 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
            <FolderPlus className="w-5 h-5" />
          </div>
          <span>Create New Project</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#6A6282] mt-1">
          Set up project metadata before uploading your ZIP file for deployment analysis.
        </p>
      </div>

      <div className="bg-white border border-[#E7E2F0] rounded-3xl p-6 sm:p-8 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., E-Commerce Microservices Platform"
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5">
                Target Platform
              </label>
              <select
                value={formData.deploymentPlatform}
                onChange={(e) => setFormData({ ...formData, deploymentPlatform: e.target.value })}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] outline-none cursor-pointer"
              >
                {availablePlatforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of application scope..."
              className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none resize-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5 flex items-center space-x-1.5">
              <Code className="w-4 h-4 text-[#8B78C6]" />
              <span>Programming Languages & Technologies (Comma-Separated)</span>
            </label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              placeholder="e.g., Node.js, Express, React, Docker, MongoDB"
              className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
            />
            
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-[#6A6282] mr-1 font-semibold">Quick Select:</span>
              {commonTechnologies.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTechClick(t)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8FF] hover:bg-[#E9E2FF] border border-[#E7E2F0] hover:border-[#8B78C6] text-[#302B43] transition cursor-pointer"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E2F0] flex items-center justify-between">
            <Link
              to="/projects"
              className="px-4 py-2 text-xs font-bold text-[#6A6282] hover:text-[#302B43]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#8B78C6] hover:bg-[#7865B3] text-white font-extrabold text-xs rounded-xl shadow-sm shadow-[#8B78C6]/25 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{loading ? 'Creating...' : 'Create & Upload ZIP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
