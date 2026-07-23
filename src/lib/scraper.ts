/**
 * Creator Scraper - YouTube API + Web Search + LLM
 * 多数据源创作者发现引擎
 */

import { SearchClient, LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { checkYouTubeAPIStatus, searchChannelsByRegion, getChannelDetails } from '@/lib/youtube-api';
import type { ContactInfo } from '@/lib/types';

// ==================== Types ====================

export interface ScrapedCreator {
  name: string;
  platform: string;
  platform_handle: string;
  platform_url?: string;
  avatar_url?: string;
  region: string;
  categories: string[];
  followers: number;
  follower_tier: string;
  content_type: string;
  languages: string[];
  bio?: string;
  contact_info: Array<{
    type: string;
    value: string;
    reliability: string;
    source: string;
  }>;
}

export interface ScrapeResult {
  creators: ScrapedCreator[];
  total: number;
  sources: { youtube_api: number; web_search: number };
}

// ==================== Singleton Clients ====================

let searchClient: SearchClient | null = null;
let llmClient: LLMClient | null = null;

function getSearchClient(): SearchClient {
  if (!searchClient) {
    searchClient = new SearchClient();
  }
  return searchClient;
}

function getLLMClient(): LLMClient {
  if (!llmClient) {
    llmClient = new LLMClient();
  }
  return llmClient;
}

// ==================== Constants ====================

const PLATFORM_NAMES: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X (Twitter)',
  douyin: '抖音',
  xiaohongshu: '小红书',
};

const CATEGORY_NAMES: Record<string, string> = {
  tech: '科技数码',
  food: '美食',
  lifestyle: '生活日常',
  gaming: '游戏',
  beauty: '美妆时尚',
  music: '音乐',
  education: '知识科普',
  comedy: '搞笑幽默',
  entertainment: '影视娱乐',
  anime: '动漫二次元',
  sports: '运动健身',
  travel: '旅行',
  pets: '宠物',
  auto: '汽车',
  finance: '财经商业',
  photography: '摄影',
  diy: '手工 DIY',
  dance: '舞蹈',
  parenting: '亲子育儿',
  home: '家居装修',
};

const REGION_NAMES: Record<string, string> = {
  hong_kong: '香港',
  macau: '澳门',
  taiwan: '台湾',
};

const REGION_LANG_MAP: Record<string, string[]> = {
  hong_kong: ['粤语', '英语'],
  macau: ['粤语', '国语', '英语'],
  taiwan: ['国语', '英语'],
};

const PLATFORM_DOMAINS: Record<string, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  instagram: ['instagram.com'],
  tiktok: ['tiktok.com'],
  x: ['x.com', 'twitter.com'],
  douyin: ['douyin.com'],
  xiaohongshu: ['xiaohongshu.com', 'xhslink.com'],
};

// ==================== YouTube API Source ====================

