import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  LayoutDashboard,
  FolderGit2,
  Bot,
  CheckSquare,
  FileText,
  Settings,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { to: '/upload', label: 'Upload ZIP & Check', icon: UploadCloud, highlight: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'My Projects & Scans', icon: FolderGit2 },
    { to: '/assistant', label: 'AI Error Assistant', icon: Bot, badge: 'AI' },
    { to: '/tasks', label: 'Task Management', icon: CheckSquare },
    { to: '/reports', label: 'Audit Reports & PDF', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E7E2F0] flex flex-col shrink-0 min-h-[calc(100vh-57px)]">
      
      {/* Navigation links */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6A6282]">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                item.highlight
                  ? 'bg-[#8B78C6] hover:bg-[#7865B3] text-white shadow-sm shadow-[#8B78C6]/30'
                  : isActive
                  ? 'bg-[#E9E2FF] text-[#4D3E7B] border border-[#D9CFFF]'
                  : 'text-[#6A6282] hover:text-[#302B43] hover:bg-[#F5F3FF] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-white' : isActive ? 'text-[#8B78C6]' : 'text-[#8B78C6]/80'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-extrabold bg-[#E9E2FF] text-[#4D3E7B] px-1.5 py-0.5 rounded-md border border-[#D9CFFF]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Simplified Helper Box */}
      <div className="p-4 m-3 rounded-2xl bg-[#F5F3FF] border border-[#E7E2F0] text-xs">
        <div className="flex items-center space-x-1.5 text-[#302B43] font-bold mb-1">
          <ShieldCheck className="w-4 h-4 text-[#8B78C6]" />
          <span>Fast Static Check</span>
        </div>
        <p className="text-[#6A6282] text-[11px] leading-relaxed">
          Zero code execution on server.
        </p>
      </div>

    </aside>
  );
};
