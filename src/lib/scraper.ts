import { SearchClient, Config as SearchConfig } from 'coze-coding-dev-sdk';
import { FetchClient, Config as FetchConfig } from 'coze-coding-dev-sdk';
import { LLMClient, Config as LLMConfig } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const PLATFORM_SEARCH_QUERIES: Record<string, string[]> = {
  youtube: [
    'site:youtube.com "@{handle}" {region} {category} 创作者',
    'youtube.com {region} {category} 频道 台湾 香港 澳门',
    '{region} youtube {category} channel 热门 YouTuber',
  ],
  instagram: [
    'site:instagram.com {region} {category} 网红 KOL',
    'instagram {region} {category} 创作者 台湾 香港 澳门',
  ],
  tiktok: [
    'site:tiktok.com @{handle} {region} {category}',
    'tiktok {region} {category} 创作者 热门 台湾 香港',
  ],
  x: [
    'site:x.com {region} {category} 创作者 KOL',
    'twitter {region} {category} 博主 台湾 香港 澳门',
  ],
  douyin: [
    '抖音 {region} {category} 创作者 热门博主',
    'douyin.com {region} {category} 达人',
  ],
  xiaohongshu: [
    '小红书 {region} {category} 博主 热门',
    'xiaohongshu {region} {category} 达人 KOL',
  ],
};

const CATEGORY_MAP: Record<string, string> = {
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
  fitness: '运动健身',
  travel: '旅行',
  pets: '宠物',
  automotive: '汽车',
  finance: '财经商业',
  photography: '摄影',
  diy: '手工DIY',
  dance: '舞蹈',
  parenting: '亲子育儿',
  home: '家居装修',
};

