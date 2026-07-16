import { SearchClient, Config as SearchConfig } from 'coze-coding-dev-sdk';
import { FetchClient, Config as FetchConfig } from 'coze-coding-dev-sdk';
import { LLMClient, Config as LLMConfig } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const PLATFORM_SEARCH_QUERIES: Record<string, string[]> = {
  youtube: [
    '香港 台湾 澳门 YouTuber 频道 推荐',
    '港澳台 youtube 创作者 博主 热门',
    'hong kong taiwan macau youtube creator channel',
  ],
  instagram: [
    '香港 台湾 澳门 instagram 网红 KOL 博主',
    '港澳台 instagram 创作者 推荐',
    'hong kong taiwan macau instagram creator influencer',
  ],
  tiktok: [
    '香港 台湾 澳门 tiktok 创作者 达人 热门',
    '港澳台 tiktok 博主 推荐',
    'hong kong taiwan macau tiktok creator',
  ],
  x: [
    '香港 台湾 澳门 twitter 博主 KOL',
    '港澳台 x.com 创作者 推荐',
    'hong kong taiwan macau twitter creator',
  ],
  douyin: [
    '香港 台湾 澳门 抖音 创作者 达人 热门',
    '港澳台 抖音 博主 推荐',
  ],
  xiaohongshu: [
    '香港 台湾 澳门 小红书 博主 KOL 热门',
    '港澳台 小红书 达人 推荐',
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

function getFollowerTier(followers: number): string {
  if (followers >= 1000000) return '100w+';
  if (followers >= 500000) return '50-100w';
  if (followers >= 100000) return '10-50w';
  if (followers >= 10000) return '1-10w';
  return '<1w';
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
        return match && !['home', 'explore', 'search', 'hashtag', 'i'].includes(match[1]) ? match[1] : null;
      }
      case 'douyin': {
        const match = path.match(/\/user\/([\w]+)/);
        return match ? match[1] : null;
      }
      case 'xiaohongshu': {
        const match = path.match(/\/user\/profile\/([\w]+)/);
        return match ? match[1] : null;
      }
      default: return null;
    }
  } catch { return null; }
}

