#!/usr/bin/env node
/**
 * YouTube Creator Mapper
 * 直接调用 YouTube Data API v3，批量抓取港澳台创作者
 * 用法：node youtube-mapper.js
 */

const YOUTUBE_API_KEY = 'AIzaSyCRSa1RfVbrilpoXkNVsGAlIglluW4erI';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// 品类映射到搜索关键词
const CATEGORY_KEYWORDS = {
  tech: ['科技评测', 'tech review', 'gadgets', '手機評測', '科技開箱'],
  food: ['美食探店', 'food vlog', 'cooking', '澳門美食', '台灣小吃', '香港美食'],
  lifestyle: ['生活Vlog', 'daily vlog', 'lifestyle', '香港生活', '台灣日常'],
  gaming: ['遊戲實況', 'gaming', 'game review', '電競', '主機遊戲'],
  beauty: ['美妝教程', 'makeup tutorial', 'skincare', '彩妝', '護膚'],
  music: ['音樂翻唱', 'cover song', 'original music', '香港歌手', '台灣音樂'],
  education: ['知識科普', 'science', 'education', '科普', '教學'],
  comedy: ['搞笑', 'comedy', 'funny', '短劇', '街頭實驗'],
  entertainment: ['影視評論', 'movie review', 'entertainment', '電影解說'],
  anime: ['動漫', 'anime', 'cosplay', '二次元', '漫畫', 'ACG'],
  sports: ['健身', 'fitness', 'workout', '訓練', '運動'],
  travel: ['旅遊攻略', 'travel vlog', '旅行', '台灣旅遊', '香港打卡'],
  pets: ['寵物', 'pets', 'cats', 'dogs', '貓咪', '狗狗'],
  auto: ['汽車評測', 'car review', '试驾', '車評'],
  finance: ['財經', 'finance', '投資', '理財', '股市', '加密貨幣'],
  photography: ['攝影', 'photography', '相機評測', '拍照技巧'],
  diy: ['手工DIY', 'DIY', 'craft', '手工製作', '創意'],
  dance: ['舞蹈', 'dance', 'choreography', '編舞', '街舞'],
  parenting: ['親子', 'parenting', '育兒', '親子活動'],
  home: ['家居裝修', 'home decor', '室內設計', '裝修', '家居'],
};

const REGIONS = [
  { code: 'HK', name: 'hong_kong', label: '香港' },
  { code: 'TW', name: 'taiwan', label: '台湾' },
  { code: 'MO', name: 'macau', label: '澳门' },
];

