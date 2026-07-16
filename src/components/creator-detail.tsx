'use client';

import { X, ExternalLink, Mail, Globe, MessageCircle, TrendingUp, TrendingDown, Minus, Star, Users, Clock, Target, Lightbulb, Send } from 'lucide-react';
import { useState } from 'react';
import type { Creator } from '@/lib/types';
import { PLATFORMS, REGIONS, CATEGORIES, OUTREACH_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CreatorDetailProps {
  creator: Creator;
  onClose: () => void;
  onStatusChange: (id: string, status: Creator['outreachStatus']) => void;
  onGenerateOutreach: (creator: Creator) => void;
}

function formatFollowers(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
}

function getAvatarColor(name: string): string {
  const colors = ['#00a1d6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CreatorDetail({ creator, onClose, onStatusChange, onGenerateOutreach }: CreatorDetailProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'contact' | 'outreach'>('overview');
  const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
  const region = REGIONS.find((r) => r.value === creator.region)!;
  const status = OUTREACH_STATUSES.find((s) => s.value === creator.outreachStatus)!;
  const TrendIcon = creator.evaluation.growthTrend === 'rising' ? TrendingUp : creator.evaluation.growthTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = creator.evaluation.growthTrend === 'rising' ? 'text-emerald-500' : creator.evaluation.growthTrend === 'declining' ? 'text-red-500' : 'text-slate-400';

  const circumference = 2 * Math.PI * 40;
  const scoreOffset = circumference - (creator.evaluation.fitScore / 10) * circumference;
  const willOffset = circumference - (creator.evaluation.cooperationWillingness / 10) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: getAvatarColor(creator.name) }}
              >
                {creator.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{creator.name}</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border" style={{ backgroundColor: platform.color + '10', color: platform.color, borderColor: platform.color + '20' }}>
                    {platform.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-slate-500">@{creator.platformHandle}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm text-slate-500">{region.flag} {region.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 mt-4 bg-slate-100 rounded-lg p-1">
            {[
              { id: 'overview' as const, label: '概览与评估', icon: Target },
              { id: 'contact' as const, label: '联系方式', icon: Mail },
              { id: 'outreach' as const, label: '外联管理', icon: Send },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all',
                    activeSection === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Score Rings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none" stroke="#00a1d6" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference}
                        strokeDashoffset={scoreOffset} className="score-ring"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{creator.evaluation.fitScore}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">入驻适配度</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {creator.evaluation.fitScore >= 8 ? '强烈推荐' : creator.evaluation.fitScore >= 6 ? '推荐入驻' : '可以考虑'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference}
                        strokeDashoffset={willOffset} className="score-ring"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-900">{creator.evaluation.cooperationWillingness}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">合作意愿预测</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {creator.evaluation.cooperationWillingness >= 8 ? '意愿很高' : creator.evaluation.cooperationWillingness >= 6 ? '意愿较高' : '需要沟通'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-4 border border-sky-100">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#00a1d6] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#00a1d6] mb-1">AI 推荐理由</p>
                    <p className="text-sm text-slate-700">{creator.evaluation.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Content Style Tags */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2">内容风格标签</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.evaluation.contentStyleTags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Audience & Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 mb-2">受众画像</p>
                  <p className="text-sm text-slate-700">{creator.evaluation.audienceProfile}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> 粉丝数</span>
                    <span className="text-sm font-semibold text-slate-900">{formatFollowers(creator.followers)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> 更新频率</span>
                    <span className="text-sm font-semibold text-slate-900">{creator.evaluation.updateFrequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs flex items-center gap-1', trendColor)}>
                      <TrendIcon className="w-3 h-3" /> 增长趋势
                    </span>
                    <span className={cn('text-sm font-semibold', trendColor)}>
                      {creator.evaluation.growthTrend === 'rising' ? '上升' : creator.evaluation.growthTrend === 'declining' ? '下降' : '稳定'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Growth Chart */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-3">粉丝增长趋势</h3>
                <div className="bg-white rounded-xl border border-slate-200 p-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={creator.growthData}>
                      <defs>
                        <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00a1d6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#00a1d6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => formatFollowers(v)} />
                      <Tooltip
                        formatter={(value: number) => [formatFollowers(value), '粉丝数']}
                        labelFormatter={(label: string) => label}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="followers" stroke="#00a1d6" strokeWidth={2} fill="url(#colorFollowers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Videos */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-3">近期内容</h3>
                <div className="space-y-2">
                  {creator.recentVideos.map((video, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-2.5">
                      <span className="text-sm text-slate-700 truncate flex-1">{video.title}</span>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-xs text-slate-400">{formatFollowers(video.views)} 播放</span>
                        <span className="text-xs text-slate-400">{video.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-2">语言</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.languages.map((lang) => (
                    <span key={lang} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">{lang}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">联系方式</h3>
              {creator.contactInfo.map((contact, i) => {
                const Icon = contact.type === 'email' ? Mail : contact.type === 'website' ? Globe : MessageCircle;
                const reliabilityLabel = contact.reliability === 'high' ? '可靠' : contact.reliability === 'medium' ? '一般' : '待验证';
                const reliabilityColor = contact.reliability === 'high' ? 'text-emerald-600 bg-emerald-50' : contact.reliability === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100';
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {contact.type === 'email' ? '商务邮箱' : contact.type === 'website' ? '个人网站' : '平台私信'}
                          </span>
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', reliabilityColor)}>
                            {reliabilityLabel}
                          </span>
                        </div>
                        <p className="text-sm text-[#00a1d6] mt-1 truncate">{contact.value}</p>
                        <p className="text-xs text-slate-400 mt-1">来源: {contact.source}</p>
                      </div>
                      {contact.type === 'email' && (
                        <a
                          href={`mailto:${contact.value}`}
                          className="px-3 py-1.5 bg-[#00a1d6] text-white text-xs rounded-lg hover:bg-[#0090c0] transition-colors flex-shrink-0"
                        >
                          发送邮件
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Multi-platform links */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">关联社交账号</h3>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.color + '15' }}>
                      <ExternalLink className="w-4 h-4" style={{ color: platform.color }} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{platform.label}</p>
                      <p className="text-xs text-slate-500">@{creator.platformHandle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'outreach' && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">外联状态</h3>
                <div className="flex gap-2">
                  {OUTREACH_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => onStatusChange(creator.id, s.value as Creator['outreachStatus'])}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                        creator.outreachStatus === s.value
                          ? 'border-current shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                      style={creator.outreachStatus === s.value ? { backgroundColor: s.color + '15', color: s.color, borderColor: s.color + '40' } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Outreach */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">AI 邀约话术</h3>
                <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-4 border border-sky-100">
                  <p className="text-sm text-slate-700 mb-4">
                    根据 <span className="font-medium text-[#00a1d6]">{creator.name}</span> 的内容风格、受众画像和平台特点，AI 将生成个性化邀约话术。
                  </p>
                  <button
                    onClick={() => onGenerateOutreach(creator)}
                    className="w-full py-2.5 bg-[#00a1d6] text-white text-sm font-medium rounded-lg hover:bg-[#0090c0] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    生成个性化邀约
                  </button>
                </div>
              </div>

              {/* Assigned to */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">负责人</h3>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00a1d6] flex items-center justify-center text-white text-sm font-bold">
                      {creator.assignedTo.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{creator.assignedTo}</p>
                      <p className="text-xs text-slate-500">入驻时间: {creator.joinedDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">内容品类</h3>
                <div className="flex flex-wrap gap-2">
                  {creator.categories.map((cat) => {
                    const catInfo = CATEGORIES.find((c) => c.value === cat);
                    return (
                      <span key={cat} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg">
                        {catInfo?.emoji} {catInfo?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