const REGION_MAP: Record<string, string> = {
  hong_kong: '香港',
  macau: '澳门',
  taiwan: '台湾',
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

function getFollowerTier(followers: number): string {
  if (followers >= 1000000) return '100w+';
  if (followers >= 500000) return '50-100w';
  if (followers >= 100000) return '10-50w';
  if (followers >= 10000) return '1-10w';
  return '<1w';
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
  const fetchConfig = new FetchConfig();
  const fetchClient = new FetchClient(fetchConfig);
  const llmConfig = new LLMConfig();
  const llmClient = new LLMClient(llmConfig);
  const supabase = getSupabaseClient();

  const regionName = REGION_MAP[region] || region;
  const categoryName = CATEGORY_MAP[category] || category;
  const queries = PLATFORM_SEARCH_QUERIES[platform] || [`${platform} ${region} ${category} 创作者`];

  const allCreators: ScrapedCreator[] = [];
  const seenHandles = new Set<string>();

  // Update job status to running
  if (jobId) {
    const { error } = await supabase.from('scrape_jobs').update({
      status: 'running',
      started_at: new Date().toISOString(),
    }).eq('id', jobId);
    if (error) throw new Error(`更新任务状态失败: ${error.message}`);
  }

  for (const queryTemplate of queries) {
    if (allCreators.length >= targetCount) break;

    const query = queryTemplate
      .replace('{region}', regionName)
      .replace('{category}', categoryName)
      .replace('{handle}', '');

    try {
      const searchResponse = await searchClient.advancedSearch(query, {
        count: 15,
        needSummary: false,
        sites: platform === 'youtube' ? 'youtube.com' :
               platform === 'instagram' ? 'instagram.com' :
               platform === 'tiktok' ? 'tiktok.com' :
               platform === 'x' ? 'x.com,twitter.com' :
               platform === 'douyin' ? 'douyin.com' :
               platform === 'xiaohongshu' ? 'xiaohongshu.com' : undefined,
      });

      if (!searchResponse.web_items) continue;

      for (const item of searchResponse.web_items) {
        if (allCreators.length >= targetCount) break;
        if (!item.url) continue;

        // Try to extract handle from URL
        const handle = extractHandleFromUrl(item.url, platform);
        if (!handle || seenHandles.has(handle)) continue;
        seenHandles.add(handle);

        try {
          // Fetch the profile page
          const fetchResponse = await fetchClient.fetch(item.url);
          if (!fetchResponse || fetchResponse.status_code !== 0) continue;

          const pageText = fetchResponse.content
            .filter((c: { type: string }) => c.type === 'text')
            .map((c: { text?: string }) => c.text || '')
            .join('\n')
            .slice(0, 5000); // Limit text for LLM

          if (pageText.length < 50) continue;

          // Use LLM to extract structured data
          const creator = await extractCreatorWithLLM(llmClient, {
            platform,
            region,
            category,
            url: item.url,
            handle,
            title: item.title || '',
            snippet: item.snippet || '',
            pageText,
          });

          if (creator) {
            allCreators.push(creator);

            // Store in database
            await storeCreator(supabase, creator);

            // Update job progress
            if (jobId) {
              await supabase.from('scrape_jobs').update({
                scraped_count: allCreators.length,
              }).eq('id', jobId);
            }
          }
        } catch {
          // Continue with next item on error
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  // Mark job as completed
  if (jobId) {
    await supabase.from('scrape_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      scraped_count: allCreators.length,
    }).eq('id', jobId);
  }

  return { scraped: allCreators.length, creators: allCreators };
}

function extractHandleFromUrl(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    switch (platform) {
      case 'youtube': {
        const match = path.match(/\/(@[\w.-]+|channel\/[\w]+|c\/[\w]+)/);
        return match ? match[1] : null;
      }
      case 'instagram': {
        const match = path.match(/^\/([\w.]+)/);
        return match ? match[1] : null;
      }
      case 'tiktok': {
        const match = path.match(/^\/(@[\w.]+)/);
        return match ? match[1] : null;
      }
      case 'x': {
        const match = path.match(/^\/([\w]+)/);
        return match && !['home', 'explore', 'search'].includes(match[1]) ? match[1] : null;
      }
      case 'douyin': {
        const match = path.match(/^\/user\/([\w]+)/);
        return match ? match[1] : null;
      }
      case 'xiaohongshu': {
        const match = path.match(/^\/user\/profile\/([\w]+)/);
        return match ? match[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
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
  const prompt = `你是一个创作者数据分析专家。根据以下信息，提取创作者的结构化数据。

平台: ${context.platform}
目标地区: ${context.region}
目标品类: ${context.category}
页面URL: ${context.url}
页面标题: ${context.title}
搜索摘要: ${context.snippet}
页面内容(截取):
${context.pageText.slice(0, 3000)}

请提取以下信息并以JSON格式返回（如果某项信息无法确定，使用合理推测值）：
{
  "name": "创作者名称",
  "bio": "个人简介(50字内)",
  "followers": 粉丝数(数字，无法确定则根据内容推测量级),
  "content_type": "mid_long/short/both",
  "languages": ["语言1", "语言2"],
  "categories": ["品类1", "品类2"],
  "contact_info": [{"type": "email/dm/website", "value": "联系方式", "reliability": "high/medium/low", "source": "来源"}],
  "is_valid": true/false,
  "confidence": 0-100
}

注意：
1. is_valid: 该页面是否确实是一个港澳台地区创作者的主页
2. confidence: 你对提取数据准确性的信心(0-100)
3. 如果无法确认是港澳台创作者，is_valid设为false
4. 联系方式从bio、about、页面文本中提取邮箱、网站等
5. 只返回JSON，不要其他文字`;

  try {
    const response = await llmClient.invoke([
      { role: 'user', content: prompt },
    ], {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.3,
    });

    const content = response.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.is_valid || parsed.confidence < 40) return null;

    return {
      name: parsed.name || context.title || context.handle,
      platform: context.platform,
      platform_handle: context.handle,
      platform_url: context.url,
      avatar_url: '',
      region: context.region,
      categories: parsed.categories || [context.category],
      followers: parsed.followers || 0,
      follower_tier: getFollowerTier(parsed.followers || 0),
      content_type: parsed.content_type || 'both',
      languages: parsed.languages || [],
      bio: parsed.bio || '',
      contact_info: parsed.contact_info || [],
      source_url: context.url,
    };
  } catch {
    return null;
  }
}

async function storeCreator(
  supabase: ReturnType<typeof getSupabaseClient>,
  creator: ScrapedCreator
) {
  // Check if creator already exists
  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('platform_handle', creator.platform_handle)
    .eq('platform', creator.platform)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('creators')
      .update({
        name: creator.name,
        followers: creator.followers,
        follower_tier: creator.follower_tier,
        bio: creator.bio,
        contact_info: creator.contact_info,
        avatar_url: creator.avatar_url,
        platform_url: creator.platform_url,
        categories: creator.categories,
        content_type: creator.content_type,
        languages: creator.languages,
        source_url: creator.source_url,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) throw new Error(`更新创作者失败: ${error.message}`);
  } else {
    // Insert new
    const { error } = await supabase
      .from('creators')
      .insert({
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
        scraped_at: new Date().toISOString(),
      });
    if (error) throw new Error(`存储创作者失败: ${error.message}`);
  }
}

export async function createScrapeJob(
  platform: string,
  category: string,
  region: string,
  targetCount: number = 20
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .insert({
      status: 'pending',
      platform,
      category,
      region,
      target_count: targetCount,
      query: `${REGION_MAP[region] || region} ${CATEGORY_MAP[category] || category} ${platform} 创作者`,
    })
    .select('id')
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
    .maybeSingle();

  if (error) throw new Error(`查询任务失败: ${error.message}`);
  return data;
}
