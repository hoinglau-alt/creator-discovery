import { SearchClient, Config as SearchConfig } from 'coze-coding-dev-sdk';
import { FetchClient, Config as FetchConfig } from 'coze-coding-dev-sdk';
import { LLMClient, Config as LLMConfig } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const PLATFORM_SEARCH_QUERIES: Record<string, string[]> = {
  youtube: [
    '香港 YouTuber 排行榜 2024 2025',
    '台湾 YouTuber 推荐 热门频道',
    '澳门 YouTuber 博主',
    '香港 youtube channel 订阅 最多',
    '台湾 youtube 创作者 百万订阅',
    'top hong kong youtubers',
    'top taiwan youtubers',
    'best hong kong youtube channels',
    'popular taiwan youtube creators',
    '香港 美食 youtuber',
    '台湾 科技 youtuber',
    '香港 游戏 youtuber',
    '台湾 美妆 youtuber',
    '香港 旅游 youtuber',
    '台湾 音乐 youtuber',
  ],
  instagram: [
    '香港 instagram 网红 KOL 推荐',
    '台湾 instagram 博主 热门',
    '澳门 instagram 达人',
    'hong kong instagram influencers',
    'taiwan instagram creators',
    '香港 美食 instagram',
    '台湾 时尚 instagram',
    '香港 旅游 instagram',
    '台湾 摄影 instagram',
  ],
  tiktok: [
    '香港 tiktok 创作者 热门',
    '台湾 tiktok 达人 推荐',
    '澳门 tiktok 博主',
    'hong kong tiktok creators',
    'taiwan tiktok influencers',
    '香港 抖音 网红',
    '台湾 抖音 热门',
  ],
  x: [
    '香港 twitter 博主 KOL',
    '台湾 x.com 创作者',
    'hong kong twitter accounts',
    'taiwan twitter influencers',
    '香港 财经 twitter',
    '台湾 科技 twitter',
  ],
  douyin: [
    '香港 抖音 创作者 达人',
    '台湾 抖音 博主 热门',
    '澳门 抖音 网红',
    '香港 抖音 美食',
    '台湾 抖音 搞笑',
  ],
  xiaohongshu: [
    '香港 小红书 博主 KOL',
    '台湾 小红书 达人 推荐',
    '澳门 小红书 创作者',
    '香港 小红书 美食',
    '台湾 小红书 时尚',
  ],
};

const CATEGORY_MAP: Record<string, string> = {
  tech: '科技数码', food: '美食', lifestyle: '生活日常', gaming: '游戏',
  beauty: '美妆时尚', music: '音乐', education: '知识科普', comedy: '搞笑幽默',
  entertainment: '影视娱乐', anime: '动漫二次元', fitness: '运动健身', travel: '旅行',
  pets: '宠物', automotive: '汽车', finance: '财经商业', photography: '摄影',
  diy: '手工DIY', dance: '舞蹈', parenting: '亲子育儿', home: '家居装修',
};

const REGION_MAP: Record<string, string> = {
  hong_kong: '香港', macau: '澳门', taiwan: '台湾',
};

interface ScrapedCreator {
  name: string;
  platform: string;
  platform_handle: string;
  platform_url: string;
  avatar_url: string;
  region: string;
  categories: string[];
  followers: number;
  follower_tier: string;
  content_type: string;
  languages: string[];
  bio: string;
  contact_info: Array<{ type: string; value: string; reliability: string; source: string }>;
  source_url: string;
}

function extractHandleFromUrl(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    if (platform === 'youtube') {
      const match = pathname.match(/\/(?:@|c\/|channel\/|user\/)([^/\s]+)/i);
      if (match) return `@${match[1]}`;
    } else if (platform === 'instagram') {
      const match = pathname.match(/^\/([^/\s]+)/);
      if (match && !['p', 'reel', 'stories', 'explore', 'accounts'].includes(match[1])) {
        return `@${match[1]}`;
      }
    } else if (platform === 'tiktok') {
      const match = pathname.match(/^\/@([^/\s]+)/);
      if (match) return `@${match[1]}`;
    } else if (platform === 'x') {
      const match = pathname.match(/^\/([^/\s]+)/);
      if (match && !['i', 'search', 'hashtag', 'explore', 'settings', 'home'].includes(match[1])) {
        return `@${match[1]}`;
      }
    } else if (platform === 'douyin') {
      const match = pathname.match(/\/user\/([^/\s]+)/);
      if (match) return match[1];
    } else if (platform === 'xiaohongshu') {
      const match = pathname.match(/\/user\/profile\/([^/\s]+)/);
      if (match) return match[1];
    }
  } catch {
    // ignore
  }
  return null;
}

