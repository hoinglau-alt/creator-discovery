import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockCreators } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const region = searchParams.get('region');
    const category = searchParams.get('category');
    const source = searchParams.get('source'); // 'db' or 'mock'

    // Try to read from database first
    if (source !== 'mock') {
      try {
        const supabase = getSupabaseClient();
        let query = supabase
          .from('creators')
          .select('*')
          .order('followers', { ascending: false })
          .limit(500);

        if (platform) {
          query = query.eq('platform', platform);
        }
        if (region) {
          query = query.eq('region', region);
        }

        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        // If we have data in DB, use it
        if (data && data.length > 0) {
          let creators = data.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            name: row.name as string,
            avatar: (row.avatar_url as string) || '',
            platform: row.platform as string,
            platformHandle: (row.platform_handle as string) || '',
            platformUrl: (row.platform_url as string) || '',
            region: row.region as string,
            categories: (row.categories as string[]) || [],
            followers: (row.followers as number) || 0,
            followerTier: (row.follower_tier as string) || '',
            contentType: (row.content_type as string) || 'both',
            contactInfo: (row.contact_info as Array<{ type: string; value: string; reliability: string; source: string }>) || [],
            outreachStatus: (row.outreach_status as string) || 'pending',
            languages: (row.languages as string[]) || [],
            bio: (row.bio as string) || '',
            joinedDate: (row.joined_date as string) || '',
            assignedTo: (row.assigned_to as string) || '未分配',
            sourceUrl: (row.source_url as string) || '',
            scrapedAt: (row.scraped_at as string) || '',
            evaluation: {
              contentStyleTags: (row.content_style_tags as string[]) || [],
              audienceProfile: (row.audience_profile as string) || '',
              growthTrend: (row.growth_trend as string) || 'stable',
              recommendation: (row.recommendation as string) || '',
              fitScore: (row.fit_score as number) || 5,
              cooperationWillingness: (row.cooperation_willingness as number) || 5,
            },
            growthData: [],
            recentVideos: [],
          }));

          // Filter by category if specified (JSONB array contains)
          if (category) {
            creators = creators.filter(c => c.categories.includes(category));
          }

          return NextResponse.json({
            success: true,
            data: creators,
            total: count || creators.length,
            source: 'database',
          });
        }
      } catch {
        // Fall through to mock data
      }
    }

    // Fall back to mock data
    let result = [...mockCreators];
    if (platform) {
      result = result.filter((c) => c.platform === platform);
    }
    if (region) {
      result = result.filter((c) => c.region === region);
    }
    if (category) {
      result = result.filter((c) => c.categories.includes(category as never));
    }

    return NextResponse.json({ success: true, data: result, total: result.length, source: 'mock' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
