'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, Loader2, CheckCircle2, AlertCircle, Database, Zap, Globe, Wifi, WifiOff, Mail, ExternalLink, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORMS, CATEGORIES, REGIONS } from '@/lib/constants';

interface ScrapePanelProps {
  onScrapeComplete: () => void;
}

interface ScrapeTask {
  id: string;
  platform: string;
  category: string;
  region: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  scraped: number;
  target: number;
  error?: string;
  sources?: { youtube_api: number; web_search: number };
  creators?: Array<{
    name: string;
    platform_handle: string;
    followers: number;
    contact_info?: Array<{ type: string; value: string; reliability: string; source: string }>;
    platform_url?: string;
  }>;
}

interface DataStatus {
  youtube: { available: boolean; apiKeyConfigured: boolean; error?: string };
  webSearch: { available: boolean };
}

export function ScrapePanel({ onScrapeComplete }: ScrapePanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['anime']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['taiwan', 'hong_kong']);
  const [targetPerQuery, setTargetPerQuery] = useState(100);
  const [batchMode, setBatchMode] = useState(false); // 批量模式
  const [estimatedCount, setEstimatedCount] = useState(0); // 预估数量
  const [tasks, setTasks] = useState<ScrapeTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalScraped, setTotalScraped] = useState(0);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [ytMapping, setYtMapping] = useState(false);
  const [ytResults, setYtResults] = useState<{
    total: number;
    stored: number;
    creators: Array<{ name: string; handle: string; subscribers: number; contacts: string[] }>;
  } | null>(null);

  // Check data source status on mount
  useEffect(() => {
    fetch('/api/data-status')
      .then(res => res.json())
      .then(result => {
        if (result.success) setDataStatus(result.data);
      })
      .catch(() => {});
  }, []);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const toggleCategory = (c: string) => {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const toggleRegion = (r: string) => {
    setSelectedRegions(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const startYoutubeMapping = async () => {
    if (selectedCategories.length === 0 || selectedRegions.length === 0) {
      alert('请先选择品类和地区');
      return;
    }
    setYtMapping(true);
    setYtResults(null);

    let totalStored = 0;
    let totalFound = 0;
    const allCreators: Array<{ name: string; handle: string; subscribers: number; contacts: string[] }> = [];

    for (const region of selectedRegions) {
      for (const category of selectedCategories) {
        try {
          const res = await fetch('/api/youtube-mapper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, region, maxResults: 15 }),
          });
          const data = await res.json();
          if (data.success) {
            totalStored += data.data.stored;
            totalFound += data.data.total;
            allCreators.push(...data.data.creators);
          } else {
            console.error(`YouTube mapping API error for ${category}/${region}:`, data.error);
            alert(`YouTube Mapping 失败：${data.error || '未知错误'}`);
          }
        } catch (err) {
          console.error(`YouTube mapping failed for ${category}/${region}:`, err);
          alert(`YouTube Mapping 请求失败：${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    setYtResults({ total: totalFound, stored: totalStored, creators: allCreators });
    setYtMapping(false);
    if (totalStored > 0) {
      onScrapeComplete?.();
    }
  };

  const startScraping = useCallback(async () => {
    setIsRunning(true);
    setTotalScraped(0);

    const newTasks: ScrapeTask[] = [];
    const combinations: Array<{ platform: string; category: string; region: string }> = [];

    for (const platform of selectedPlatforms) {
      for (const category of selectedCategories) {
        for (const region of selectedRegions) {
          combinations.push({ platform, category, region });
        }
      }
    }

    const limitedCombinations = combinations.slice(0, 6);

    for (const combo of limitedCombinations) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newTasks.push({
        id: taskId,
        platform: combo.platform,
        category: combo.category,
        region: combo.region,
        status: 'pending',
        scraped: 0,
        target: targetPerQuery,
      });
    }

    setTasks(newTasks);

    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i];
      setTasks(prev => prev.map((t, idx) =>
        idx === i ? { ...t, status: 'running' } : t
      ));

      try {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: task.platform,
            category: task.category,
            region: task.region,
            targetCount: task.target,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setTasks(prev => prev.map((t, idx) =>
            idx === i ? {
              ...t,
              status: 'completed',
              scraped: result.data.total,
              sources: result.data.sources,
              creators: result.data.creators || [],
            } : t
          ));
          setTotalScraped(prev => prev + result.data.total);
        } else {
          setTasks(prev => prev.map((t, idx) =>
            idx === i ? { ...t, status: 'error', error: result.error } : t
          ));
        }
      } catch (err) {
        setTasks(prev => prev.map((t, idx) =>
          idx === i ? { ...t, status: 'error', error: err instanceof Error ? err.message : '请求失败' } : t
        ));
      }
    }

    setIsRunning(false);
    onScrapeComplete();
  }, [selectedPlatforms, selectedCategories, selectedRegions, targetPerQuery, onScrapeComplete]);

  const getPlatformLabel = (p: string) => PLATFORMS.find(x => x.value === p)?.label || p;
  const getCategoryLabel = (c: string) => CATEGORIES.find(x => x.value === c)?.label || c;
  const getRegionLabel = (r: string) => REGIONS.find(x => x.value === r)?.label || r;

  const taskCount = Math.min(selectedPlatforms.length * selectedCategories.length * selectedRegions.length, 6);
  
  // 批量模式下，每组任务生成 5 个搜索关键词，每个关键词搜索 30 个结果
  const estimatedPerTask = batchMode ? 5 * 100 : targetPerQuery;
  const estimatedTotal = taskCount * estimatedPerTask;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00a1d6]" />
            全网创作者 Mapping 引擎
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            YouTube API + Web Search + AI 分析，发现港澳台创作者并入库用于后续评估和外联
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalScraped > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
              <Database className="w-4 h-4" />
              已入库 {totalScraped} 位创作者
            </div>
          )}
        </div>
      </div>

      {/* Data Source Status */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-500 font-medium">数据源状态：</span>
          {/* YouTube API */}
          <div className="flex items-center gap-1.5">
            {dataStatus?.youtube.available ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-700 font-medium">YouTube API 已连接</span>
              </>
            ) : dataStatus?.youtube.apiKeyConfigured ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-700 font-medium">YouTube API 不可达</span>
                <span className="text-xs text-slate-400">(网络不可达，已自动使用 Web Search)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-700 font-medium">YouTube API 未配置</span>
              </>
            )}
          </div>
          {/* Web Search */}
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-700 font-medium">Web Search 可用</span>
          </div>
        </div>
      </div>

      {/* YouTube Direct Mapping - Integrated with main flow */}
      <div className="bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100 p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-600" />
            YouTube 直接 Mapping
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            使用上方选择的平台、品类、地区，直接调用 YouTube API 搜索创作者
          </p>
        </div>

        {ytMapping && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在调用 YouTube API，请稍候...</span>
          </div>
        )}

        {ytResults && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-600">
                找到 <span className="font-semibold text-slate-800">{ytResults.total}</span> 位创作者
              </span>
              <span className="text-slate-600">
                入库 <span className="font-semibold text-emerald-600">{ytResults.stored}</span> 位
              </span>
              <span className="text-slate-500">
                跳过 {ytResults.total - ytResults.stored} 位（已存在或无联系方式）
              </span>
            </div>

            {ytResults.creators.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {ytResults.creators.map((c, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.handle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">
                          {c.subscribers >= 1000000 ? `${(c.subscribers / 1000000).toFixed(1)}M` :
                           c.subscribers >= 1000 ? `${(c.subscribers / 1000).toFixed(1)}K` : c.subscribers}
                        </div>
                        <div className="text-xs text-emerald-600">
                          {c.contacts.length > 0 ? c.contacts[0] : '无联系方式'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ytResults.stored > 0 && (
              <div className="text-xs text-emerald-600 font-medium">
                ✓ 数据已入库，可在「发现」页面查看和使用
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-red-100">
          <p className="text-xs text-slate-500 mb-2">
             提示：使用上方选择的品类（{selectedCategories.length} 个）和地区（{selectedRegions.length} 个），点击「开始 Mapping」即可
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">目标平台</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                onClick={() => togglePlatform(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  selectedPlatforms.includes(p.value)
                    ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {p.label}
                {p.value === 'youtube' && dataStatus?.youtube.available && (
                  <span className="ml-1 text-xs opacity-75">API</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">目标品类</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => toggleCategory(c.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  selectedCategories.includes(c.value)
                    ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region Selection */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">目标地区</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => toggleRegion(r.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  selectedRegions.includes(r.value)
                    ? 'bg-[#00a1d6] text-white border-[#00a1d6]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {r.flag} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Count */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">每组抓取数量</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="200"
              value={targetPerQuery}
              onChange={e => setTargetPerQuery(Number(e.target.value))}
              className="w-32 accent-[#00a1d6]"
            />
            <span className="text-sm font-medium text-slate-600 w-8">{targetPerQuery}</span>
          </div>
          {batchMode && (
            <span className="text-xs text-emerald-600 font-medium">
              批量模式：每组 ~{5 * 100} 个关键词结果
            </span>
          )}
          <span className="text-xs text-slate-400">
            (共 {taskCount} 组任务{batchMode ? `，预计 ${estimatedTotal}+ 位创作者` : ''})
          </span>
        </div>

        {/* Batch Mode Toggle */}
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
              disabled={isRunning}
            />
            <span className="text-sm font-medium text-slate-700">批量模式</span>
          </label>
          <span className="text-xs text-slate-500">
            {batchMode ? '每组生成 5 个搜索关键词，每个关键词搜索 100 个结果（适合大规模 Mapping）' : '每组使用 1 个搜索关键词'}
          </span>
        </div>

        {/* Start Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={startScraping}
            disabled={isRunning || selectedPlatforms.length === 0 || selectedCategories.length === 0 || selectedRegions.length === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
              isRunning
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#00a1d6] text-white hover:bg-[#0090c0] shadow-sm'
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                抓取中...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                开始 Mapping
              </>
            )}
          </button>
          {isRunning && (
            <span className="text-sm text-slate-500">
              正在执行第 {tasks.findIndex(t => t.status === 'running') + 1}/{tasks.length} 组任务...
            </span>
          )}
          {!isRunning && totalScraped > 0 && (
            <span className="text-sm text-emerald-600 font-medium">
              抓取完成！数据已入库，可在「发现」页面查看和使用
            </span>
          )}
        </div>
      </div>

      {/* Task Progress */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Mapping 任务进度</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                完成 {tasks.filter(t => t.status === 'completed').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                进行中 {tasks.filter(t => t.status === 'running').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                失败 {tasks.filter(t => t.status === 'error').length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.map((task, i) => (
              <div key={task.id} className="px-5 py-4 flex items-start gap-4">
                <div className="w-6 h-6 flex items-center justify-center mt-0.5">
                  {task.status === 'pending' && <span className="text-xs text-slate-400 font-mono">{i + 1}</span>}
                  {task.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {task.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">{getPlatformLabel(task.platform)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-600">{getCategoryLabel(task.category)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-600">{getRegionLabel(task.region)}</span>
                    {task.sources && (
                      <span className="text-xs text-slate-400 ml-2">
                        (API: {task.sources.youtube_api}, Web: {task.sources.web_search})
                      </span>
                    )}
                  </div>
                  {task.error && (
                    <p className="text-xs text-red-500 mt-0.5">{task.error}</p>
                  )}
                  {task.status === 'completed' && task.creators && task.creators.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {task.creators.slice(0, 10).map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-slate-700 min-w-[80px]">{c.name}</span>
                          <span className="text-slate-400">{c.platform_handle}</span>
                          {c.contact_info && c.contact_info.length > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <Mail className="w-3 h-3" />
                              {c.contact_info[0].value}
                            </span>
                          )}
                          {c.platform_url && (
                            <a
                              href={c.platform_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00a1d6] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                      {task.creators.length > 10 && (
                        <span className="text-xs text-slate-400">...还有 {task.creators.length - 10} 位</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500 shrink-0">
                  {task.status === 'completed' && (
                    <span className="text-emerald-600 font-medium">+{task.scraped} 入库</span>
                  )}
                  {task.status === 'running' && (
                    <span className="text-blue-600">抓取中...</span>
                  )}
                  {task.status === 'pending' && (
                    <span>等待中</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Mapping 流程说明</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: '1', title: 'API 搜索', desc: 'YouTube API 按品类+地区搜索频道，获取订阅数等详情' },
            { step: '2', title: 'Web 补充', desc: 'Web Search 搜索其他平台创作者，AI 提取结构化数据' },
            { step: '3', title: '去重入库', desc: '按平台账号去重，只保留有联系方式的创作者' },
            { step: '4', title: '使用数据', desc: '入库后可在发现页查看、AI 评估、生成外联话术' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#00a1d6]/10 text-[#00a1d6] text-sm font-bold flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <p className="text-sm font-medium text-slate-700">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
