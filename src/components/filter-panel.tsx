'use client';

import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { PLATFORMS, REGIONS, CATEGORIES, FOLLOWER_TIERS, CONTENT_TYPES } from '@/lib/constants';
import type { FilterState, Platform, Region, Category, FollowerTier, ContentType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
}

export default function FilterPanel({ filters, onFilterChange, resultCount }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterState,
    value: T,
    current: T[]
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: next });
  };

  const resetFilters = () => {
    onFilterChange({
      platforms: [],
      categories: [],
      regions: [],
      followerTiers: [],
      contentType: 'all',
      searchQuery: '',
      outreachStatus: [],
    });
  };

  const hasActiveFilters =
    filters.platforms.length > 0 ||
    filters.categories.length > 0 ||
    filters.regions.length > 0 ||
    filters.followerTiers.length > 0 ||
    filters.contentType !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">筛选条件</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-[#00a1d6]/10 text-[#00a1d6] text-xs font-medium rounded-full">
              已筛选
            </span>
          )}
          <span className="text-xs text-slate-400">
            找到 <span className="font-bold text-slate-700">{resultCount}</span> 位创作者
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => { e.stopPropagation(); resetFilters(); }}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="重置筛选"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Filters */}
      <div className={cn('filter-panel', expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0')}>
        <div className="px-5 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {/* Platforms */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">目标平台</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => toggleArrayFilter('platforms', p.value, filters.platforms)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.platforms.includes(p.value)
                      ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">地区</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => toggleArrayFilter('regions', r.value, filters.regions)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.regions.includes(r.value)
                      ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {r.flag} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">内容品类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => toggleArrayFilter('categories', c.value, filters.categories)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    filters.categories.includes(c.value)
                      ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follower Tiers + Content Type */}
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-2 block">粉丝量级</label>
              <div className="flex flex-wrap gap-2">
                {FOLLOWER_TIERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => toggleArrayFilter('followerTiers', t.value, filters.followerTiers)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      filters.followerTiers.includes(t.value)
                        ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-48">
              <label className="text-xs font-medium text-slate-500 mb-2 block">内容类型</label>
              <select
                value={filters.contentType}
                onChange={(e) => onFilterChange({ ...filters, contentType: e.target.value as ContentType | 'all' })}
                className="w-full h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/30"
              >
                <option value="all">不限</option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