// Extract creator info from search snippet directly (no page fetch needed)
function extractFromSnippet(
  title: string,
  snippet: string,
  url: string,
  platform: string,
  region: string,
  category: string
): ScrapedCreator | null {
  const text = `${title} ${snippet}`.toLowerCase();
  const regionName = REGION_MAP[region] || region;
  const categoryName = CATEGORY_MAP[category] || category;

  // Check if snippet mentions the target region
  const regionKeywords: Record<string, string[]> = {
    hong_kong: ['香港', 'hk', 'hong kong', '港'],
    macau: ['澳门', 'macau', 'macao', '澳'],
    taiwan: ['台湾', 'tw', 'taiwan', '台北', '台中', '台南', '台'],
  };
  const keywords = regionKeywords[region] || [regionName];
  const hasRegion = keywords.some(k => text.includes(k));
  if (!hasRegion) return null;

  // Extract handle from URL
  const handle = extractHandleFromUrl(url, platform);
  if (!handle) return null;

  // Try to extract a name from title or snippet
  let name = title
    .replace(/youtube|instagram|tiktok|twitter|x\.com|douyin|小红书/gi, '')
    .replace(/[-|–—]/g, ' ')
    .trim()
    .slice(0, 50);
  if (!name) name = handle.replace(/^@/, '');

  // Try to extract follower count from snippet
  const followerMatch = snippet.match(/(\d+\.?\d*)\s*[万千wkm]?\s*粉丝|followers?[:\s]*(\d+\.?\d*)\s*[kmb万]?/i);
  let followers = 0;
  if (followerMatch) {
    const num = parseFloat(followerMatch[1] || followerMatch[2] || '0');
    if (snippet.includes('万') || snippet.includes('w')) followers = Math.round(num * 10000);
    else if (snippet.toLowerCase().includes('k')) followers = Math.round(num * 1000);
    else if (snippet.toLowerCase().includes('m')) followers = Math.round(num * 1000000);
    else followers = Math.round(num);
  }

  // Extract contact info from snippet
  const contactInfo: Array<{ type: string; value: string; reliability: string; source: string }> = [];
  const emailMatch = snippet.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    contactInfo.push({ type: 'email', value: emailMatch[0], reliability: 'high', source: '搜索摘要' });
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
    contact_info: contactInfo,
    source_url: url,
  };
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

  if (jobId) {
    const { error } = await supabase.from('scrape_jobs').update({
      status: 'running',
      started_at: new Date().toISOString(),
    }).eq('id', jobId);
    if (error) console.error('更新任务状态失败:', error.message);
  }

  for (const queryTemplate of queries) {
    if (allCreators.length >= targetCount) break;

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
        if (allCreators.length >= targetCount) break;
        if (!item.url) continue;

        const handle = extractHandleFromUrl(item.url, platform);
        if (!handle || seenHandles.has(handle)) continue;

        // Strategy 1: Extract from snippet directly (fast, no fetch needed)
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

          if (jobId) {
            await supabase.from('scrape_jobs').update({
              scraped_count: allCreators.length,
            }).eq('id', jobId);
          }
          continue;
        }

        // Strategy 2: Fetch page and use LLM
        try {
          const fetchResponse = await fetchClient.fetch(item.url);
          if (!fetchResponse || fetchResponse.status_code !== 0) continue;

          const pageText = fetchResponse.content
            .filter((c: { type: string }) => c.type === 'text')
            .map((c: { text?: string }) => c.text || '')
            .join('\n')
            .slice(0, 3000);

          if (pageText.length < 100) continue;

          const creator = await extractCreatorWithLLM(llmClient, {
            platform, region, category,
            url: item.url, handle,
            title: item.title || '',
            snippet: item.snippet || '',
            pageText,
          });

          if (creator) {
            seenHandles.add(handle);
            allCreators.push(creator);
            await storeCreator(supabase, creator);
            console.log(`LLM提取: ${creator.name} (${handle})`);

            if (jobId) {
              await supabase.from('scrape_jobs').update({
                scraped_count: allCreators.length,
              }).eq('id', jobId);
            }
          }
        } catch (e) {
          console.log(`抓取失败 ${item.url}:`, (e as Error).message);
          continue;
        }
      }
    } catch (e) {
      console.log(`搜索失败 "${query}":`, (e as Error).message);
      continue;
    }
  }

  if (jobId) {
    await supabase.from('scrape_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      scraped_count: allCreators.length,
    }).eq('id', jobId);
  }

  console.log(`抓取完成: 共 ${allCreators.length} 位创作者`);
  return { scraped: allCreators.length, creators: allCreators };
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
目标地区: ${REGION_MAP[context.region] || context.region}
目标品类: ${CATEGORY_MAP[context.category] || context.category}
页面URL: ${context.url}
页面标题: ${context.title}
搜索摘要: ${context.snippet}
页面内容(截取):
${context.pageText.slice(0, 2000)}

请提取以下信息并以JSON格式返回：
{
  "name": "创作者名称",
  "bio": "个人简介(50字内)",
  "followers": 粉丝数(数字，无法确定则根据内容推测量级，如10000, 50000, 100000等),
  "content_type": "mid_long/short/both",
  "languages": ["语言1", "语言2"],
  "categories": ["品类1", "品类2"],
  "contact_info": [{"type": "email/dm/website", "value": "联系方式", "reliability": "high/medium/low", "source": "来源"}],
  "is_valid": true/false,
  "confidence": 0-100
}

注意：
1. is_valid: 该页面是否确实是一个${REGION_MAP[context.region] || context.region}地区创作者的主页
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
    if (!parsed.is_valid || parsed.confidence < 30) return null;

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

export async function createScrapeJob(
  platform: string,
  category: string,
  region: string,
  targetCount: number
) {
  const supabase = getSupabaseClient();
  const regionName = REGION_MAP[region] || region;
  const categoryName = CATEGORY_MAP[category] || category;
  const query = `${platform} ${regionName} ${categoryName} 创作者`;

  const { data, error } = await supabase
    .from('scrape_jobs')
    .insert({
      platform,
      category,
      region,
      query,
      target_count: targetCount,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`创建任务失败: ${error.message}`);
  return data;
}

export async function getScrapeJobStatus(jobId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw new Error(`获取任务状态失败: ${error.message}`);
  return data;
}

async function storeCreator(
  supabase: ReturnType<typeof getSupabaseClient>,
  creator: ScrapedCreator
) {
  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('platform_handle', creator.platform_handle)
    .eq('platform', creator.platform)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('creators')
      .update({
        name: creator.name,
        followers: creator.followers,
        follower_tier: creator.follower_tier,
        bio: creator.bio,
        contact_info: creator.contact_info as unknown as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) console.error('更新创作者失败:', error.message);
  } else {
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
      });
    if (error) console.error('插入创作者失败:', error.message);
  }
}
