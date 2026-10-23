import React, { useState } from 'react';
import { X, CheckSquare, Calendar, Flag } from 'lucide-react';
import api from '../api/client';

export const TaskModal = ({ isOpen, onClose, projectId, issue = null, onTaskCreated }) => {
  const [title, setTitle] = useState(issue ? `Fix: ${issue.title}` : '');
  const [description, setDescription] = useState(issue ? `Resolve ${issue.category} issue in ${issue.file}:${issue.line || 1}\n\nSolution: ${issue.solution}` : '');
  const [priority, setPriority] = useState(issue ? (issue.severity === 'Critical' ? 'Critical' : issue.severity === 'High' ? 'High' : 'Medium') : 'Medium');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline || null,
        issueId: issue ? issue._id : null
      };

      const res = await api.post(`/tasks/project/${projectId}`, payload);
      if (res.data.success) {
        if (onTaskCreated) onTaskCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn text-[#302B43]">
      <div className="bg-white border border-[#E7E2F0] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2F0] bg-[#FAF8FF]">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#E9E2FF] border border-[#D9CFFF] text-[#8B78C6] rounded-xl">
              <CheckSquare className="w-5 h-5 text-[#8B78C6]" />
            </div>
            <h3 className="text-base font-extrabold text-[#302B43]">
              {issue ? 'Create Fix Task from Error' : 'Add Deployment Task'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#6A6282] hover:text-[#302B43] p-1.5 rounded-xl hover:bg-[#F5F3FF] transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Update Dockerfile CMD entrypoint"
              className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5">
              Description & Steps
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical steps..."
              className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] placeholder-[#A29BB8] outline-none resize-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5 flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5 text-[#8B78C6]" />
                <span>Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#302B43] outline-none cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#302B43] mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#8B78C6]" />
                <span>Target Deadline</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] focus:bg-white rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#302B43] outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#E7E2F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6A6282] hover:text-[#302B43] bg-white hover:bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-extrabold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 transition cursor-pointer"
            >
              <span>{loading ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