function getFollowerTier(followers: number): string {
  if (followers >= 1000000) return '100w+';
  if (followers >= 500000) return '50-100w';
  if (followers >= 100000) return '10-50w';
  if (followers >= 10000) return '1-10w';
  return '<1w';
}

function extractFromSnippet(
  title: string,
  snippet: string,
  url: string,
  platform: string,
  region: string,
  category: string
): ScrapedCreator | null {
  try {
    const handle = extractHandleFromUrl(url, platform);
    if (!handle) return null;

    const nameMatch = title.match(/^(.+?)[\s\-|@#]/);
    const name = nameMatch ? nameMatch[1].trim() : handle.replace('@', '');

    const followerMatch = snippet.match(/(\d+(?:\.\d+)?)[\s]*(万|million|M|K|千|百万)/i);
    let followers = 0;
    if (followerMatch) {
      const num = parseFloat(followerMatch[1]);
      const unit = followerMatch[2].toLowerCase();
      if (unit === '万' || unit === '千') followers = num * 10000;
      else if (unit === 'million' || unit === '百万') followers = num * 1000000;
      else if (unit === 'm') followers = num * 1000000;
      else if (unit === 'k') followers = num * 1000;
      else followers = num;
    }

    return {
      name,
      platform,
      platform_handle: handle,
      platform_url: url,
      avatar_url: '',
      region,
      categories: [category],
      followers,
      follower_tier: getFollowerTier(followers),
      content_type: 'both',
      languages: region === 'hong_kong' ? ['粤语', '英语'] : region === 'macau' ? ['粤语', '普通话'] : ['普通话', '闽南语'],
      bio: snippet.slice(0, 200),
      contact_info: [],
      source_url: url,
    };
  } catch {
    return null;
  }
}

async function extractCreatorsBatch(
  llmClient: LLMClient,
  items: Array<{ title: string; snippet: string; url: string }>,
  platform: string,
  region: string,
  category: string
): Promise<ScrapedCreator[]> {
  if (items.length === 0) return [];

  const regionName = REGION_MAP[region] || region;
  const categoryName = CATEGORY_MAP[category] || category;

  // Build batch input
  const itemsText = items.map((item, idx) => {
    return `[${idx + 1}]
标题: ${item.title || ''}
摘要: ${item.snippet || ''}
URL: ${item.url || ''}`;
  }).join('\n\n');

  const prompt = `从以下${items.length}条搜索结果中提取所有创作者/博主/YouTuber/网红信息。

平台: ${platform}
目标地区: ${regionName}
目标品类: ${categoryName}

搜索结果:
${itemsText}

请以JSON数组格式返回所有找到的创作者，格式如下:
[
  {
    "name": "创作者名称",
    "handle": "@账号handle",
    "followers": 0,
    "bio": "简介（可选）"
  }
]

规则:
1. 只提取真正的创作者/博主/YouTuber/网红，排除普通文章、新闻、商品链接
2. 如果某条结果不是创作者，跳过它
3. handle 必须以 @ 开头
4. followers 填估计值，如果无法判断填 0
5. 如果没有找到任何创作者，返回空数组 []

只返回JSON数组，不要其他内容。`;

  try {
    const response = await llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'doubao-seed-2-0-mini-260215', temperature: 0.3 }
    );

    const content = response.content || '';
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item: any) => item.name && item.handle)
      .map((item: any) => {
        const followers = typeof item.followers === 'number' ? item.followers : 0;
        return {
          name: item.name,
          platform,
          platform_handle: item.handle.startsWith('@') ? item.handle : `@${item.handle}`,
          platform_url: items.find(i => i.title?.includes(item.name))?.url || '',
          avatar_url: '',
          region,
          categories: [category],
          followers,
          follower_tier: getFollowerTier(followers),
          content_type: 'both',
          languages: region === 'hong_kong' ? ['粤语', '英语'] : region === 'macau' ? ['粤语', '普通话'] : ['普通话', '闽南语'],
          bio: item.bio || items.find(i => i.title?.includes(item.name))?.snippet?.slice(0, 200) || '',
          contact_info: [],
          source_url: items.find(i => i.title?.includes(item.name))?.url || '',
        } as ScrapedCreator;
      });
  } catch (error) {
    console.error('批量LLM提取失败:', error);
    return [];
  }
}

