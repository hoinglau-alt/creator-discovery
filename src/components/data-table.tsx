'use client';

import { Download, ArrowUpDown, Filter } from 'lucide-react';
import { useState } from 'react';
import type { Creator } from '@/lib/types';
import { PLATFORMS, REGIONS, OUTREACH_STATUSES, OPERATORS, CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DataTableProps {
  creators: Creator[];
  onCreatorClick: (creator: Creator) => void;
}

type SortKey = 'name' | 'followers' | 'fitScore' | 'platform' | 'region' | 'status';
type SortDir = 'asc' | 'desc';

function SortHeader({ label, sortKeyVal, currentSortKey, currentSortDir, onSort }: {
  label: string;
  sortKeyVal: SortKey;
  currentSortKey: SortKey;
  currentSortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onSort(sortKeyVal)}
      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
    >
      {label}
      <ArrowUpDown className={cn('w-3 h-3', currentSortKey === sortKeyVal ? 'text-[#00a1d6]' : 'text-slate-300')} />
    </button>
  );
}

export default function DataTable({ creators, onCreatorClick }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('fitScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [assignFilter, setAssignFilter] = useState<string>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = assignFilter === 'all' ? creators : creators.filter((c) => c.assignedTo === assignFilter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'name': return a.name.localeCompare(b.name) * dir;
      case 'followers': return (a.followers - b.followers) * dir;
      case 'fitScore': return (a.evaluation.fitScore - b.evaluation.fitScore) * dir;
      case 'platform': return a.platform.localeCompare(b.platform) * dir;
      case 'region': return a.region.localeCompare(b.region) * dir;
      case 'status': return a.outreachStatus.localeCompare(b.outreachStatus) * dir;
      default: return 0;
    }
  });

  const exportCSV = () => {
    const headers = ['名称', '平台', '账号', '地区', '品类', '粉丝数', '适配度评分', '合作意愿', '增长趋势', '外联状态', '负责人', '联系方式'];
    const rows = sorted.map((c) => {
      const platform = PLATFORMS.find((p) => p.value === c.platform)?.label || '';
      const region = REGIONS.find((r) => r.value === c.region)?.label || '';
      const categories = c.categories.map((cat) => CATEGORIES.find((cc) => cc.value === cat)?.label || '').join('/');
      const status = OUTREACH_STATUSES.find((s) => s.value === c.outreachStatus)?.label || '';
      const contacts = c.contactInfo.map((ci) => ci.value).join('; ');
      return [c.name, platform, c.platformHandle, region, categories, c.followers, c.evaluation.fitScore, c.evaluation.cooperationWillingness, c.evaluation.growthTrend, status, c.assignedTo, contacts];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creators_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500">负责人:</span>
          <select
            value={assignFilter}
            onChange={(e) => setAssignFilter(e.target.value)}
            className="h-7 px-2 rounded-md border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/30"
          >
            <option value="all">全部</option>
            {OPERATORS.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">共 {sorted.length} 条</span>
        </div>
        <button
          onClick={exportCSV}
          className="h-8 px-3 bg-[#00a1d6] text-white text-xs font-medium rounded-lg hover:bg-[#0090c0] transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          导出 CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-left px-4 py-2.5"><SortHeader label="创作者" sortKeyVal="name" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-left px-4 py-2.5"><SortHeader label="平台" sortKeyVal="platform" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-left px-4 py-2.5"><SortHeader label="地区" sortKeyVal="region" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-right px-4 py-2.5"><SortHeader label="粉丝数" sortKeyVal="followers" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-center px-4 py-2.5"><SortHeader label="适配度" sortKeyVal="fitScore" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-center px-4 py-2.5"><SortHeader label="状态" sortKeyVal="status" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} /></th>
              <th className="text-left px-4 py-2.5"><span className="text-xs font-medium text-slate-500">负责人</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((creator) => {
              const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
              const region = REGIONS.find((r) => r.value === creator.region)!;
              const status = OUTREACH_STATUSES.find((s) => s.value === creator.outreachStatus)!;
              const scoreColor = creator.evaluation.fitScore >= 8 ? 'text-emerald-600' : creator.evaluation.fitScore >= 6 ? 'text-[#00a1d6]' : creator.evaluation.fitScore >= 4 ? 'text-amber-600' : 'text-red-500';
              return (
                <tr
                  key={creator.id}
                  onClick={() => onCreatorClick(creator)}
                  className="border-t border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: platform.color + '30', color: platform.color }}>
                        {creator.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{creator.name}</p>
                        <p className="text-xs text-slate-400">@{creator.platformHandle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ backgroundColor: platform.color + '10', color: platform.color }}>
                      {platform.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{region.flag} {region.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-slate-700 font-mono">
                      {creator.followers >= 10000 ? `${(creator.followers / 10000).toFixed(1)}万` : creator.followers.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-sm font-bold', scoreColor)}>{creator.evaluation.fitScore}</span>
                    <span className="text-xs text-slate-400">/10</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="status-badge" style={{ backgroundColor: status.color + '15', color: status.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{creator.assignedTo}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
