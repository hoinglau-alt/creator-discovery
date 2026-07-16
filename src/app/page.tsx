'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import FilterPanel from '@/components/filter-panel';
import CreatorCard from '@/components/creator-card';
import CreatorDetail from '@/components/creator-detail';
import OutreachGenerator from '@/components/outreach-generator';
import DataTable from '@/components/data-table';
import MappingView from '@/components/mapping-view';
import BatchOutreach from '@/components/batch-outreach';
import { ScrapePanel } from '@/components/scrape-panel';
import { mockCreators } from '@/lib/mock-data';
import type { Creator, FilterState, OutreachStatus, Platform, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutGrid, Table, BarChart3, TrendingUp, Users, Target, Mail, Map, Sparkles, Search, ArrowRight, CheckSquare, Square, Check, Download, Send, Database, Globe } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [outreachCreator, setOutreachCreator] = useState<Creator | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'mapping' | 'scrape'>('mapping');
  const [creators, setCreators] = useState<Creator[]>(mockCreators);
  const [dataSource, setDataSource] = useState<'mock' | 'database'>('mock');
  const [dbCreatorCount, setDbCreatorCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    categories: [],
    regions: [],
    followerTiers: [],
    contentType: 'all',
    searchQuery: '',
    outreachStatus: [],
  });

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      if (filters.platforms.length > 0 && !filters.platforms.includes(c.platform)) return false;
      if (filters.categories.length > 0 && !c.categories.some((cat) => filters.categories.includes(cat))) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(c.region)) return false;
      if (filters.followerTiers.length > 0 && !filters.followerTiers.includes(c.followerTier)) return false;
      if (filters.contentType !== 'all' && c.contentType !== filters.contentType && c.contentType !== 'both') return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.platformHandle.toLowerCase().includes(q) ||
          c.evaluation.contentStyleTags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [creators, filters]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const handleStatusChange = (id: string, status: OutreachStatus) => {
    setCreators((prev) => prev.map((c) => c.id === id ? { ...c, outreachStatus: status } : c));
    if (selectedCreator?.id === id) {
      setSelectedCreator((prev) => prev ? { ...prev, outreachStatus: status } : null);
    }
  };

  const handleGenerateOutreach = (creator: Creator) => {
    setOutreachCreator(creator);
  };

  // Load creators from database
  const loadFromDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/creators?source=db');
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setCreators(result.data);
        setDataSource('database');
        setDbCreatorCount(result.data.length);
      }
    } catch {
      // Fall back to mock data
    }
  }, []);

  // Check database on mount
  const checkDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/creators?source=db');
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setCreators(result.data);
        setDataSource('database');
        setDbCreatorCount(result.data.length);
      }
    } catch {
      // Use mock data
    }
  }, []);

  // Handle scrape complete - reload from database
  const handleScrapeComplete = useCallback(async () => {
    await loadFromDatabase();
  }, [loadFromDatabase]);

  // Switch to database view
  const switchToDatabase = useCallback(() => {
    if (dataSource === 'database') return;
    loadFromDatabase();
  }, [dataSource, loadFromDatabase]);

  // Switch back to mock data
  const switchToMockData = useCallback(() => {
    setCreators(mockCreators);
    setDataSource('mock');
  }, []);

  // Batch selection
  const toggleBatchSelect = useCallback((id: string) => {
    setSelectedForBatch((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedForBatch((prev) => {
      const next = new Set(prev);
      for (const c of filteredCreators) {
        next.add(c.id);
      }
      return next;
    });
  }, [filteredCreators]);

  const clearBatchSelection = useCallback(() => {
    setSelectedForBatch(new Set());
  }, []);

  const removeBatchCreator = useCallback((id: string) => {
    setSelectedForBatch((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectedBatchCreators = useMemo(() => {
    return creators.filter((c) => selectedForBatch.has(c.id));
  }, [creators, selectedForBatch]);

  // Mapping cell click
  const handleMappingCellClick = useCallback((platform: Platform, category: Category) => {
    setFilters((prev) => ({
      ...prev,
      platforms: [platform],
      categories: [category],
    }));
    setViewMode('grid');
    setShowFilters(true);
  }, []);

  // Check database on mount
  useEffect(() => {
    checkDatabase();
  }, [checkDatabase]);

  // Stats
  const stats = useMemo(() => ({
    total: creators.length,
    withContact: creators.filter((c) => c.contactInfo && c.contactInfo.length > 0).length,
    avgScore: creators.length > 0 ? (creators.reduce((sum, c) => sum + c.evaluation.fitScore, 0) / creators.length).toFixed(1) : '0.0',
    contacted: creators.filter((c) => c.outreachStatus !== 'pending').length,
    onboarded: creators.filter((c) => c.outreachStatus === 'onboarded').length,
  }), [creators]);

  const tabConfig: Record<string, { title: string; subtitle: string }> = {
    discovery: { title: '创作者发现', subtitle: '搜索、筛选、映射港澳台优质创作者' },
    evaluation: { title: 'AI评估分析', subtitle: '查看创作者详细评估与数据' },
    outreach: { title: 'AI外联助手', subtitle: '批量生成个性化邀约并跟踪状态' },
    management: { title: '数据管理', subtitle: '管理创作者数据库与导出' },
  };

  const hasActiveFilters = filters.platforms.length > 0 || filters.categories.length > 0 || filters.regions.length > 0 || filters.followerTiers.length > 0 || filters.contentType !== 'all';

  // Export function
  const handleExport = async (format: 'csv' | 'excel') => {
    const dataToExport = selectedForBatch.size > 0
      ? creators.filter((c) => selectedForBatch.has(c.id))
      : filteredCreators;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creators: dataToExport, format }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creators_export_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]')}>
        <Header
          title={tabConfig[activeTab].title}
          subtitle={tabConfig[activeTab].subtitle}
          searchValue={filters.searchQuery}
          onSearchChange={handleSearchChange}
        />

        <main className="p-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '收录创作者', value: stats.total, sub: `${stats.withContact} 位有联系方式`, icon: Users, color: '#00a1d6', bg: '#e0f7ff' },
              { label: '平均适配度', value: stats.avgScore, icon: Target, color: '#10b981', bg: '#d1fae5' },
              { label: '已联系', value: stats.contacted, icon: Mail, color: '#f59e0b', bg: '#fef3c7' },
              { label: '已入驻', value: stats.onboarded, icon: TrendingUp, color: '#8b5cf6', bg: '#ede9fe' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    {stat.sub && <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Source Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                dataSource === 'database'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              )}>
                <Database className="w-3 h-3" />
                {dataSource === 'database' ? `数据库 (${dbCreatorCount} 位)` : '演示数据'}
              </div>
              {dataSource === 'database' && (
                <button
                  onClick={switchToMockData}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  切换演示数据
                </button>
              )}
              {dataSource === 'mock' && dbCreatorCount > 0 && (
                <button
                  onClick={switchToDatabase}
                  className="text-xs text-[#00a1d6] hover:underline"
                >
                  使用数据库数据 ({dbCreatorCount} 位)
                </button>
              )}
            </div>
          </div>

          {/* ==================== DISCOVERY TAB ==================== */}
          {activeTab === 'discovery' && (
            <div className="space-y-4">
              {/* Search-first Hero */}
              {!hasActiveFilters && !filters.searchQuery && viewMode === 'mapping' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
                  <div className="w-16 h-16 bg-[#00a1d6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#00a1d6]" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">发现港澳台优质创作者</h2>
                  <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                    在下方搜索框输入关键词，或通过 Mapping 视图浏览平台×品类矩阵，快速定位目标创作者
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      高级筛选
                    </button>
                    <button
                      onClick={selectAllFiltered}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00a1d6] text-white rounded-lg hover:bg-[#0090be] transition-colors text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      批量选择
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Panel (collapsible) */}
              <div className={cn('transition-all', showFilters || hasActiveFilters ? 'block' : 'hidden')}>
                <FilterPanel filters={filters} onFilterChange={setFilters} resultCount={filteredCreators.length} />
              </div>

              {/* View toggle + batch bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      共 <span className="font-bold text-slate-700">{filteredCreators.length}</span> 位创作者
                    </span>
                  </div>
                  {selectedForBatch.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#00a1d6]/10 rounded-lg">
                      <CheckSquare className="w-3.5 h-3.5 text-[#00a1d6]" />
                      <span className="text-xs font-medium text-[#00a1d6]">已选 {selectedForBatch.size} 位</span>
                      <button
                        onClick={() => setActiveTab('outreach')}
                        className="text-xs px-2 py-0.5 bg-[#00a1d6] text-white rounded-md hover:bg-[#0090be] transition-colors"
                      >
                        去批量外联
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Batch select all */}
                  <button
                    onClick={selectedForBatch.size === filteredCreators.length ? clearBatchSelection : selectAllFiltered}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors"
                  >
                    {selectedForBatch.size === filteredCreators.length ? <CheckSquare className="w-3.5 h-3.5 text-[#00a1d6]" /> : <Square className="w-3.5 h-3.5" />}
                    全选
                  </button>
                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    <button
                      onClick={() => setViewMode('mapping')}
                      className={cn('p-1.5 rounded-md transition-all', viewMode === 'mapping' ? 'bg-[#00a1d6] text-white' : 'text-slate-400 hover:text-slate-600')}
                      title="Mapping视图"
                    >
                      <Map className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-[#00a1d6] text-white' : 'text-slate-400 hover:text-slate-600')}
                      title="卡片视图"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn('p-1.5 rounded-md transition-all', viewMode === 'table' ? 'bg-[#00a1d6] text-white' : 'text-slate-400 hover:text-slate-600')}
                      title="表格视图"
                    >
                      <Table className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('scrape')}
                      className={cn('p-1.5 rounded-md transition-all', viewMode === 'scrape' ? 'bg-[#00a1d6] text-white' : 'text-slate-400 hover:text-slate-600')}
                      title="全网抓取"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Export button */}
                  <div className="relative group">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      导出
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 first:rounded-t-lg"
                      >
                        导出 CSV
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 last:rounded-b-lg"
                      >
                        导出 Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapping View */}
              {viewMode === 'mapping' && (
                <MappingView
                  creators={filteredCreators}
                  onCreatorClick={setSelectedCreator}
                  onCellClick={handleMappingCellClick}
                />
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCreators.map((creator, i) => (
                    <div key={creator.id} className="relative">
                      {/* Batch checkbox */}
                      <div className="absolute top-3 left-3 z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBatchSelect(creator.id); }}
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                            selectedForBatch.has(creator.id)
                              ? 'bg-[#00a1d6] border-[#00a1d6]'
                              : 'bg-white/80 border-slate-300 hover:border-[#00a1d6] backdrop-blur-sm'
                          )}
                        >
                          {selectedForBatch.has(creator.id) && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </div>
                      <CreatorCard creator={creator} onClick={setSelectedCreator} index={i} />
                    </div>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <DataTable creators={filteredCreators} onCreatorClick={setSelectedCreator} />
              )}

              {/* Scrape Panel */}
              {viewMode === 'scrape' && (
                <ScrapePanel onScrapeComplete={handleScrapeComplete} />
              )}

              {/* Empty state */}
              {filteredCreators.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500 mt-4">没有找到匹配的创作者</p>
                  <p className="text-xs text-slate-400 mt-1">尝试调整筛选条件</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== EVALUATION TAB ==================== */}
          {activeTab === 'evaluation' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">AI 评估维度说明</h3>
                <p className="text-xs text-slate-500 mb-4">每位创作者都会经过以下维度的AI评估分析</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: '入驻适配度', desc: '基于内容风格、受众画像、平台调性综合评分', color: '#00a1d6' },
                    { title: '合作意愿预测', desc: '根据创作者活跃度、商业化程度预测合作可能性', color: '#10b981' },
                    { title: '增长趋势分析', desc: '基于历史数据判断粉丝增长态势', color: '#f59e0b' },
                  ].map((item) => (
                    <div key={item.title} className="bg-slate-50 rounded-lg p-4">
                      <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                      <h4 className="text-sm font-medium text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score distribution */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">适配度分布</h3>
                <div className="flex items-end gap-2 h-32">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const count = filteredCreators.filter((c) => c.evaluation.fitScore === score).length;
                    const maxCount = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => filteredCreators.filter((c) => c.evaluation.fitScore === s).length), 1);
                    const height = (count / maxCount) * 100;
                    const barColor = score >= 8 ? '#10b981' : score >= 6 ? '#00a1d6' : score >= 4 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={score} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400">{count}</span>
                        <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(height, 4)}%`, backgroundColor: barColor + '80' }} />
                        <span className="text-[10px] text-slate-500">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Creator list sorted by score */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...filteredCreators].sort((a, b) => b.evaluation.fitScore - a.evaluation.fitScore).map((creator, i) => (
                  <CreatorCard key={creator.id} creator={creator} onClick={setSelectedCreator} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ==================== OUTREACH TAB ==================== */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              {/* Status pipeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">外联进度管线</h3>
                <div className="flex items-center gap-2">
                  {[
                    { label: '待联系', value: 'pending', color: '#94A3B8' },
                    { label: '已联系', value: 'contacted', color: '#3B82F6' },
                    { label: '已回复', value: 'replied', color: '#F59E0B' },
                    { label: '谈判中', value: 'negotiating', color: '#8B5CF6' },
                    { label: '已入驻', value: 'onboarded', color: '#10B981' },
                  ].map((stage, i, arr) => {
                    const count = creators.filter((c) => c.outreachStatus === stage.value).length;
                    return (
                      <div key={stage.value} className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                          <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: stage.color }} />
                          <p className="text-lg font-bold text-slate-900">{count}</p>
                          <p className="text-[10px] text-slate-500">{stage.label}</p>
                        </div>
                        {i < arr.length - 1 && <span className="text-slate-300 text-xs">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Batch Outreach Section */}
              {selectedForBatch.size > 0 && (
                <BatchOutreach
                  selectedCreators={selectedBatchCreators}
                  onClearSelection={clearBatchSelection}
                  onRemoveCreator={removeBatchCreator}
                  onStatusChange={handleStatusChange}
                />
              )}

              {/* Individual outreach list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selectedForBatch.size > 0 ? '或选择单个创作者生成话术' : '选择创作者生成个性化邀约'}
                  </h3>
                  {selectedForBatch.size === 0 && (
                    <p className="text-xs text-slate-400">从「创作者发现」页面批量选择后，可在此批量生成</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCreators
                    .filter((c) => c.outreachStatus === 'pending' || c.outreachStatus === 'contacted')
                    .map((creator, i) => (
                      <div key={creator.id} className="relative">
                        <CreatorCard
                          creator={creator}
                          onClick={setSelectedCreator}
                          index={i}
                          onGenerateOutreach={handleGenerateOutreach}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== MANAGEMENT TAB ==================== */}
          {activeTab === 'management' && (
            <div className="space-y-4">
              <FilterPanel filters={filters} onFilterChange={setFilters} resultCount={filteredCreators.length} />
              <DataTable creators={filteredCreators} onCreatorClick={setSelectedCreator} />
            </div>
          )}
        </main>
      </div>

      {/* Creator Detail Panel */}
      {selectedCreator && (
        <CreatorDetail
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
          onStatusChange={handleStatusChange}
          onGenerateOutreach={handleGenerateOutreach}
        />
      )}

      {/* Outreach Generator Modal */}
      {outreachCreator && (
        <OutreachGenerator
          creator={outreachCreator}
          onClose={() => setOutreachCreator(null)}
        />
      )}
    </div>
  );
}
