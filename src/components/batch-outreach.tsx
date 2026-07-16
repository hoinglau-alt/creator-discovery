'use client';

import { useState, useCallback } from 'react';
import type { Creator } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, X, Sparkles, Copy, Mail, MessageSquare, ChevronDown, ChevronUp, Loader2, CheckCircle2, Send, AlertCircle } from 'lucide-react';

interface BatchOutreachProps {
  selectedCreators: Creator[];
  onClearSelection: () => void;
  onRemoveCreator: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'contacted' | 'replied' | 'negotiating' | 'onboarded') => void;
}

interface GeneratedMessage {
  creatorId: string;
  email: string;
  dm: string;
}

interface EmailSendStatus {
  creatorId: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
}

export default function BatchOutreach({
  selectedCreators,
  onClearSelection,
  onRemoveCreator,
  onStatusChange,
}: BatchOutreachProps) {
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [format, setFormat] = useState<'email' | 'dm'>('email');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // Email sending state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    senderName: 'B站港澳台运营团队',
    senderEmail: 'creator@bilibili.com',
    ccEmail: '',
  });
  const [emailSendStatuses, setEmailSendStatuses] = useState<EmailSendStatus[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);

  const handleBatchGenerate = useCallback(async () => {
    setGenerating(true);
    const results: GeneratedMessage[] = [];

    for (const creator of selectedCreators) {
      try {
        const response = await fetch('/api/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: creator.id, format: 'email' }),
        });
        const data = await response.json();
        const dmResponse = await fetch('/api/outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: creator.id, format: 'dm' }),
        });
        const dmData = await dmResponse.json();
        results.push({
          creatorId: creator.id,
          email: data.message || '生成失败，请重试',
          dm: dmData.message || '生成失败，请重试',
        });
      } catch {
        results.push({
          creatorId: creator.id,
          email: '网络错误，请重试',
          dm: '网络错误，请重试',
        });
      }
    }

    setMessages(results);
    setGenerating(false);
    setGenerated(true);
  }, [selectedCreators]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBatchMarkContacted = () => {
    for (const c of selectedCreators) {
      if (c.outreachStatus === 'pending') {
        onStatusChange(c.id, 'contacted');
      }
    }
  };

  // Email sending function
  const handleSendEmails = useCallback(async () => {
    setSendingEmails(true);
    const statuses: EmailSendStatus[] = [];

    for (const creator of selectedCreators) {
      const email = creator.contactInfo.find((ci) => ci.type === 'email');
      if (!email) {
        statuses.push({
          creatorId: creator.id,
          status: 'failed',
          error: '无邮箱地址',
        });
        continue;
      }

      statuses.push({ creatorId: creator.id, status: 'sending' });
      setEmailSendStatuses([...statuses]);

      // Simulate email sending (in production, this would call an email API)
      try {
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));
        statuses[statuses.length - 1] = { creatorId: creator.id, status: 'sent' };
        setEmailSendStatuses([...statuses]);
        // Mark as contacted
        onStatusChange(creator.id, 'contacted');
      } catch {
        statuses[statuses.length - 1] = {
          creatorId: creator.id,
          status: 'failed',
          error: '发送失败',
        };
        setEmailSendStatuses([...statuses]);
      }
    }

    setSendingEmails(false);
  }, [selectedCreators, onStatusChange]);

  const getEmailStatus = (creatorId: string) => {
    return emailSendStatuses.find((s) => s.creatorId === creatorId);
  };

  const creatorsWithEmail = selectedCreators.filter((c) =>
    c.contactInfo.some((ci) => ci.type === 'email')
  );

  return (
    <div className="space-y-4">
      {/* Selection Bar */}
      <div className="bg-[#00a1d6]/5 border border-[#00a1d6]/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#00a1d6]" />
            <span className="text-sm font-semibold text-slate-900">
              已选择 <span className="text-[#00a1d6]">{selectedCreators.length}</span> 位创作者
            </span>
            {creatorsWithEmail.length < selectedCreators.length && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {selectedCreators.length - creatorsWithEmail.length} 位无邮箱
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchMarkContacted}
              disabled={generating || !generated}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              批量标记已联系
            </button>
            <button
              onClick={onClearSelection}
              className="text-xs px-3 py-1.5 bg-white text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              清空选择
            </button>
          </div>
        </div>

        {/* Selected creators chips */}
        <div className="flex flex-wrap gap-2">
          {selectedCreators.map((creator) => {
            const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
            const hasEmail = creator.contactInfo.some((ci) => ci.type === 'email');
            return (
              <div
                key={creator.id}
                className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="text-slate-700 font-medium">{creator.name}</span>
                {hasEmail && <Mail className="w-3 h-3 text-emerald-500" />}
                <button onClick={() => onRemoveCreator(creator.id)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={handleBatchGenerate}
          disabled={generating || selectedCreators.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00a1d6] text-white rounded-xl hover:bg-[#0090be] transition-all disabled:opacity-50 font-medium text-sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              正在批量生成话术...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              批量生成 {selectedCreators.length} 位创作者的邀约话术
            </>
          )}
        </button>
        {generated && creatorsWithEmail.length > 0 && (
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            通过邮件发送 ({creatorsWithEmail.length})
          </button>
        )}
      </div>

      {/* Generated Messages */}
      {generated && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900">已生成 {messages.length} 条话术</span>
            </div>
            <button
              onClick={() => { setGenerated(false); setMessages([]); }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              重新生成
            </button>
          </div>

          {messages.map((msg) => {
            const creator = selectedCreators.find((c) => c.id === msg.creatorId);
            if (!creator) return null;
            const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
            const isExpanded = expandedId === creator.id;
            const content = format === 'email' ? msg.email : msg.dm;
            const emailStatus = getEmailStatus(creator.id);

            return (
              <div key={creator.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : creator.id)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: platform.color + '20', color: platform.color }}
                  >
                    {creator.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{creator.name}</p>
                      {emailStatus && (
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded',
                          emailStatus.status === 'sent' && 'bg-emerald-50 text-emerald-600',
                          emailStatus.status === 'sending' && 'bg-blue-50 text-blue-600',
                          emailStatus.status === 'failed' && 'bg-red-50 text-red-600',
                        )}>
                          {emailStatus.status === 'sent' ? '已发送' :
                           emailStatus.status === 'sending' ? '发送中...' :
                           emailStatus.status === 'failed' ? emailStatus.error : '待发送'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">{platform.label} · {creator.categories.map((c) => c).join('/')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFormat('email'); }}
                        className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all', format === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                      >
                        <Mail className="w-3 h-3" /> 邮件
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFormat('dm'); }}
                        className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all', format === 'dm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                      >
                        <MessageSquare className="w-3 h-3" /> 私信
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(content, creator.id); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="复制"
                    >
                      {copiedId === creator.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-lg p-3">
                      {content}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Email Send Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">批量邮件发送</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Email Config */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">发件人名称</label>
                  <input
                    type="text"
                    value={emailConfig.senderName}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/20 focus:border-[#00a1d6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">发件人邮箱</label>
                  <input
                    type="email"
                    value={emailConfig.senderEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/20 focus:border-[#00a1d6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">抄送邮箱（可选）</label>
                  <input
                    type="email"
                    value={emailConfig.ccEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, ccEmail: e.target.value })}
                    placeholder="cc@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/20 focus:border-[#00a1d6]"
                  />
                </div>
              </div>

              {/* Recipients Preview */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 mb-2">收件人列表 ({creatorsWithEmail.length})</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {creatorsWithEmail.map((creator) => {
                    const email = creator.contactInfo.find((ci) => ci.type === 'email')?.value;
                    const status = getEmailStatus(creator.id);
                    return (
                      <div key={creator.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{creator.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{email}</span>
                          {status?.status === 'sent' && <Check className="w-3 h-3 text-emerald-500" />}
                          {status?.status === 'sending' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                          {status?.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  将为每位创作者发送个性化邀约邮件。发送后状态将自动更新为「已联系」。
                  {selectedCreators.length - creatorsWithEmail.length > 0 && (
                    <span className="block mt-1">
                      注意：{selectedCreators.length - creatorsWithEmail.length} 位创作者无邮箱地址，将被跳过。
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmails}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSendEmails}
                disabled={sendingEmails}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {sendingEmails ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    确认发送
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
