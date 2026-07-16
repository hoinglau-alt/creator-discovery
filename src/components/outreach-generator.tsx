'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import type { Creator } from '@/lib/types';
import { PLATFORMS, REGIONS } from '@/lib/constants';

interface OutreachGeneratorProps {
  creator: Creator | null;
  onClose: () => void;
}

export default function OutreachGenerator({ creator, onClose }: OutreachGeneratorProps) {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messageType, setMessageType] = useState<'email' | 'dm'>('email');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (creator) {
      generateMessage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  const generateMessage = async () => {
    if (!creator) return;
    setIsGenerating(true);
    setMessage('');

    try {
      const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
      const region = REGIONS.find((r) => r.value === creator.region)!;

      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: creator.name,
          platform: platform.label,
          region: region.label,
          categories: creator.categories,
          followers: creator.followers,
          contentStyle: creator.evaluation.contentStyleTags,
          audienceProfile: creator.evaluation.audienceProfile,
          messageType,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMessage(accumulated);
      }
    } catch {
      // Fallback template
      const platform = PLATFORMS.find((p) => p.value === creator.platform)!;
      const region = REGIONS.find((r) => r.value === creator.region)!;
      const fallback = messageType === 'email'
        ? `尊敬的${creator.name}，\n\n您好！我是B站港澳台达人运营团队的成员。\n\n我们注意到您在${platform.label}上的出色内容创作，特别是您在${creator.evaluation.contentStyleTags.join('、')}方面的精彩内容。您的粉丝群体（${creator.evaluation.audienceProfile}）与B站的核心用户高度重合。\n\nB站目前正积极拓展港澳台地区的创作者生态，我们非常诚挚地邀请您入驻B站，将您的优质内容带给更广泛的观众。\n\n入驻B站，您将获得：\n1. 平台流量扶持与推荐资源\n2. 专业的运营对接与内容策略支持\n3. 多元化的商业变现渠道\n4. 与大陆创作者的交流合作机会\n\n期待能与您进一步沟通合作细节。如有任何疑问，请随时回复此邮件。\n\n祝好！\nB站港澳台达人运营团队`
        : `Hi ${creator.name}! 我是B站港澳台达人运营团队的成员。很喜欢您在${platform.label}上的内容，特别是${creator.evaluation.contentStyleTags[0]}方向的创作！B站正在拓展港澳台创作者生态，想邀请您入驻，有兴趣聊聊吗？`;
      setMessage(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!creator) return null;

  const platform = PLATFORMS.find((p) => p.value === creator.platform)!;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">AI 邀约话术生成</h3>
            <p className="text-xs text-slate-500 mt-0.5">为 {creator.name} 生成个性化邀约</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as 'email' | 'dm')}
              className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#00a1d6]/30"
            >
              <option value="email">邮件</option>
              <option value="dm">私信</option>
            </select>
            <button
              onClick={generateMessage}
              disabled={isGenerating}
              className="h-8 px-3 bg-[#00a1d6] text-white text-xs font-medium rounded-lg hover:bg-[#0090c0] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              重新生成
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            ref={contentRef}
            className="bg-slate-50 rounded-xl p-5 min-h-[300px] max-h-[400px] overflow-y-auto"
          >
            {isGenerating && !message ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-[#00a1d6] animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 mt-3">AI 正在生成个性化邀约话术...</p>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {message}
                {isGenerating && <span className="inline-block w-0.5 h-4 bg-[#00a1d6] animate-pulse ml-0.5 align-middle" />}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>平台: {platform.label}</span>
              <span>|</span>
              <span>类型: {messageType === 'email' ? '邮件' : '私信'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="h-9 px-4 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={onClose}
                className="h-9 px-4 bg-[#00a1d6] text-white text-xs font-medium rounded-lg hover:bg-[#0090c0] transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                使用此话术
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
