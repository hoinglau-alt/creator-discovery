/**
 * Creator Scraper - Web Search + LLM Extraction
 * 通过 Web 搜索 + LLM 批量提取发现创作者
 */

import { SearchClient, LLMClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { searchChannelsByRegion, type YouTubeSearchResult } from '@/lib/youtube-api';

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

// ==================== Search Queries ====================

function getSearchQueries(platform: string, category: string, region: string): string[] {
  const platformName = PLATFORM_NAMES[platform] || platform;
  const categoryName = CATEGORY_NAMES[category] || category;
  const regionName = REGION_NAMES[region] || region;

  const baseQueries = [
    `${regionName} ${categoryName} ${platformName} 创作者 推荐 2024 2025`,
    `${regionName} ${platformName} ${categoryName} 频道 博主 排行`,
    `${platformName} ${categoryName} ${regionName} 优质账号 关注`,
  ];

  const extraQueries = [
    `${regionName} ${categoryName} YouTuber 推荐`,
    `${platformName} ${categoryName} 香港 台湾 澳门 博主`,
    `${categoryName} 创作者 ${regionName} 粉丝多`,
  ];

  return platform === 'youtube' ? [...baseQueries, ...extraQueries] : baseQueries;
}

// ==================== YouTube API ====================

async function scrapeYouTubeChannels(
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapedCreator[]> {
  const creators: ScrapedCreator[] = [];

  try {
    const channels = await searchChannelsByRegion(region, category, targetCount);

    for (const channel of channels) {
      const handle = channel.channelCustomUrl || '';
      if (!handle) continue;

      const platformHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const platformUrl = `https://youtube.com/${platformHandle}`;

      creators.push({
        name: channel.channelTitle,
        platform: 'youtube',
        platform_handle: platformHandle,
        platform_url: platformUrl,
        avatar_url: channel.thumbnailUrl || '',
        region,
        categories: [category],
        followers: 0,
        follower_tier: '<1w',
        content_type: 'mid_long',
        languages: region === 'hong_kong' ? ['粤语', '英语'] : region === 'taiwan' ? ['国语', '英语'] : ['粤语', '国语', '英语'],
        bio: channel.description || '',
        contact_info: [],
      });
    }
  } catch (error) {
    console.error(`YouTube API 抓取失败：${error}`);
  }

  return creators;
}

// ==================== Web Search + LLM ====================

async function searchCreators(
  platform: string,
  category: string,
  region: string,
  targetCount: number
): Promise<ScrapedCreator[]> {
  const client = getSearchClient();
  const queries = getSearchQueries(platform, category, region);
  const allResults: Array<{ title: string; url: string; snippet: string }> = [];
  const seenUrls = new Set<string>();

  // 收集搜索结果
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
      console.error(`搜索失败 "${query}": ${error}`);
    }
  }

  console.log(`搜索 "${category}/${region}" 收集 ${allResults.length} 条结果`);

  if (allResults.length === 0) {
    return [];
  }

  // 批量 LLM 提取
  const creators = await extractCreatorsBatch(allResults, platform, category, region, targetCount);

  return creators;
}

// ==================== LLM Batch Extraction ====================

async function extractCreatorsBatch(
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

    const prompt = `从以下搜索结果中提取${REGION_NAMES[region] || region}地区的${CATEGORY_NAMES[category] || category}创作者信息。

**重要：只提取真正属于"${CATEGORY_NAMES[category] || category}"品类的创作者！**
- 科技数码：手机、电脑、数码产品测评
- 动漫二次元：动画、漫画、Cosplay、二次元文化
- 美食：料理、探店、食谱
- 美妆时尚：化妆、护肤、穿搭
- 游戏：电玩、手游、游戏攻略
- 其他品类按常理判断

如果搜索结果中的创作者不属于该品类，请跳过。

${content}

请以 JSON 数组格式返回，每个创作者包含：
- name: 创作者名称
- handle: 平台账号（@开头）
- followers: 粉丝数（数字）
- bio: 简介（50 字内）
- contact: 联系方式（邮箱/社交账号，如果没有留空字符串）
- url: 主页链接

只返回 JSON 数组，不要其他内容。最多返回${targetCount}个创作者。`;

    try {
      const response = await getLLMClient().invoke([
        { role: 'user', content: prompt },
      ]);

      const text = response.content || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const platformName = PLATFORM_NAMES[platform] || platform;
        const regionName = REGION_NAMES[region] || region;

        for (const item of parsed) {
          if (!item.name || !item.handle) continue;

          const platformHandle = item.handle.startsWith('@') ? item.handle : `@${item.handle}`;
          const platformUrl = item.url || (platform === 'youtube' ? `https://youtube.com/${platformHandle}` : '');

          const contactInfo = item.contact
            ? [{ type: 'email', value: item.contact, reliability: 'medium', source: '搜索提取' }]
            : [];

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
            languages: region === 'hong_kong' ? ['粤语', '英语'] : region === 'taiwan' ? ['国语', '英语'] : ['粤语', '国语', '英语'],
            bio: item.bio || '',
            contact_info: contactInfo,
          });
        }
      }
    } catch (error) {
      console.error(`LLM 提取失败：${error}`);
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
    // 更新
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
    // 插入
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
  const updates: any = { status };
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

  try {
    // 获取已有的 handle，用于去重
    const existingHandles = await getExistingHandles(platform, region);
    console.log(`数据库已有 ${existingHandles.size} 位${platform}/${region}创作者，将自动跳过`);

    let creators: ScrapedCreator[] = [];

    // YouTube 优先使用 API
    if (platform === 'youtube') {
      creators = await scrapeYouTubeChannels(category, region, targetCount);
      console.log(`YouTube API 获取 ${creators.length} 位创作者`);
    }

    // 如果 API 不够，用 Web 搜索补充
    if (creators.length < targetCount) {
      const webCreators = await searchCreators(platform, category, region, targetCount - creators.length);
      creators = [...creators, ...webCreators];
    }

    // 去重 + 过滤
    const seenHandles = new Set<string>();
    const uniqueCreators: ScrapedCreator[] = [];

    for (const creator of creators) {
      if (existingHandles.has(creator.platform_handle)) {
        continue; // 跳过已存在的
      }
      if (seenHandles.has(creator.platform_handle)) {
        continue; // 跳过本次重复的
      }
      // 只保留有联系方式的创作者
      if (!creator.contact_info || creator.contact_info.length === 0) {
        continue;
      }

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

    console.log(`抓取完成：共 ${uniqueCreators.length} 位创作者，${storedCount} 位已入库`);

    return {
      creators: uniqueCreators,
      total: storedCount,
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
