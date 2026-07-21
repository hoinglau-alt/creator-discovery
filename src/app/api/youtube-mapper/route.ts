import { NextResponse } from 'next/server';
import { searchChannelsByRegion, getChannelDetails } from '@/lib/youtube-api';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { CATEGORY_KEYWORDS_YT, REGION_LANG_MAP } from '@/lib/constants';

function extractContactInfo(text: string): Array<{ type: string; value: string; reliability: string; source: string }> {
  const contacts: Array<{ type: string; value: string; reliability: string; source: string }> = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  const seen = new Set<string>();
  for (const email of emails) {
    const lower = email.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    contacts.push({ type: 'email', value: email, reliability: 'high', source: 'YouTube About' });
  }
  return contacts;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, region = 'hong_kong', maxResults = 15 } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: 'category is required' }, { status: 400 });
    }

    const keywords = CATEGORY_KEYWORDS_YT[category] || [category];
    const lang = REGION_LANG_MAP[region] || 'zh-Hant';
    const regionCode = region === 'taiwan' ? 'TW' : 'HK';

    const results: Array<{
      name: string;
      handle: string;
      url: string;
      subscribers: number;
      contactInfo: Array<{ type: string; value: string; reliability: string; source: string }>;
      bio: string;
      thumbnailUrl: string;
    }> = [];
    const seenChannelIds = new Set<string>();

    // Search for channels using multiple keywords
    for (const keyword of keywords.slice(0, 3)) {
      const query = `${keyword} ${lang} ${region === 'taiwan' ? '台灣' : region === 'macau' ? '澳門' : '香港'}`;

      try {
        const searchResults = await searchChannelsByRegion(query, regionCode, Math.ceil(maxResults / keywords.length));

        // Collect unique channel IDs
        const channelIds: string[] = [];
        for (const ch of searchResults) {
          if (!seenChannelIds.has(ch.channelId)) {
            seenChannelIds.add(ch.channelId);
            channelIds.push(ch.channelId);
          }
        }

        if (channelIds.length === 0) continue;

        // Batch fetch channel details
        const details = await getChannelDetails(channelIds);
        const detailsMap = new Map(details.map(d => [d.id, d]));

        for (const ch of searchResults) {
          const detail = detailsMap.get(ch.channelId);
          if (!detail) continue;

          const subscriberCount = detail.subscriberCount || 0;
          const description = detail.description || ch.description || '';
          const contactInfo = extractContactInfo(description);

          // Only include creators with contact info and reasonable subscriber count
          if (contactInfo.length > 0 && subscriberCount >= 1000) {
            const handle = detail.customUrl || `@${detail.title.replace(/\s+/g, '').toLowerCase()}`;
            const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;

            results.push({
              name: detail.title,
              handle: normalizedHandle,
              url: `https://youtube.com/${normalizedHandle}`,
              subscribers: subscriberCount,
              contactInfo,
              bio: description.slice(0, 500),
              thumbnailUrl: detail.thumbnailUrl || ch.thumbnailUrl || '',
            });
          }

          if (results.length >= maxResults) break;
        }
      } catch (err) {
        console.error(`Search failed for keyword "${keyword}":`, err);
      }

      if (results.length >= maxResults) break;
    }

    // Store in database - SKIP FOR NOW, just return results
    const stored: string[] = [];
    const skipped: string[] = [];

    // TODO: Re-enable database storage after testing
    /*
    if (results.length > 0) {
      try {
        const supabase = getSupabaseClient();

        for (const r of results) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('creators')
            .select('id')
            .eq('platform_handle', r.handle)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped.push(r.handle);
            continue;
          }

          const followerTier =
            r.subscribers >= 1000000 ? '100w+' :
            r.subscribers >= 500000 ? '50-100w' :
            r.subscribers >= 100000 ? '10-50w' : '1-10w';

          const { error } = await supabase
            .from('creators')
            .insert([{
              name: r.name,
              avatar: r.thumbnailUrl,
              platform: 'youtube',
              platform_handle: r.handle,
              platform_url: r.url,
              region,
              categories: [category],
              followers: r.subscribers,
              follower_tier: followerTier,
              content_type: 'mid_long',
              languages: [lang === 'zh-Hant' ? '繁体中文' : lang === 'yue' ? '粤语' : '国语'],
              bio: r.bio,
              contact_info: r.contactInfo,
              outreach_status: 'pending',
            }]);

          if (!error) {
            stored.push(r.handle);
          } else {
            console.error('Failed to insert creator:', r.handle, error);
            skipped.push(r.handle);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB fails - return results anyway
      }
    }
    */

    return NextResponse.json({
      success: true,
      data: {
        total: results.length,
        stored: 0,
        skipped: 0,
        creators: results.map(r => ({
          name: r.name,
          handle: r.handle,
          subscribers: r.subscribers,
          contacts: r.contactInfo.map(c => c.value),
          stored: false,
        })),
      },
    });
  } catch (error) {
    console.error('YouTube Mapping API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