async function scrapeFromYouTubeAPI(
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapedCreator[]> {
  const creators: ScrapedCreator[] = [];

  try {
    // 方案：Web Search 搜索 + YouTube API 获取详情（避免 Search 配额限制）
    const client = getSearchClient();
    const queries = getSearchQueries('youtube', category, region);
    const allResults: Array<{ title: string; url: string; snippet: string }> = [];
    const seenUrls = new Set<string>();

    // 1. Web Search 搜索创作者
    for (const query of queries) {
      try {
        const response = await client.webSearch(query, 50, false);
        if (response.web_items) {
          for (const result of response.web_items) {
            const url = result.url || '';
            if (!url || seenUrls.has(url)) continue;
            seenUrls.add(url);
            allResults.push({
              title: result.title || '',
              url,
              snippet: result.snippet || '',
            });
          }
        }
      } catch (error) {
        console.error(`[Web Search] 搜索失败 "${query}": ${error}`);
      }
    }

    console.log(`[YouTube Hybrid] Web Search 收集 ${allResults.length} 条结果`);

    if (allResults.length === 0) {
      return [];
    }

    // 2. 从搜索结果提取创作者名字
    const extractedCreators = await extractCreatorsFromResults(
      allResults,
      'youtube',
      category,
      region,
      targetCount
    );

    console.log(`[YouTube Hybrid] 提取 ${extractedCreators.length} 位创作者`);

    // 3. 用 YouTube API 获取频道详情（消耗 Queries 配额，不是 Search 配额）
    for (const creator of extractedCreators) {
      try {
        const handle = creator.platform_handle || '';
        if (!handle) continue;

        // 用 channels.list 获取详情（消耗 Queries 配额）
        const channels = await getChannelDetails([handle]);
        if (channels.length > 0) {
          const channel = channels[0];
          creator.followers = channel.subscriberCount || creator.followers;
          creator.bio = channel.description || creator.bio;
          creator.avatar_url = channel.thumbnailUrl || creator.avatar_url;

          // 提取联系方式
          const contacts = extractContactInfo(channel.description || '');
          if (contacts.length > 0) {
            creator.contact_info = contacts;
          }
        }
      } catch (error) {
        console.error(`[YouTube API] 获取 ${creator.name} 详情失败：${error}`);
      }
    }

    creators.push(...extractedCreators);
    console.log(`[YouTube Hybrid] 最终获取 ${creators.length} 位创作者`);
  } catch (error) {
    console.error(`[YouTube Hybrid] 抓取失败：${error}`);
  }

  return creators;
}

// ==================== Web Search Source ====================

function extractContactInfo(text: string): ContactInfo[] {
  const contacts: ContactInfo[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails) {
    for (const email of emails) {
      contacts.push({ type: 'email', value: email, reliability: 'high', source: '频道描述' });
    }
  }
  return contacts;
}

function getSearchQueries(platform: string, category: string, region: string): string[] {
  const platformName = PLATFORM_NAMES[platform] || platform;
  const categoryName = CATEGORY_NAMES[category] || category;
  const regionName = REGION_NAMES[region] || region;

  const platformDomain = PLATFORM_DOMAINS[platform] || '';
  const siteFilter = platformDomain ? ` site:${platformDomain}` : '';

  const queries = [
    `${regionName} ${categoryName}${siteFilter} 博主 推荐`,
    `${regionName} ${categoryName} ${platformName} 账号${siteFilter}`,
    `${categoryName} ${regionName} YouTuber 频道`,
    `${regionName} ${categoryName} 创作者 排行`,
  ];

  return queries;
}

async function scrapeFromWebSearch(
  platform: string,
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapedCreator[]> {
  const client = getSearchClient();
  const queries = getSearchQueries(platform, category, region);
  const allResults: Array<{ title: string; url: string; snippet: string }> = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const response = await client.webSearch(query, 20, false);
      if (response.web_items) {
        for (const result of response.web_items) {
          const url = result.url || '';
          if (!url || seenUrls.has(url)) continue;
          seenUrls.add(url);
          allResults.push({
            title: result.title || '',
            url,
            snippet: result.snippet || '',
          });
        }
      }
    } catch (error) {
      console.error(`[Web Search] 搜索失败 "${query}": ${error}`);
    }
  }

  console.log(`[Web Search] "${category}/${region}" 收集 ${allResults.length} 条结果`);

  if (allResults.length === 0) {
    return [];
  }

  return extractCreatorsFromResults(allResults, platform, category, region, targetCount);
}

// ==================== LLM Extraction ====================

