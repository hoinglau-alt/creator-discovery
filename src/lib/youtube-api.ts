/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

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
  kind: string;
  channelId: string;
  channelTitle: string;
  channelCustomUrl: string;
  description: string;
  thumbnailUrl: string;
}

/**
 * 搜索频道
 */
export async function searchChannels(
  query: string,
  maxResults: number = 50
): Promise<YouTubeSearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API Key 未配置');
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`YouTube API 错误: ${response.status} - ${error}`);
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      kind: item.kind,
      channelId: item.id.channelId,
      channelTitle: item.snippet.title,
      channelCustomUrl: item.snippet.channelId || '',
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
    }));
  } catch (error) {
    console.error('YouTube 搜索失败:', error);
    return [];
  }
}

/**
 * 获取频道详细信息
 */
export async function getChannels(
  channelIds: string[]
): Promise<YouTubeChannel[]> {
  if (!YOUTUBE_API_KEY || channelIds.length === 0) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id: channelIds.join(','),
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`YouTube API 错误: ${response.status} - ${error}`);
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl || `@${item.snippet.title.replace(/\s+/g, '')}`,
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
      subscriberCount: parseInt(item.statistics?.subscriberCount || '0'),
      videoCount: parseInt(item.statistics?.videoCount || '0'),
      viewCount: parseInt(item.statistics?.viewCount || '0'),
      country: item.snippet.country || '',
      publishedAt: item.snippet.publishedAt || '',
    }));
  } catch (error) {
    console.error('获取频道详情失败:', error);
    return [];
  }
}

/**
 * 按地区搜索频道
 */
export async function searchChannelsByRegion(
  regionCode: string,
  query: string,
  maxResults: number = 50
): Promise<YouTubeSearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: maxResults.toString(),
      regionCode: regionCode,
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?${params.toString()}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      kind: item.kind,
      channelId: item.id.channelId,
      channelTitle: item.snippet.title,
      channelCustomUrl: item.snippet.channelId || '',
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
    }));
  } catch (error) {
    console.error('YouTube 地区搜索失败:', error);
    return [];
  }
}

/**
 * 获取热门频道（按订阅数排序）
 */
export async function getPopularChannels(
  regionCode: string,
  maxResults: number = 50
): Promise<YouTubeChannel[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  try {
    // 先搜索该地区的频道
    const searchResults = await searchChannelsByRegion(
      regionCode,
      '',
      maxResults
    );

    if (searchResults.length === 0) {
      return [];
    }

    const channelIds = searchResults.map((r) => r.channelId);
    return await getChannels(channelIds);
  } catch (error) {
    console.error('获取热门频道失败:', error);
    return [];
  }
}