async function youtubeGet(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API ${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function searchChannels(query, regionCode, maxResults = 25) {
  const data = await youtubeGet('search', {
    part: 'snippet',
    type: 'channel',
    q: query,
    regionCode,
    maxResults: String(maxResults),
    order: 'relevance',
  });
  return data.items || [];
}

async function getChannelDetails(channelIds) {
  if (!channelIds.length) return [];
  const data = await youtubeGet('channels', {
    part: 'snippet,contentDetails,statistics',
    id: channelIds.join(','),
  });
  return data.items || [];
}

function extractContactInfo(description, channelTitle) {
  const contacts = [];
  if (!description) return contacts;

  // Email patterns
  const emailPatterns = [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  ];
  
  for (const pattern of emailPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      for (const email of matches) {
        const lower = email.toLowerCase();
        if (!lower.includes('example') && !lower.includes('test')) {
          contacts.push({
            type: 'email',
            value: email,
            reliability: 'high',
            source: 'YouTube About',
          });
        }
      }
    }
  }

  // Social media handles
  const socialPatterns = [
    { type: 'instagram', regex: /(?:instagram\.com\/|@)([a-zA-Z0-9._]+)/i },
    { type: 'twitter', regex: /(?:twitter\.com\/|x\.com\/|@)([a-zA-Z0-9_]+)/i },
    { type: 'tiktok', regex: /tiktok\.com\/@([a-zA-Z0-9._]+)/i },
  ];

  for (const { type, regex } of socialPatterns) {
    const match = description.match(regex);
    if (match) {
      contacts.push({
        type,
        value: `@${match[1]}`,
        reliability: 'medium',
        source: 'YouTube About',
      });
    }
  }

  return contacts;
}

async function upsertCreator(creator) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log(`  [skip] No Supabase config, creator: ${creator.name}`);
    return;
  }

  const { data: existing } = await fetch(
    `${SUPABASE_URL}/rest/v1/creators?platform_handle=eq.${creator.platformHandle}`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  ).then(r => r.json());

  if (existing && existing.length > 0) {
    console.log(`  [dup] ${creator.name} already exists`);
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/creators`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(creator),
  });

  if (res.ok) {
    console.log(`  [ok] ${creator.name} (${creator.followers?.toLocaleString()} subs)`);
  } else {
    const err = await res.text();
    console.log(`  [err] ${creator.name}: ${err}`);
  }
}

async function processCategory(category, region, targetCount = 50) {
  const keywords = CATEGORY_KEYWORDS[category] || [category];
  const regionInfo = REGIONS.find(r => r.name === region) || REGIONS[0];
  const foundChannels = new Map();

  console.log(`\n📡 ${regionInfo.label} / ${category} (target: ${targetCount})`);

  // Search with multiple keywords
  for (const keyword of keywords) {
    if (foundChannels.size >= targetCount) break;

    try {
      const results = await searchChannels(keyword, regionInfo.code, 25);
      console.log(`  🔍 "${keyword}" → ${results.length} results`);

      for (const item of results) {
        if (foundChannels.size >= targetCount) break;
        foundChannels.set(item.snippet.channelId, item);
      }
    } catch (err) {
      console.log(`  ⚠️ Search failed: ${err.message}`);
    }
  }

  if (foundChannels.size === 0) {
    console.log('  No channels found');
    return { searched: 0, stored: 0 };
  }

  // Get detailed channel info
  const channelIds = Array.from(foundChannels.keys());
  let stored = 0;

  // Process in batches of 50
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);
    const details = await getChannelDetails(batch);

    for (const ch of details) {
      const subs = parseInt(ch.statistics?.subscriberCount || '0');
      if (subs < 1000) continue; // Skip very small channels

      const contactInfo = extractContactInfo(ch.snippet.description, ch.snippet.title);
      
      // Only store if has contact info
      if (contactInfo.length === 0) continue;

      const handle = ch.snippet.customUrl || `@${ch.snippet.title.toLowerCase().replace(/\s+/g, '')}`;

      const creator = {
        name: ch.snippet.title,
        platform: 'youtube',
        platform_handle: handle,
        platform_url: `https://youtube.com/${handle}`,
        avatar_url: ch.snippet.thumbnails?.medium?.url || '',
        region: regionInfo.name,
        categories: [category],
        followers: subs,
        follower_tier: subs >= 1000000 ? '100w+' : subs >= 500000 ? '50-100w' : subs >= 100000 ? '10-50w' : '1-10w',
        content_type: 'mid_long',
        languages: regionInfo.code === 'TW' ? ['国语'] : ['粤语', '英语'],
        bio: ch.snippet.description?.substring(0, 500) || '',
        contact_info: JSON.stringify(contactInfo),
        outreach_status: 'pending',
        fit_score: Math.min(10, Math.floor(subs / 100000) + 5),
        cooperation_willingness: 7,
        content_style_tags: [category],
        audience_profile: `${regionInfo.label}观众`,
        growth_trend: 'stable',
        recommendation: `${regionInfo.label}${category}领域创作者，${subs.toLocaleString()}订阅`,
      };

      await upsertCreator(creator);
      stored++;
    }
  }

  return { searched: foundChannels.size, stored };
}

async function main() {
  console.log(' YouTube Creator Mapper');
  console.log(`📡 API Key: ${YOUTUBE_API_KEY.substring(0, 10)}...`);
  console.log(`💾 Supabase: ${SUPABASE_URL ? 'configured' : 'NOT configured (will only display results)'}`);
  console.log('─'.repeat(50));

  // Check API quota
  try {
    const test = await youtubeGet('search', { part: 'snippet', q: 'test', maxResults: '1' });
    console.log(`✅ YouTube API connected! (quota remaining check passed)`);
  } catch (err) {
    console.error(`❌ YouTube API failed: ${err.message}`);
    process.exit(1);
  }

  // Default: scan all categories for Hong Kong and Taiwan
  const categories = Object.keys(CATEGORY_KEYWORDS);
  const regions = ['hong_kong', 'taiwan', 'macau'];
  
  let totalSearched = 0;
  let totalStored = 0;

  for (const region of regions) {
    for (const category of categories) {
      const result = await processCategory(category, region, 30);
      totalSearched += result.searched;
      totalStored += result.stored;
      
      // Rate limiting: YouTube API allows 10,000 units/day
      // Each search = 100 units, each channel details = 1 unit
      // Be conservative
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Done! Searched: ${totalSearched}, Stored: ${totalStored}`);
  console.log(`📊 YouTube API quota: ~${Math.floor((totalSearched * 100 + totalStored) / 10000 * 100)}% used`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
