import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';
import api from '../api/client';
import { TaskModal } from '../components/TaskModal';

export const TaskManagementPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchProjectsAndTasks = async () => {
    try {
      const pRes = await api.get('/projects');
      if (pRes.data.success && pRes.data.data.length > 0) {
        setProjects(pRes.data.data);
        const activeId = selectedProjectId || pRes.data.data[0]._id;
        setSelectedProjectId(activeId);

        const tRes = await api.get(`/tasks/project/${activeId}`);
        if (tRes.data.success) {
          setTasks(tRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  const handleProjectChange = async (projectId) => {
    setSelectedProjectId(projectId);
    setLoading(true);
    try {
      const res = await api.get(`/tasks/project/${projectId}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      if (res.data.success) {
        setTasks(tasks.map(t => t._id === taskId ? res.data.data : t));
      }
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'Todo');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn text-[#302B43]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#302B43] flex items-center space-x-2">
            <div className="p-1.5 bg-[#E9E2FF] text-[#8B78C6] rounded-xl border border-[#D9CFFF] shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span>Task & Fix Checklist</span>
          </h1>
          <p className="text-xs text-[#6A6282] mt-0.5">
            Keep track of which fixes are pending and check them off as you clear errors in your project.
          </p>
        </div>

        <button
          onClick={() => setIsTaskModalOpen(true)}
          disabled={!selectedProjectId}
          className="px-4 py-2 text-xs font-bold text-white bg-[#8B78C6] hover:bg-[#7865B3] rounded-xl shadow-sm shadow-[#8B78C6]/25 flex items-center space-x-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fix Task</span>
        </button>
      </div>

      {/* Project Selector */}
      <div className="bg-white border border-[#E7E2F0] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#302B43]">Select Project:</span>
          {projects.length > 0 ? (
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-[#FAF8FF] border border-[#E7E2F0] focus:border-[#8B78C6] rounded-xl px-3 py-1.5 text-xs font-bold text-[#302B43] outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-[#6A6282]">No projects found.</span>
          )}
        </div>

        <div className="text-xs text-[#6A6282] font-medium">
          <span className="font-extrabold text-[#1E7E52]">{doneTasks.length}</span> of <span className="font-extrabold text-[#302B43]">{tasks.length}</span> fixes completed
        </div>
      </div>

      {/* 3 Simple Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Column 1: Todo */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E2F0] text-xs font-bold text-[#302B43]">
            <span>To Clear ({todoTasks.length})</span>
          </div>

          <div className="space-y-2.5">
            {todoTasks.map((t) => (
              <div key={t._id} className="p-3 bg-[#FAF8FF] border border-[#E7E2F0] rounded-xl space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold text-[#302B43]">{t.title}</span>
                  <button onClick={() => handleDeleteTask(t._id)} className="text-[#A29BB8] hover:text-rose-600 transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {t.description && <p className="text-[11px] text-[#6A6282] line-clamp-2">{t.description}</p>}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStatusChange(t._id, 'In Progress')}
                    className="text-[11px] text-[#8B78C6] hover:text-[#7865B3] font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>Start fixing</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {todoTasks.length === 0 && <p className="text-xs text-[#6A6282] text-center py-4">No tasks in To Clear</p>}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E2F0] text-xs font-bold text-[#8B78C6]">
            <span>Fixing Now ({inProgressTasks.length})</span>
          </div>

          <div className="space-y-2.5">
            {inProgressTasks.map((t) => (
              <div key={t._id} className="p-3 bg-[#E9E2FF]/30 border border-[#D9CFFF] rounded-xl space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold text-[#302B43]">{t.title}</span>
                  <button onClick={() => handleDeleteTask(t._id)} className="text-[#A29BB8] hover:text-rose-600 transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {t.description && <p className="text-[11px] text-[#6A6282] line-clamp-2">{t.description}</p>}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStatusChange(t._id, 'Done')}
                    className="px-2.5 py-1 bg-[#8B78C6] hover:bg-[#7865B3] text-white rounded-lg text-[11px] font-extrabold shadow-xs cursor-pointer"
                  >
                    Done ✅
                  </button>
                </div>
              </div>
            ))}

            {inProgressTasks.length === 0 && <p className="text-xs text-[#6A6282] text-center py-4">Nothing currently in progress</p>}
          </div>
        </div>

        {/* Column 3: Done */}
        <div className="bg-white border border-[#E7E2F0] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E2F0] text-xs font-bold text-[#1E7E52]">
            <span>Cleared & Fixed ({doneTasks.length})</span>
          </div>

          <div className="space-y-2.5">
            {doneTasks.map((t) => (
              <div key={t._id} className="p-3 bg-[#EEFBF4]/40 border border-[#C6EFDA] rounded-xl space-y-1 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-[#A29BB8] line-through">{t.title}</span>
                  <button onClick={() => handleDeleteTask(t._id)} className="text-[#A29BB8] hover:text-rose-600 transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStatusChange(t._id, 'Todo')}
                    className="text-[10px] text-[#6A6282] hover:text-[#8B78C6] font-bold hover:underline cursor-pointer"
                  >
                    Reopen
                  </button>
                </div>
              </div>
            ))}

            {doneTasks.length === 0 && <p className="text-xs text-[#6A6282] text-center py-4">No tasks cleared yet</p>}
          </div>
        </div>

      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={selectedProjectId}
        onTaskCreated={() => fetchProjectsAndTasks()}
      />

    </div>
  );
};
