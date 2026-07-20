/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 * 请求策略：直接 fetch → FetchClient 平台代理 → 抛出错误
 */

import { FetchClient } from 'coze-coding-dev-sdk';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCRSa1RfVbrilpoXkNVsGAlIglluW4erI';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

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

async function youtubeFetch(path: string, params: Record<string, string>) {
  const url =
    YOUTUBE_API_BASE +
    path +
    '?' +
    new URLSearchParams({ key: YOUTUBE_API_KEY, ...params }).toString();

  // 策略 1：直接 fetch（部署环境可能已解除限制）
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return res.json();
  } catch {
    // 直接 fetch 失败，继续尝试策略 2
  }

  // 策略 2：通过 FetchClient 平台代理（托管集成，网络权限不同）
  try {
    const fetchClient = new FetchClient();
    const result = await fetchClient.fetch(url);
    if (result?.text) {
      return JSON.parse(result.text);
    }
  } catch {
    // FetchClient 也失败
  }

  throw new Error('YouTube API: 所有请求方式均失败');
}

export async function searchChannelsByRegion(
  regionCode: string,
  query: string,
  maxResults: number = 10,
): Promise<YouTubeSearchResult[]> {
  const data = await youtubeFetch('/search', {
    part: 'snippet',
    type: 'channel',
    q: query,
    regionCode,
    maxResults: String(maxResults),
    order: 'relevance',
  });

  return (data.items || []).map((item: any) => ({
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description || '',
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    channelCustomUrl: item.snippet.channelId || '',
  }));
}

export async function getChannelDetails(
  channelId: string,
): Promise<YouTubeChannel | null> {
  try {
    const data = await youtubeFetch('/channels', {
      part: 'snippet,contentDetails,statistics',
      id: channelId,
    });

    if (!data.items?.length) return null;

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl || '',
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      subscriberCount: parseInt(item.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(item.statistics?.videoCount || '0', 10),
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      country: item.snippet.country || '',
      publishedAt: item.snippet.publishedAt || '',
    };
  } catch {
    return null;
  }
}

export async function getChannelsByHandle(
  handle: string,
): Promise<YouTubeChannel | null> {
  try {
    const data = await youtubeFetch('/channels', {
      part: 'snippet,contentDetails,statistics',
      forHandle: handle.replace('@', ''),
    });

    if (!data.items?.length) return null;

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl || '',
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      subscriberCount: parseInt(item.statistics?.subscriberCount || '0', 10),
      videoCount: parseInt(item.statistics?.videoCount || '0', 10),
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
      country: item.snippet.country || '',
      publishedAt: item.snippet.publishedAt || '',
    };
  } catch {
    return null;
  }
}

export async function checkYouTubeAPIStatus(): Promise<{
  available: boolean;
  apiKeyConfigured: boolean;
  error?: string;
}> {
  if (!YOUTUBE_API_KEY) {
    return { available: false, apiKeyConfigured: false };
  }

  try {
    const data = await youtubeFetch('/search', {
      part: 'snippet',
      q: 'test',
      maxResults: '1',
      type: 'video',
    });

    if (data.items !== undefined) {
      return { available: true, apiKeyConfigured: true };
    }
    return {
      available: false,
      apiKeyConfigured: true,
      error: `API 返回异常: ${JSON.stringify(data).slice(0, 100)}`,
    };
  } catch (e: any) {
    return {
      available: false,
      apiKeyConfigured: true,
      error: e.message || '未知错误',
    };
  }
}
