'use client';

import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ title, subtitle, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索创作者..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/30 focus:border-[#00a1d6] transition-all"
          />
        </div>
        <button className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00a1d6] rounded-full text-[10px] text-white flex items-center justify-center">3</span>
        </button>
        <div className="w-9 h-9 rounded-lg bg-[#00a1d6] flex items-center justify-center text-white">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