async function extractCreatorsFromResults(
  results: Array<{ title: string; url: string; snippet: string }>,
  platform: string,
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapedCreator[]> {
  const batchSize = 20;
  const allCreators: ScrapedCreator[] = [];

  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    const content = batch
      .map((r, idx) => `[${idx + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
      .join('\n\n');

    const categoryName = CATEGORY_NAMES[category] || category;
    const regionName = REGION_NAMES[region] || region;

    const prompt = `从以下搜索结果中提取${regionName}地区的「${categoryName}」品类创作者。

**严格要求：**
1. 只提取真正属于「${categoryName}」品类的创作者（如科技数码=手机/电脑/数码测评，动漫二次元=动画/漫画/Cosplay/ACG）
2. 必须是${regionName}地区的创作者
3. 必须能识别出平台账号（handle）

搜索结果：
${content}

返回 JSON 数组，每个元素：
{
  "name": "创作者名称",
  "handle": "@平台账号",
  "followers": 粉丝数(数字，无法判断填0),
  "bio": "50字内简介",
  "contact": "商务邮箱或联系方式(没有填空字符串)",
  "url": "主页链接"
}

只返回 JSON 数组，最多${targetCount}个。不符合条件的不要返回。`;

    try {
      const response = await getLLMClient().invoke([
        { role: 'user', content: prompt },
      ]);

      const text = response.content || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        for (const item of parsed) {
          if (!item.name || !item.handle) continue;

          const platformHandle = item.handle.startsWith('@') ? item.handle : `@${item.handle}`;
          const platformUrl = item.url || (platform === 'youtube' ? `https://youtube.com/${platformHandle}` : '');

          const contactInfo: Array<{ type: string; value: string; reliability: string; source: string }> = [];
          if (item.contact && typeof item.contact === 'string' && item.contact.includes('@')) {
            contactInfo.push({
              type: 'email',
              value: item.contact,
              reliability: 'medium',
              source: 'Web 搜索提取',
            });
          } else if (item.contact && typeof item.contact === 'string' && item.contact.length > 0) {
            contactInfo.push({
              type: 'social',
              value: item.contact,
              reliability: 'low',
              source: 'Web 搜索提取',
            });
          }

          allCreators.push({
            name: item.name,
            platform,
            platform_handle: platformHandle,
            platform_url: platformUrl,
            avatar_url: '',
            region,
            categories: [category],
            followers: item.followers || 0,
            follower_tier: getFollowerTier(item.followers || 0),
            content_type: 'both',
            languages: REGION_LANG_MAP[region] || ['国语', '英语'],
            bio: item.bio || '',
            contact_info: contactInfo,
          });
        }
      }
    } catch (error) {
      console.error(`[LLM] 提取失败：${error}`);
    }
  }

  return allCreators;
}

// ==================== Helper Functions ====================

function getFollowerTier(followers: number): string {
  if (followers >= 1000000) return '100w+';
  if (followers >= 500000) return '50-100w';
  if (followers >= 100000) return '10-50w';
  if (followers >= 10000) return '1-10w';
  return '<1w';
}

// ==================== Database Operations ====================

async function getExistingHandles(platform: string, region: string): Promise<Set<string>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('creators')
    .select('platform_handle')
    .eq('platform', platform)
    .eq('region', region);

  return new Set((data || []).map((c: any) => c.platform_handle));
}