async function extractCreatorWithLLM(
  llmClient: LLMClient,
  context: {
    platform: string;
    region: string;
    category: string;
    url: string;
    handle: string;
    title: string;
    snippet: string;
    pageText: string;
  }
): Promise<ScrapedCreator | null> {
  try {
    const prompt = `从以下页面内容中提取创作者信息。

平台: ${context.platform}
地区: ${context.region}
品类: ${context.category}
URL: ${context.url}
Handle: ${context.handle}
标题: ${context.title}
摘要: ${context.snippet}

页面内容:
${context.pageText.slice(0, 2000)}

请以JSON格式返回创作者信息:
{
  "name": "创作者名称",
  "followers": 0,
  "bio": "简介",
  "contact_email": "邮箱或null",
  "contact_other": "其他联系方式或null"
}

只返回JSON，不要其他内容。`;

    const response = await llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'doubao-seed-2-0-mini-260215', temperature: 0.3 }
    );

    const content = response.content || '';
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const contactInfo = [];
    if (parsed.contact_email) {
      contactInfo.push({ type: 'email', value: parsed.contact_email, reliability: 'high', source: '页面提取' });
    }
    if (parsed.contact_other) {
      contactInfo.push({ type: 'other', value: parsed.contact_other, reliability: 'medium', source: '页面提取' });
    }

    return {
      name: parsed.name || context.handle,
      platform: context.platform,
      platform_handle: context.handle,
      platform_url: context.url,
      avatar_url: '',
      region: context.region,
      categories: [context.category],
      followers: typeof parsed.followers === 'number' ? parsed.followers : 0,
      follower_tier: getFollowerTier(typeof parsed.followers === 'number' ? parsed.followers : 0),
      content_type: 'both',
      languages: context.region === 'hong_kong' ? ['粤语', '英语'] : context.region === 'macau' ? ['粤语', '普通话'] : ['普通话', '闽南语'],
      bio: parsed.bio || context.snippet.slice(0, 200),
      contact_info: contactInfo,
      source_url: context.url,
    };
  } catch {
    return null;
  }
}

async function storeCreator(supabase: any, creator: ScrapedCreator): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('creators')
      .upsert(
        {
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
          source_url: creator.source_url,
        },
        { onConflict: 'platform_handle' }
      );

    if (error) {
      console.error(`存储创作者失败 ${creator.name}:`, error.message);
    }
  } catch (error) {
    console.error(`存储创作者异常 ${creator.name}:`, error);
  }
}

export async function createScrapeJob(
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

  if (error) throw new Error(`创建任务失败: ${error.message}`);
  return data.id;
}

export async function getScrapeJobStatus(jobId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw new Error(`查询任务失败: ${error.message}`);
  return data;
}

