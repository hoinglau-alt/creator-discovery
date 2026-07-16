'use client';

import { useMemo } from 'react';
import type { Creator, Platform, Category } from '@/lib/types';
import { PLATFORMS, CATEGORIES, REGIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { MapPin, ExternalLink } from 'lucide-react';

interface MappingViewProps {
  creators: Creator[];
  onCreatorClick: (creator: Creator) => void;
  onCellClick: (platform: Platform, category: Category) => void;
}

export default function MappingView({ creators, onCreatorClick, onCellClick }: MappingViewProps) {
  // Build matrix: platform x category
  const matrix = useMemo(() => {
    const map: Record<string, Record<string, Creator[]>> = {};
    for (const p of PLATFORMS) {
      map[p.value] = {};
      for (const c of CATEGORIES) {
        map[p.value][c.value] = [];
      }
    }
    for (const creator of creators) {
      for (const cat of creator.categories) {
        if (map[creator.platform]?.[cat]) {
          map[creator.platform][cat].push(creator);
        }
      }
    }
    return map;
  }, [creators]);

  // Regional distribution
  const regionStats = useMemo(() => {
    const stats: Record<string, { total: number; platforms: Record<string, number>; avgScore: number; creators: Creator[] }> = {};
    for (const r of REGIONS) {
      stats[r.value] = { total: 0, platforms: {}, avgScore: 0, creators: [] };
    }
    for (const c of creators) {
      if (stats[c.region]) {
        stats[c.region].total++;
        stats[c.region].platforms[c.platform] = (stats[c.region].platforms[c.platform] || 0) + 1;
        stats[c.region].avgScore += c.evaluation.fitScore;
        stats[c.region].creators.push(c);
      }
    }
    for (const r of REGIONS) {
      const s = stats[r.value];
      s.avgScore = s.total > 0 ? Math.round((s.avgScore / s.total) * 10) / 10 : 0;
    }
    return stats;
  }, [creators]);

  // Platform totals
  const platformTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of PLATFORMS) totals[p.value] = 0;
    for (const c of creators) totals[c.platform]++;
    return totals;
  }, [creators]);

  const getCellColor = (count: number): string => {
    if (count === 0) return 'bg-slate-50';
    if (count === 1) return 'bg-sky-50';
    if (count === 2) return 'bg-sky-100';
    if (count <= 4) return 'bg-sky-200';
    return 'bg-sky-300';
  };

  const getCellTextColor = (count: number): string => {
    if (count === 0) return 'text-slate-300';
    if (count <= 2) return 'text-slate-600';
    return 'text-sky-800';
  };

  return (
    <div className="space-y-6">
      {/* Regional Overview */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#00a1d6]" />
          地区分布概览
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {REGIONS.map((region) => {
            const stat = regionStats[region.value];
            return (
              <div key={region.value} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{region.flag}</span>
                    <span className="text-sm font-semibold text-slate-900">{region.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {stat.total} 位创作者
                  </span>
                </div>
                {/* Platform breakdown */}
                <div className="space-y-1.5">
                  {PLATFORMS.map((p) => {
                    const count = stat.platforms[p.value] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={p.value} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-xs text-slate-500 flex-1">{p.label}</span>
                        <span className="text-xs font-semibold text-slate-700">{count}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${stat.total > 0 ? (count / stat.total) * 100 : 0}%`,
                              backgroundColor: p.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">平均适配度</span>
                  <span className="text-sm font-bold text-[#00a1d6]">{stat.avgScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform x Category Matrix */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#00a1d6]" />
          平台 x 品类 创作者矩阵
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500 w-28 sticky left-0 bg-slate-50/80 z-10">
                    平台 \ 品类
                  </th>
                  {CATEGORIES.map((cat) => (
                    <th key={cat.value} className="px-2 py-2.5 text-center min-w-[52px]">
                      <span className="text-[10px] text-slate-500 block" title={cat.label}>
                        {cat.emoji}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 whitespace-nowrap">
                        {cat.label.slice(0, 2)}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-slate-500">
                    合计
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLATFORMS.map((platform) => (
                  <tr key={platform.value} className="border-t border-slate-100">
                    <td className="px-3 py-2 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: platform.color }} />
                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{platform.label}</span>
                      </div>
                    </td>
                    {CATEGORIES.map((cat) => {
                      const cellCreators = matrix[platform.value][cat.value];
                      const count = cellCreators.length;
                      return (
                        <td
                          key={cat.value}
                          className={cn(
                            'px-1 py-1 text-center cursor-pointer transition-all hover:ring-2 hover:ring-[#00a1d6]/30 hover:ring-inset',
                            getCellColor(count)
                          )}
                          onClick={() => count > 0 && onCellClick(platform.value, cat.value)}
                        >
                          <span className={cn('text-xs font-bold', getCellTextColor(count))}>
                            {count || '-'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-700">{platformTotals[platform.value]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4">
            <span className="text-[10px] text-slate-400">密度:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-slate-50 border border-slate-200 rounded-sm" />
              <span className="text-[10px] text-slate-400">0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-sky-50 rounded-sm" />
              <span className="text-[10px] text-slate-400">1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-sky-100 rounded-sm" />
              <span className="text-[10px] text-slate-400">2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-sky-200 rounded-sm" />
              <span className="text-[10px] text-slate-400">3-4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 bg-sky-300 rounded-sm" />
              <span className="text-[10px] text-slate-400">5+</span>
            </div>
            <span className="text-[10px] text-slate-400 ml-2">点击单元格查看该分类下的创作者</span>
          </div>
        </div>
      </div>

      {/* Top Creators by Region */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">各地区高分创作者速览</h3>
        <div className="grid grid-cols-3 gap-4">
          {REGIONS.map((region) => {
            const topCreators = regionStats[region.value].creators
              .sort((a, b) => b.evaluation.fitScore - a.evaluation.fitScore)
              .slice(0, 3);
            return (
              <div key={region.value} className="space-y-2">
                {topCreators.map((creator) => {
                  const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
                  return (
                    <div
                      key={creator.id}
                      onClick={() => onCreatorClick(creator)}
                      className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3 cursor-pointer creator-card"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: platform.color + '30', color: platform.color }}
                      >
                        {creator.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{creator.name}</p>
                        <p className="text-[10px] text-slate-400">{platform.label} · {creator.followers >= 10000 ? `${(creator.followers / 10000).toFixed(0)}万粉` : `${creator.followers}粉`}</p>
                      </div>
                      <div className="text-sm font-bold text-[#00a1d6]">{creator.evaluation.fitScore}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
