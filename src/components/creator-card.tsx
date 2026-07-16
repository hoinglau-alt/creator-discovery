'use client';

import { MapPin, Users, TrendingUp, TrendingDown, Minus, ExternalLink, Star } from 'lucide-react';
import type { Creator } from '@/lib/types';
import { PLATFORMS, REGIONS, CATEGORIES, OUTREACH_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CreatorCardProps {
  creator: Creator;
  onClick: (creator: Creator) => void;
  index: number;
  onGenerateOutreach?: (creator: Creator) => void;
}

function formatFollowers(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
}

function getPlatformInfo(platform: string) {
  return PLATFORMS.find((p) => p.value === platform) || PLATFORMS[0];
}

function getRegionInfo(region: string) {
  return REGIONS.find((r) => r.value === region) || REGIONS[0];
}

function getStatusInfo(status: string) {
  return OUTREACH_STATUSES.find((s) => s.value === status) || OUTREACH_STATUSES[0];
}

function getAvatarColor(name: string): string {
  const colors = ['#00a1d6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CreatorCard({ creator, onClick, index, onGenerateOutreach }: CreatorCardProps) {
  const platform = getPlatformInfo(creator.platform);
  const region = getRegionInfo(creator.region);
  const status = getStatusInfo(creator.outreachStatus);
  const trendIcon = creator.evaluation.growthTrend === 'rising' ? TrendingUp : creator.evaluation.growthTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = creator.evaluation.growthTrend === 'rising' ? 'text-emerald-500' : creator.evaluation.growthTrend === 'declining' ? 'text-red-500' : 'text-slate-400';
  const TrendIcon = trendIcon;

  const scoreColor = creator.evaluation.fitScore >= 8 ? 'text-emerald-500' : creator.evaluation.fitScore >= 6 ? 'text-[#00a1d6]' : creator.evaluation.fitScore >= 4 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = creator.evaluation.fitScore >= 8 ? 'bg-emerald-50 border-emerald-200' : creator.evaluation.fitScore >= 6 ? 'bg-sky-50 border-sky-200' : creator.evaluation.fitScore >= 4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div
      onClick={() => onClick(creator)}
      className="creator-card bg-white rounded-xl border border-slate-200 p-4 cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: getAvatarColor(creator.name) }}
        >
          {creator.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">{creator.name}</h3>
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: platform.color + '15' }}
            >
              <ExternalLink className="w-3 h-3" style={{ color: platform.color }} />
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">@{creator.platformHandle}</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-500">{region.flag} {region.label}</span>
          </div>
        </div>
        {/* Score */}
        <div className={cn('flex flex-col items-center px-2.5 py-1.5 rounded-lg border', scoreBg)}>
          <span className={cn('text-lg font-bold leading-none', scoreColor)}>{creator.evaluation.fitScore}</span>
          <span className="text-[9px] text-slate-400 mt-0.5">适配度</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mt-3">
        {creator.categories.map((cat) => {
          const catInfo = CATEGORIES.find((c) => c.value === cat);
          return (
            <span key={cat} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] rounded-md border border-slate-100">
              {catInfo?.emoji} {catInfo?.label}
            </span>
          );
        })}
        <span className="px-2 py-0.5 text-[10px] rounded-md border" style={{ backgroundColor: platform.color + '08', color: platform.color, borderColor: platform.color + '20' }}>
          {platform.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">{formatFollowers(creator.followers)}</span>
        </div>
        <div className={cn('flex items-center gap-1', trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs">{creator.evaluation.growthTrend === 'rising' ? '上升' : creator.evaluation.growthTrend === 'declining' ? '下降' : '稳定'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">{creator.evaluation.updateFrequency}</span>
        </div>
        <div className="ml-auto">
          <span
            className="status-badge"
            style={{ backgroundColor: status.color + '15', color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