export async function scrapeCreators(
  platform: string,
  category: string,
  region: string,
  targetCount: number = 20,
  jobId?: string
): Promise<{ scraped: number; creators: ScrapedCreator[] }> {
  const searchConfig = new SearchConfig();
  const searchClient = new SearchClient(searchConfig);
  const llmConfig = new LLMConfig();
  const llmClient = new LLMClient(llmConfig);
  const supabase = getSupabaseClient();

  const regionName = REGION_MAP[region] || region;
  const categoryName = CATEGORY_MAP[category] || category;
  const queries = PLATFORM_SEARCH_QUERIES[platform] || [`${platform} ${region} ${category} 创作者`];

  const allCreators: ScrapedCreator[] = [];
  const seenHandles = new Set<string>();
  const allSearchItems: Array<{ title: string; snippet: string; url: string }> = [];

  // Load existing creators from database for deduplication
  const { data: existingCreators } = await supabase
    .from('creators')
    .select('platform_handle')
    .eq('platform', platform)
    .eq('region', region);

  if (existingCreators) {
    for (const c of existingCreators) {
      if (c.platform_handle) seenHandles.add(c.platform_handle);
    }
    console.log(`数据库已有 ${existingCreators.length} 位${platform}/${region}创作者，将自动跳过`);
  }

  if (jobId) {
    const { error } = await supabase.from('scrape_jobs').update({
      status: 'running',
      started_at: new Date().toISOString(),
    }).eq('id', jobId);
    if (error) console.error('更新任务状态失败:', error.message);
  }

  // Phase 1: Collect all search results
  console.log(`开始收集搜索结果...`);
  for (const queryTemplate of queries) {
    const query = queryTemplate
      .replace('{region}', regionName)
      .replace('{category}', categoryName);

    try {
      const searchResponse = await searchClient.advancedSearch(query, {
        count: 20,
        needSummary: false,
      });

      if (!searchResponse.web_items || searchResponse.web_items.length === 0) {
        console.log(`搜索无结果: ${query}`);
        continue;
      }

      console.log(`搜索 "${query}" 返回 ${searchResponse.web_items.length} 条结果`);

      for (const item of searchResponse.web_items) {
        if (!item.url) continue;

        // Strategy 1: Extract from snippet directly (fast, no LLM needed)
        const handle = extractHandleFromUrl(item.url, platform);
        if (handle && !seenHandles.has(handle)) {
          const fromSnippet = extractFromSnippet(
            item.title || '',
            item.snippet || '',
            item.url,
            platform, region, category
          );

          if (fromSnippet) {
            seenHandles.add(handle);
            allCreators.push(fromSnippet);
            await storeCreator(supabase, fromSnippet);
            console.log(`从摘要提取: ${fromSnippet.name} (${handle})`);
            continue;
          }
        }

        // Add to batch for LLM processing
        allSearchItems.push({
          title: item.title || '',
          snippet: item.snippet || '',
          url: item.url,
        });
      }
    } catch (error) {
      console.error(`搜索失败: ${query}`, error);
    }
  }

  // Phase 2: Batch LLM extraction
  if (allSearchItems.length > 0 && allCreators.length < targetCount) {
    console.log(`开始批量LLM提取，共 ${allSearchItems.length} 条搜索结果...`);

    // Process in batches of 20
    const batchSize = 20;
    for (let i = 0; i < allSearchItems.length; i += batchSize) {
      if (allCreators.length >= targetCount) break;

      const batch = allSearchItems.slice(i, i + batchSize);
      console.log(`处理批次 ${Math.floor(i / batchSize) + 1} (${batch.length} 条)...`);

      const fromBatch = await extractCreatorsBatch(llmClient, batch, platform, region, category);

      for (const creator of fromBatch) {
        if (allCreators.length >= targetCount) break;
        if (seenHandles.has(creator.platform_handle)) continue;

        seenHandles.add(creator.platform_handle);
        allCreators.push(creator);
        await storeCreator(supabase, creator);
        console.log(`批量LLM提取: ${creator.name} (${creator.platform_handle})`);
      }

      // Update job progress
      if (jobId) {
        await supabase.from('scrape_jobs').update({
          scraped_count: allCreators.length,
        }).eq('id', jobId);
      }
    }
  }

  // Update job status
  if (jobId) {
    await supabase.from('scrape_jobs').update({
      status: 'completed',
      scraped_count: allCreators.length,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  console.log(`抓取完成: 共 ${allCreators.length} 位创作者`);

  return {
    scraped: allCreators.length,
    creators: allCreators,
  };
}
