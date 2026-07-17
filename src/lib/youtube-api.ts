/**
 * YouTube Data API v3 客户端
 * 用于搜索和获取频道信息
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
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
}

// ==================== Region Mapping ====================

const REGION_CODE_MAP: Record<string, string> = {
  hong_kong: 'HK',
  macau: 'MO',
  taiwan: 'TW',
};

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  tech: ['科技', '测评', 'tech review', ' gadget', '数码'],
  food: ['美食', '料理', 'cooking', '探店', '食谱'],
  lifestyle: ['日常', 'vlog', 'lifestyle', '生活'],
  gaming: ['游戏', 'gaming', 'gameplay', '攻略', '实况'],
  beauty: ['美妆', '化妆', 'makeup', '护肤', 'beauty'],
  music: ['音乐', 'music', 'cover', '唱歌', '演奏'],
  education: ['科普', '知识', '教育', '学习', 'tutorial'],
  comedy: ['搞笑', 'comedy', 'humor', '笑', 'funny'],
  entertainment: ['影视', '娱乐', '电影', '影评', 'movie'],
  anime: ['动漫', '二次元', 'anime', 'cosplay', 'manga', 'ACG'],
  sports: ['运动', '健身', 'fitness', 'sports', ' workout'],
  travel: ['旅行', '旅游', 'travel', 'vlog', '游记'],
  pets: ['宠物', '猫', '狗', 'pet', 'cat', 'dog'],
  auto: ['汽车', 'car', 'auto', '车评', '试驾'],
  finance: ['财经', '投资', 'finance', '理财', 'stock'],
  photography: ['摄影', 'photography', '相机', 'camera'],
  diy: ['手工', 'DIY', 'craft', '制作', '手作'],
  dance: ['舞蹈', 'dance', 'choreography', '跳舞'],
  parenting: ['亲子', '育儿', 'parenting', 'baby', '母婴'],
  home: ['家居', '装修', 'home', 'interior', '布置'],
};

// ==================== Core API Functions ====================

/**
 * 搜索频道（基础搜索）
 */
async function searchChannels(
  query: string,
  regionCode: string,
  maxResults: number = 50
): Promise<YouTubeSearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API Key 未配置');
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: Math.min(maxResults, 50).toString(),
      regionCode,
      key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`YouTube API 错误 (${response.status}): ${error}`);
      return [];
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      channelId: item.id.channelId,
      channelTitle: item.snippet.channelTitle || item.snippet.title || '',
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    }));
  } catch (error) {
    console.error('YouTube 搜索失败:', error);
    return [];
  }
}

/**
 * 获取频道详细信息（订阅数、视频数等）
 */
