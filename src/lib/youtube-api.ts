/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 * 使用原生 fetch，兼容 Vercel 部署环境
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyCRSa1RfVbrilpoXkNVsGAlIglluW4erI';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

async function youtubeFetch(path: string, params: Record<string, string>) {
  const url =
    YOUTUBE_API_BASE +
    path +
    '?' +
    new URLSearchParams({ key: YOUTUBE_API_KEY, ...params }).toString();

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('YouTube API error:', res.status, errorText);
    throw new Error(`YouTube API error: ${res.status}`);
  }

  return res.json();
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
  const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCRSa1RfVbrilpoXkNVsGAlIglluW4erI';
  const apiKeyConfigured = !!apiKey;

  try {
    const data = await youtubeFetch('/search', {
      part: 'snippet',
      type: 'channel',
      q: 'test',
      maxResults: '1',
    });

    return {
      available: true,
      apiKeyConfigured,
    };
  } catch (err: any) {
    return {
      available: false,
      apiKeyConfigured,
      error: err.message || 'Unknown error',
    };
  }
}
