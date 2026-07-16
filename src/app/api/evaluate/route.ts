import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, type Message } from 'coze-coding-dev-sdk';
import { mockCreators } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  const body = await request.json();
  let { creatorId, creatorName, platform, region, categories, followers, contentStyle } = body;

  // If creatorId is provided, look up from mock data
  if (creatorId && !creatorName) {
    const creator = mockCreators.find((c) => c.id === creatorId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }
    creatorName = creator.name;
    platform = creator.platform;
    region = creator.region;
    categories = creator.categories;
    followers = creator.followers;
    contentStyle = creator.evaluation.contentStyleTags;
  }

  if (!creatorName || !categories) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const categoryLabels: Record<string, string> = {
    tech: '科技数码', food: '美食', lifestyle: '生活日常', gaming: '游戏',
    beauty: '美妆时尚', music: '音乐', education: '知识科普', comedy: '搞笑幽默',
    entertainment: '影视娱乐', anime: '动漫二次元', fitness: '运动健身', travel: '旅行',
    pets: '宠物', automotive: '汽车', finance: '财经商业', photography: '摄影',
    diy: '手工DIY', dance: '舞蹈', parenting: '亲子育儿', home: '家居装修',
  };

  const catLabels = (categories as string[]).map((c: string) => categoryLabels[c] || c).join('、');
  const styleLabels = (contentStyle as string[]).join('、');

  const systemPrompt = `你是一位专业的内容分析师，负责评估港澳台创作者入驻B站的适配度。
请严格按照以下JSON格式输出评估结果，不要输出任何其他内容：
{
  "fitScore": 1-10的整数,
  "cooperationWillingness": 1-10的整数,
  "contentStyleTags": ["标签1", "标签2", "标签3"],
  "audienceProfile": "受众画像描述",
  "growthTrend": "rising/stable/declining",
  "recommendation": "一句话推荐理由"
}`;

  const userPrompt = `请评估以下创作者入驻B站的适配度：
- 名称：${creatorName}
- 平台：${platform}
- 地区：${region}
- 品类：${catLabels}
- 粉丝数：${followers}
- 内容风格：${styleLabels}`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.3,
    });

    return NextResponse.json({ success: true, data: response.content });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ success: false, error: 'Evaluation failed' }, { status: 500 });
  }
}
