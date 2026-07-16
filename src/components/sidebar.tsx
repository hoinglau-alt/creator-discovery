'use client';

import {
  Compass,
  BarChart3,
  Mail,
  MessageSquare,
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'discovery', label: '发现与映射', icon: Compass, desc: '搜索·筛选·Mapping' },
  { id: 'evaluation', label: 'AI评估', icon: BarChart3, desc: '评分与分析' },
  { id: 'outreach', label: 'AI外联', icon: Mail, desc: '批量话术与跟踪' },
  { id: 'management', label: '数据管理', icon: Database, desc: '表格与导出' },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#0f172a] text-slate-300 flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-[#00a1d6] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white whitespace-nowrap">Creator Discovery</h1>
            <p className="text-[10px] text-slate-500 whitespace-nowrap">港澳台达人运营系统</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                isActive
                  ? 'bg-[#00a1d6]/15 text-[#00a1d6]'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[#00a1d6]')} />
              {!collapsed && (
                <div className="overflow-hidden">
                  <span className="text-sm font-medium block whitespace-nowrap">{item.label}</span>
                  <span className="text-[10px] text-slate-500 block whitespace-nowrap">{item.desc}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">已收录创作者</span>
              <span className="text-[#00a1d6] font-bold">32</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-400">已入驻</span>
              <span className="text-emerald-400 font-bold">1</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
