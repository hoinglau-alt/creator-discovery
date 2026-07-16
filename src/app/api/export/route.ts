import { NextRequest, NextResponse } from 'next/server';
import type { Creator } from '@/lib/types';
import { PLATFORMS, CATEGORIES, REGIONS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { creators, format } = await request.json() as { creators: Creator[]; format: 'csv' | 'excel' };

    if (!creators || !Array.isArray(creators)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Get platform/category/region labels
    const getPlatformLabel = (val: string) => PLATFORMS.find((p) => p.value === val)?.label || val;
    const getCategoryLabels = (vals: string[]) =>
      vals.map((v) => CATEGORIES.find((c) => c.value === v)?.label || v).join('、');
    const getRegionLabel = (val: string) => REGIONS.find((r) => r.value === val)?.label || val;

    // Build CSV content
    const headers = [
      'ID', '名称', '平台', '平台账号', '地区', '品类', '粉丝数', '粉丝量级',
      '内容类型', '适配度评分', '合作意愿', '外联状态', '负责人',
      '内容风格', '受众画像', '推荐理由', '联系邮箱', '联系方式'
    ];

    const rows = creators.map((c) => [
      c.id,
      c.name,
      getPlatformLabel(c.platform),
      c.platformHandle,
      getRegionLabel(c.region),
      getCategoryLabels(c.categories),
      c.followers.toString(),
      c.followerTier,
      c.contentType === 'mid_long' ? '中长视频' : c.contentType === 'short' ? '短视频' : '两者皆可',
      c.evaluation.fitScore.toString(),
      c.evaluation.cooperationWillingness.toString(),
      c.outreachStatus === 'pending' ? '待联系' :
        c.outreachStatus === 'contacted' ? '已联系' :
        c.outreachStatus === 'replied' ? '已回复' :
        c.outreachStatus === 'negotiating' ? '谈判中' : '已入驻',
      c.assignedTo || '',
      c.evaluation.contentStyleTags.join('、'),
      c.evaluation.audienceProfile,
      c.evaluation.recommendation,
      c.contactInfo.find((ci) => ci.type === 'email')?.value || '',
      c.contactInfo.map((ci) => `${ci.type}:${ci.value}`).join('; '),
    ]);

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csvContent = bom + [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    if (format === 'excel') {
      // For Excel, we return the CSV with .xlsx extension hint
      // In production, you'd use a library like exceljs
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="creators_export_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="creators_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
