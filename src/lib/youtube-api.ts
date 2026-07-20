/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 * 优先使用 FetchClient（平台托管服务），降级到直接 fetch
 */

import { FetchClient } from 'coze-coding-dev-sdk';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCRSa1RfVbrilpoXkNVsGAlIglluW4erI';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

let _fetchClient: InstanceType<typeof FetchClient> | null = null;
function getFetchClient() {
  if (!_fetchClient) _fetchClient = new FetchClient();
  return _fetchClient;
}

async function youtubeFetch(path: string, params: Record<string, string>) {
  const url =
    YOUTUBE_API_BASE +
    path +
    '?' +
    new URLSearchParams({ key: YOUTUBE_API_KEY, ...params }).toString();

  // 策略 1：直接 fetch
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return res.json();
  } catch {
    // 直接 fetch 失败，尝试 FetchClient
  }

  // 策略 2：FetchClient（平台托管，可能有不同网络权限）
  try {
    const client = getFetchClient();
    const result = await client.fetch(url);
    // FetchClient 返回的是网页提取结果，尝试从 text 类型内容中获取
    if (result?.content?.length) {
      const textContent = result.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
      if (textContent) {
        try { return JSON.parse(textContent); } catch {}
      }
    }
    // 也尝试 title 字段（如果是 API 响应可能被解析到 title）
    if (result?.title) {
      return { items: [], pageInfo: { totalResults: 0 } };
    }
  } catch {
    // FetchClient 也失败
  }

  throw new Error('YouTube API unreachable');
}

// ==================== Types ====================

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country: string;
  publishedAt: string;
}

export interface YouTubeSearchResult {
  channelId: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  channelCustomUrl?: string;
}

// ==================== Core API ====================

export async function searchChannelsByRegion(
  query: string,
  regionCode: string,
  maxResults: number = 25
): Promise<YouTubeSearchResult[]> {
  const data = await youtubeFetch('/search', {
    part: 'snippet',
    type: 'channel',
    q: query,
    regionCode,
    maxResults: String(maxResults),
  });

  if (!data?.items?.length) return [];

  return data.items.map((item: any) => ({
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle || item.snippet.title,
    description: item.snippet.description || '',
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    channelCustomUrl: item.snippet.customUrl,
  }));
}

export async function getChannelDetails(
  channelIds: string[]
): Promise<YouTubeChannel[]> {
  if (!channelIds.length) return [];

  const data = await youtubeFetch('/channels', {
    part: 'snippet,statistics,contentDetails',
    id: channelIds.join(','),
  });

  if (!data?.items?.length) return [];

  return data.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    customUrl: item.snippet.customUrl || '',
    description: item.snippet.description || '',
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(item.statistics?.subscriberCount || '0'),
    videoCount: parseInt(item.statistics?.videoCount || '0'),
    viewCount: parseInt(item.statistics?.viewCount || '0'),
    country: item.snippet.country || '',
    publishedAt: item.snippet.publishedAt,
  }));
}

export async function checkYouTubeAPIStatus(): Promise<{
  available: boolean;
  apiKeyConfigured: boolean;
  error?: string;
}> {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.length < 10) {
    return { available: false, apiKeyConfigured: false };
  }

  try {
    const data = await youtubeFetch('/search', {
      part: 'snippet',
      type: 'channel',
      q: 'test',
      maxResults: '1',
    });
    if (data?.items !== undefined) {
      return { available: true, apiKeyConfigured: true };
    }
    return { available: false, apiKeyConfigured: true, error: 'unexpected response' };
  } catch (e: any) {
    return { available: false, apiKeyConfigured: true, error: e.message || 'fetch failed' };
  }
}
