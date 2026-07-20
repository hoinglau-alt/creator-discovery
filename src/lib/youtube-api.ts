/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 * 部署到 Vercel/Railway 等无出站限制的平台后可用
 */

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

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${res.statusText}`);
  return res.json();
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