async function getChannelDetails(channelIds: string[]): Promise<YouTubeChannel[]> {
  if (!YOUTUBE_API_KEY || channelIds.length === 0) {
    return [];
  }

  try {
    // API 每次最多 50 个 ID
    const batches: string[][] = [];
    for (let i = 0; i < channelIds.length; i += 50) {
      batches.push(channelIds.slice(i, i + 50));
    }

    const allChannels: YouTubeChannel[] = [];

    for (const batch of batches) {
      const params = new URLSearchParams({
        part: 'snippet,statistics,brandingSettings',
        id: batch.join(','),
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params.toString()}`);

      if (!response.ok) {
        console.error(`YouTube API 详情错误: ${response.status}`);
        continue;
      }

      const data = await response.json();

      for (const item of data.items || []) {
        const snippet = item.snippet || {};
        const stats = item.statistics || {};
        const branding = item.brandingSettings || {};

        allChannels.push({
          id: item.id,
          title: snippet.title || '',
          customUrl: snippet.customUrl || '',
          description: snippet.description || '',
          thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          subscriberCount: parseInt(stats.subscriberCount || '0'),
          videoCount: parseInt(stats.videoCount || '0'),
          viewCount: parseInt(stats.viewCount || '0'),
          country: snippet.country || '',
          publishedAt: snippet.publishedAt || '',
        });
      }
    }

    return allChannels;
  } catch (error) {
    console.error('获取频道详情失败:', error);
    return [];
  }
}

// ==================== Contact Extraction ====================

/**
 * 从频道描述/品牌设置中提取联系方式
 */
function extractContactFromChannel(channel: YouTubeChannel): Array<{
  type: string;
  value: string;
  reliability: string;
  source: string;
}> {
  const contacts: Array<{ type: string; value: string; reliability: string; source: string }> = [];
  const textToSearch = [
    channel.description,
  ].join(' ');

  // 邮箱提取
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = textToSearch.match(emailRegex) || [];
  for (const email of emails) {
    // 过滤掉明显的非商务邮箱
    if (email.includes('example.com') || email.includes('test.com')) continue;
    contacts.push({
      type: 'email',
      value: email,
      reliability: 'high',
      source: 'YouTube 频道描述',
    });
  }

  // 社交媒体链接提取
  const socialPatterns = [
    { type: 'instagram', regex: /(?:instagram\.com\/|@)([a-zA-Z0-9_.]+)/gi },
    { type: 'twitter', regex: /(?:twitter\.com\/|x\.com\/)([a-zA-Z0-9_]+)/gi },
    { type: 'tiktok', regex: /tiktok\.com\/@([a-zA-Z0-9_.]+)/gi },
    { type: 'website', regex: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/g },
  ];

  for (const pattern of socialPatterns) {
    const matches = [...textToSearch.matchAll(pattern.regex)];
    for (const match of matches.slice(0, 1)) {
      contacts.push({
        type: pattern.type,
        value: match[1] || match[0],
        reliability: 'medium',
        source: 'YouTube 频道描述',
      });
    }
  }

  // 去重
  const seen = new Set<string>();
  return contacts.filter(c => {
    const key = `${c.type}:${c.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ==================== High-Level Functions ====================

/**
 * 按品类和地区搜索 YouTube 创作者（完整流程）
 * 1. 搜索频道
 * 2. 获取详细信息（订阅数等）
 * 3. 提取联系方式
 */
export async function discoverYouTubeCreators(
  category: string,
  region: string,
  targetCount: number
): Promise<Array<{
  channel: YouTubeChannel;
  contacts: Array<{ type: string; value: string; reliability: string; source: string }>;
}>> {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API Key 未配置，跳过 YouTube 抓取');
    return [];
  }

  const regionCode = REGION_CODE_MAP[region] || 'TW';
  const searchTerms = CATEGORY_SEARCH_TERMS[category] || [category];

  console.log(`[YouTube] 搜索 ${regionCode} 地区 ${category} 品类，目标 ${targetCount} 位`);

  // 生成多个搜索查询
  const queries: string[] = [];
  for (const term of searchTerms.slice(0, 3)) {
    queries.push(term);
    queries.push(`${term} 创作者`);
  }

  // 搜索频道，收集所有 channelId
  const allChannelIds: string[] = [];
  const seenChannelIds = new Set<string>();

  for (const query of queries) {
    if (allChannelIds.length >= targetCount * 2) break; // 多搜一些以便筛选

    const results = await searchChannels(query, regionCode, Math.min(targetCount, 50));
    for (const r of results) {
      if (!seenChannelIds.has(r.channelId)) {
        seenChannelIds.add(r.channelId);
        allChannelIds.push(r.channelId);
      }
    }
  }

  console.log(`[YouTube] 搜索到 ${allChannelIds.length} 个不重复频道`);

  if (allChannelIds.length === 0) {
    return [];
  }

  // 获取详细信息
  const channels = await getChannelDetails(allChannelIds.slice(0, targetCount * 2));
  console.log(`[YouTube] 获取到 ${channels.length} 个频道详情`);

  // 提取联系方式并组装结果
  const results = channels.map(channel => ({
    channel,
    contacts: extractContactFromChannel(channel),
  }));

  // 优先返回有联系方式的
  results.sort((a, b) => b.contacts.length - a.contacts.length);

  return results.slice(0, targetCount);
}

/**
 * 检查 YouTube API 是否可用
 */
export async function checkYouTubeAPIStatus(): Promise<{
  available: boolean;
  apiKeyConfigured: boolean;
  error?: string;
}> {
  if (!YOUTUBE_API_KEY) {
    return { available: false, apiKeyConfigured: false, error: 'API Key 未配置' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&q=test&maxResults=1&key=${YOUTUBE_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (response.ok) {
      return { available: true, apiKeyConfigured: true };
    } else {
      const error = await response.text();
      return { available: false, apiKeyConfigured: true, error: `API 返回 ${response.status}: ${error}` };
    }
  } catch (error) {
    return {
      available: false,
      apiKeyConfigured: true,
      error: error instanceof Error ? error.message : '网络不可达',
    };
  }
}