async function storeCreator(creator: ScrapedCreator): Promise<boolean> {
  const supabase = getSupabaseClient();

  // 检查是否已存在
  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('platform_handle', creator.platform_handle)
    .limit(1);

  if (existing && existing.length > 0) {
    // 更新已有记录
    const { error } = await supabase
      .from('creators')
      .update({
        name: creator.name,
        followers: creator.followers,
        follower_tier: creator.follower_tier,
        bio: creator.bio,
        contact_info: creator.contact_info,
        platform_url: creator.platform_url,
        avatar_url: creator.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('platform_handle', creator.platform_handle);

    if (error) {
      console.error(`更新创作者失败 ${creator.name}: ${error.message}`);
      return false;
    }
    return true;
  } else {
    // 插入新记录
    const { error } = await supabase.from('creators').insert({
      name: creator.name,
      platform: creator.platform,
      platform_handle: creator.platform_handle,
      platform_url: creator.platform_url,
      avatar_url: creator.avatar_url,
      region: creator.region,
      categories: creator.categories,
      followers: creator.followers,
      follower_tier: creator.follower_tier,
      content_type: creator.content_type,
      languages: creator.languages,
      bio: creator.bio,
      contact_info: creator.contact_info,
      outreach_status: 'pending',
    });

    if (error) {
      console.error(`存储创作者失败 ${creator.name}: ${error.message}`);
      return false;
    }
    return true;
  }
}

async function createScrapeJob(
  platform: string,
  category: string,
  region: string,
  targetCount: number
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .insert({
      platform,
      category,
      region,
      target_count: targetCount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

async function updateJobStatus(
  jobId: string,
  status: string,
  scrapedCount?: number,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const updates: Record<string, unknown> = { status };
  if (scrapedCount !== undefined) updates.scraped_count = scrapedCount;
  if (errorMessage) updates.error_message = errorMessage;
  if (status === 'running') updates.started_at = new Date().toISOString();
  if (status === 'completed' || status === 'failed') updates.completed_at = new Date().toISOString();

  await supabase.from('scrape_jobs').update(updates).eq('id', jobId);
}

// ==================== Main Scrape Function ====================

export async function scrapeCreators(
  platform: string,
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapeResult> {
  const jobId = await createScrapeJob(platform, category, region, targetCount);
  await updateJobStatus(jobId, 'running');

  const sources = { youtube_api: 0, web_search: 0 };

  try {
    // 获取已有的 handle，用于去重
    const existingHandles = await getExistingHandles(platform, region);
    console.log(`数据库已有 ${existingHandles.size} 位 ${platform}/${region} 创作者，将自动跳过`);

    let creators: ScrapedCreator[] = [];

    // YouTube 平台优先使用 API
    if (platform === 'youtube') {
      const apiStatus = await checkYouTubeAPIStatus();
      console.log(`[YouTube API] 状态: available=${apiStatus.available}, configured=${apiStatus.apiKeyConfigured}`);

      if (apiStatus.available) {
        creators = await scrapeFromYouTubeAPI(category, region, targetCount);
        sources.youtube_api = creators.length;
        console.log(`[YouTube API] 成功获取 ${creators.length} 位创作者`);
      } else {
        console.log(`[YouTube API] 不可用 (${apiStatus.error})，改用 Web Search`);
      }
    }

    // 不够的话用 Web Search 补充（非 YouTube 平台直接用 Web Search）
    if (creators.length < targetCount) {
      const remaining = targetCount - creators.length;
      const webCreators = await scrapeFromWebSearch(platform, category, region, remaining);
      creators = [...creators, ...webCreators];
      sources.web_search = webCreators.length;
    }

    // 去重 + 过滤
    const seenHandles = new Set<string>();
    const uniqueCreators: ScrapedCreator[] = [];

    for (const creator of creators) {
      // 跳过数据库中已存在的
      if (existingHandles.has(creator.platform_handle)) continue;
      // 跳过本次重复的
      if (seenHandles.has(creator.platform_handle)) continue;
      // 只保留有联系方式的
      if (!creator.contact_info || creator.contact_info.length === 0) continue;

      seenHandles.add(creator.platform_handle);
      uniqueCreators.push(creator);
    }

    // 存储到数据库
    let storedCount = 0;
    for (const creator of uniqueCreators) {
      const success = await storeCreator(creator);
      if (success) storedCount++;
    }

    await updateJobStatus(jobId, 'completed', storedCount);

    console.log(`抓取完成：共 ${uniqueCreators.length} 位有效创作者（有联系方式），${storedCount} 位已入库`);
    console.log(`数据来源：YouTube API ${sources.youtube_api} + Web Search ${sources.web_search}`);

    return {
      creators: uniqueCreators,
      total: storedCount,
      sources,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await updateJobStatus(jobId, 'failed', 0, errorMessage);
    throw error;
  }
}

// ==================== Job Status ====================

export async function getScrapeJobStatus(jobId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllScrapeJobs() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ==================== API Status Check ====================

export async function getDataSourceStatus() {
  const youtubeStatus = await checkYouTubeAPIStatus();

  return {
    youtube: {
      available: youtubeStatus.available,
      apiKeyConfigured: youtubeStatus.apiKeyConfigured,
      error: youtubeStatus.error,
    },
    webSearch: {
      available: true, // Web Search 始终可用
    },
  };
}
