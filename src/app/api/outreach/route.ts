import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, type Message } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { creatorName, platform, region, categories, followers, contentStyle, audienceProfile, messageType } = body;

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

  const systemPrompt = `你是一位B站港澳台达人运营专家，负责撰写邀请港澳台创作者入驻B站的邀约话术。
要求：
1. 语气亲切专业，体现对创作者的尊重和了解
2. 根据创作者的内容风格和受众特点进行个性化定制
3. 突出B站平台的优势和对创作者的价值
4. ${messageType === 'email' ? '使用正式邮件格式，包含称呼、正文、结尾' : '使用轻松但专业的私信格式，简洁有力'}
5. 直接输出话术内容，不要加任何解释或前缀`;

  const userPrompt = `请为以下创作者生成${messageType === 'email' ? '邮件' : '私信'}邀约话术：

创作者信息：
- 名称：${creatorName}
- 平台：${platform}
- 地区：${region}
- 内容品类：${catLabels}
- 粉丝数：${followers >= 10000 ? `${(followers / 10000).toFixed(1)}万` : followers}
- 内容风格：${styleLabels}
- 受众画像：${audienceProfile}

B站平台优势要点（可参考）：
- 年轻用户群体，18-35岁为主
- 中长视频生态完善，内容深度好
- 弹幕文化带来强互动体验
- 多元化的商业变现渠道
- 平台对港澳台创作者有专项扶持政策`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const stream = client.stream(messages, {
    model: 'doubao-seed-2-0-mini-260215',
    temperature: 0.8,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.content) {
            controller.enqueue(encoder.encode(chunk.content.toString()));
          }
        }
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
