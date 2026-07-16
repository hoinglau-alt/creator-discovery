import type { Creator } from './types';

const styleTags: Record<string, string[]> = {
  tech: ['硬核测评', '开箱体验', '技术解析', '极客风', '干货满满'],
  food: ['探店达人', '家常菜教学', '街头美食', '精致摆盘', '地域特色'],
  lifestyle: ['日常Vlog', '极简生活', '城市漫步', '治愈系', '慢节奏'],
  gaming: ['实况解说', '攻略教学', '独立游戏', '电竞选手', '搞笑游戏'],
  beauty: ['妆容教程', '穿搭分享', '护肤心得', '平价好物', '高端测评'],
  music: ['翻唱', '原创音乐', '乐器演奏', '音乐制作', '街头表演'],
  education: ['科普动画', '知识分享', '历史解读', '英语学习', '财经科普'],
  comedy: ['段子手', '情景剧', '吐槽', '模仿秀', '即兴表演'],
  entertainment: ['影评', '综艺解说', '明星八卦', '追剧日记', '混剪'],
  anime: ['Cosplay', '手办收藏', '番剧推荐', '同人创作', '二次元文化'],
  fitness: ['健身教学', '瑜伽', '减脂餐', '户外跑步', '体态矫正'],
  travel: ['背包客', '美食旅行', '深度游', '穷游攻略', '酒店测评'],
  pets: ['萌宠日常', '宠物训练', '猫咪', '狗狗', '异宠'],
  automotive: ['新车测评', '改装', '驾驶技巧', '电动车', '经典车修复'],
  finance: ['投资理财', '创业故事', '商业分析', '房产', '消费观'],
  photography: ['风光摄影', '人像写真', '手机摄影', '后期教程', '胶片'],
  diy: ['木工', '手工皮具', '改造翻新', '模型制作', '创意手工'],
  dance: ['街舞', 'K-pop翻跳', '编舞', '国标舞', '舞蹈教学'],
  parenting: ['育儿经验', '亲子活动', '早教', '母婴测评', '家庭教育的'],
  home: ['装修记录', '收纳整理', '家居好物', '软装搭配', '小户型'],
};

function generateGrowthData(base: number, trend: 'rising' | 'stable' | 'declining') {
  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
  const multiplier = trend === 'rising' ? 1.08 : trend === 'stable' ? 1.01 : 0.97;
  let current = base / Math.pow(multiplier, 12);
  return months.map((month) => {
    current *= multiplier + (Math.random() * 0.04 - 0.02);
    return { month, followers: Math.round(current) };
  });
}

function generateRecentVideos(category: string, platform: string) {
  const titles: Record<string, string[]> = {
    tech: ['M4 MacBook Pro 深度体验', '2025年最值得买的手机', '智能家居全屋改造', 'AI工具大测评'],
    food: ['台北夜市必吃TOP10', '港式茶餐厅在家做', '澳门葡挞秘方公开', '10分钟快手料理'],
    lifestyle: ['我在香港的一天', '台北咖啡地图', '澳门小众打卡点', '独居生活日常'],
    gaming: ['黑神话悟空全BOSS攻略', '独立游戏推荐2025', 'Switch2首发体验', '电竞比赛精彩集锦'],
    beauty: ['夏日清透妆容教程', '平价护肤好物分享', '春夏穿搭灵感', '韩国美妆开箱'],
    music: ['周杰伦歌曲吉他翻弹', '原创单曲MV首发', '街头音乐盒ep.12', '录音室幕后花絮'],
    education: ['5分钟搞懂量子计算', '台湾历史冷知识', '经济学入门系列', '英语发音纠正'],
    comedy: ['当台湾人第一次去香港', '办公室搞笑日常', '模仿台湾综艺名场面', '街头随机采访'],
    entertainment: ['2025港剧推荐', '韩剧vs台剧对比', '电影深度解析', '综艺名场面合集'],
    anime: ['漫画博览会战利品', 'Cosplay制作过程', '新番推荐2025春', '手办开箱'],
    fitness: ['居家健身30天挑战', '正确深蹲姿势教学', '减脂餐一周食谱', '晨跑vlog'],
    travel: ['花莲3天2夜攻略', '香港离岛探秘', '澳门世界遗产之旅', '日本vs台湾便利店'],
    pets: ['猫咪日常ep.50', '狗狗训练技巧', '领养代替购买', '宠物用品测评'],
    automotive: ['Tesla Model Y长测', '经典车修复日记', '台湾山路驾驶', '电动车充电体验'],
    finance: ['台股投资入门', '年轻人理财规划', '房市分析2025', '副业收入公开'],
    photography: ['台湾最美秘境', '手机摄影技巧', '底片相机推荐', '人像摄影布光'],
    diy: ['旧家具改造', '手工皮革钱包', '木工入门教程', '模型涂装技巧'],
    dance: ['K-pop随机舞蹈', '编舞作品首发', '街舞battle', '舞蹈教学基础'],
    parenting: ['二胎家庭日常', '亲子烹饪', '幼小衔接经验', '绘本推荐'],
    home: ['30平小户型改造', '收纳神器测评', '北欧风软装', '厨房收纳技巧'],
  };
  const list = titles[category] || titles.lifestyle;
  return list.slice(0, 4).map((title, i) => ({
    title,
    views: Math.floor(Math.random() * 500000) + 10000,
    date: `2025-0${Math.min(6, Math.floor(Math.random() * 6) + 1)}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  }));
}

const creatorTemplates: Omit<Creator, 'id' | 'evaluation' | 'growthData' | 'recentVideos'>[] = [
  // YouTube - Hong Kong
  { name: '科技王國', avatar: '', platform: 'youtube', platformHandle: '@techkingdom_hk', region: 'hong_kong', categories: ['tech'], followers: 850000, followerTier: '50-100w', contentType: 'mid_long', contactInfo: [{ type: 'email', value: 'business@techkingdom.hk', reliability: 'high', source: 'YouTube About' }], outreachStatus: 'negotiating', languages: ['粤语', '英语'], joinedDate: '2019-03', assignedTo: '张伟' },
  { name: '香港美食探險隊', avatar: '', platform: 'youtube', platformHandle: '@hkfoodadventure', region: 'hong_kong', categories: ['food', 'travel'], followers: 1200000, followerTier: '100w+', contentType: 'mid_long', contactInfo: [{ type: 'email', value: 'collab@hkfoodadventure.com', reliability: 'high', source: 'YouTube About' }, { type: 'website', value: 'hkfoodadventure.com', reliability: 'medium', source: 'Bio link' }], outreachStatus: 'contacted', languages: ['粤语', '普通话'], joinedDate: '2017-08', assignedTo: '李婷' },
  { name: 'Lifestyle with Winnie', avatar: '', platform: 'youtube', platformHandle: '@lifestylewinnie', region: 'hong_kong', categories: ['lifestyle', 'beauty'], followers: 320000, followerTier: '10-50w', contentType: 'both', contactInfo: [{ type: 'email', value: 'winnie@creativehk.com', reliability: 'high', source: 'YouTube About' }], outreachStatus: 'pending', languages: ['粤语', '英语', '普通话'], joinedDate: '2020-01', assignedTo: '未分配' },
  { name: '遊戲宅HK', avatar: '', platform: 'youtube', platformHandle: '@gamergeekhk', region: 'hong_kong', categories: ['gaming', 'tech'], followers: 560000, followerTier: '50-100w', contentType: 'mid_long', contactInfo: [{ type: 'dm', value: 'YouTube DM', reliability: 'low', source: 'Platform DM' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2018-06', assignedTo: '王磊' },
  // YouTube - Taiwan
  { name: '阿哲的知識頻道', avatar: '', platform: 'youtube', platformHandle: '@azheknowledge', region: 'taiwan', categories: ['education'], followers: 2100000, followerTier: '100w+', contentType: 'mid_long', contactInfo: [{ type: 'email', value: 'azhe@knowledge.tw', reliability: 'high', source: 'YouTube About' }], outreachStatus: 'replied', languages: ['普通话', '闽南语'], joinedDate: '2016-11', assignedTo: '陈思' },
  { name: 'Music Corner TW', avatar: '', platform: 'youtube', platformHandle: '@musiccornertw', region: 'taiwan', categories: ['music'], followers: 450000, followerTier: '10-50w', contentType: 'mid_long', contactInfo: [{ type: 'email', value: 'booking@musiccorner.tw', reliability: 'high', source: 'YouTube About' }, { type: 'website', value: 'musiccorner.tw', reliability: 'medium', source: 'Bio link' }], outreachStatus: 'pending', languages: ['普通话', '英语'], joinedDate: '2019-09', assignedTo: '未分配' },
  { name: '搞笑日常日記', avatar: '', platform: 'youtube', platformHandle: '@funnydiarytw', region: 'taiwan', categories: ['comedy', 'lifestyle'], followers: 780000, followerTier: '50-100w', contentType: 'both', contactInfo: [{ type: 'email', value: 'business@funnydiary.tw', reliability: 'high', source: 'YouTube About' }], outreachStatus: 'onboarded', languages: ['普通话'], joinedDate: '2018-02', assignedTo: '张伟' },
  // YouTube - Macau
  { name: '澳門小食光', avatar: '', platform: 'youtube', platformHandle: '@macaufoodtime', region: 'macau', categories: ['food', 'travel'], followers: 180000, followerTier: '10-50w', contentType: 'mid_long', contactInfo: [{ type: 'email', value: 'macaufoodtime@gmail.com', reliability: 'medium', source: 'YouTube About' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2021-04', assignedTo: '未分配' },

  // Instagram - Hong Kong
  { name: 'Photography by Kay', avatar: '', platform: 'instagram', platformHandle: '@kayphoto.hk', region: 'hong_kong', categories: ['photography', 'travel'], followers: 95000, followerTier: '1-10w', contentType: 'short', contactInfo: [{ type: 'email', value: 'kay@photography.hk', reliability: 'high', source: 'Instagram Bio' }], outreachStatus: 'pending', languages: ['粤语', '英语'], joinedDate: '2020-05', assignedTo: '未分配' },
  { name: 'Fitness Queen HK', avatar: '', platform: 'instagram', platformHandle: '@fitnessqueen_hk', region: 'hong_kong', categories: ['fitness', 'lifestyle'], followers: 230000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'dm', value: 'Instagram DM', reliability: 'low', source: 'Platform DM' }, { type: 'email', value: 'fitqueen.hk@gmail.com', reliability: 'medium', source: 'Bio link' }], outreachStatus: 'contacted', languages: ['粤语', '英语', '普通话'], joinedDate: '2019-11', assignedTo: '李婷' },
  // Instagram - Taiwan
  { name: 'Dance with Me TW', avatar: '', platform: 'instagram', platformHandle: '@dancewithme.tw', region: 'taiwan', categories: ['dance', 'fitness'], followers: 150000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'dance@twstudio.com', reliability: 'high', source: 'Instagram Bio' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2021-03', assignedTo: '未分配' },
  { name: '家居改造王', avatar: '', platform: 'instagram', platformHandle: '@home_makeover_tw', region: 'taiwan', categories: ['home', 'diy'], followers: 420000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'homemakeover.tw@gmail.com', reliability: 'medium', source: 'Instagram Bio' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2020-07', assignedTo: '王磊' },

  // TikTok - Hong Kong
  { name: 'DanceKing HK', avatar: '', platform: 'tiktok', platformHandle: '@danceking.hk', region: 'hong_kong', categories: ['dance', 'comedy'], followers: 1500000, followerTier: '100w+', contentType: 'short', contactInfo: [{ type: 'email', value: 'mgmt@danceking.hk', reliability: 'high', source: 'TikTok Bio' }], outreachStatus: 'replied', languages: ['粤语', '英语'], joinedDate: '2020-02', assignedTo: '张伟' },
  { name: '寵物日常HK', avatar: '', platform: 'tiktok', platformHandle: '@petdailyhk', region: 'hong_kong', categories: ['pets', 'lifestyle'], followers: 680000, followerTier: '50-100w', contentType: 'short', contactInfo: [{ type: 'dm', value: 'TikTok DM', reliability: 'low', source: 'Platform DM' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2021-01', assignedTo: '未分配' },
  // TikTok - Taiwan
  { name: '美食獵人小美', avatar: '', platform: 'tiktok', platformHandle: '@foodhunterxm', region: 'taiwan', categories: ['food'], followers: 920000, followerTier: '50-100w', contentType: 'short', contactInfo: [{ type: 'email', value: 'xiaomei@foodhunter.tw', reliability: 'high', source: 'TikTok Bio' }], outreachStatus: 'negotiating', languages: ['普通话', '闽南语'], joinedDate: '2019-08', assignedTo: '陈思' },
  { name: 'DIY創意工坊', avatar: '', platform: 'tiktok', platformHandle: '@diyworkshop_tw', region: 'taiwan', categories: ['diy', 'tech'], followers: 350000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'diy@workshop.tw', reliability: 'high', source: 'TikTok Bio' }, { type: 'website', value: 'diyworkshop.tw', reliability: 'medium', source: 'Bio link' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2020-11', assignedTo: '未分配' },

  // X (Twitter) - Hong Kong
  { name: '財經觀察HK', avatar: '', platform: 'x', platformHandle: '@financewatch_hk', region: 'hong_kong', categories: ['finance', 'education'], followers: 280000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'financewatch@hk.com', reliability: 'high', source: 'X Bio' }], outreachStatus: 'pending', languages: ['粤语', '英语', '普通话'], joinedDate: '2018-04', assignedTo: '李婷' },
  { name: 'Anime Culture TW', avatar: '', platform: 'x', platformHandle: '@animeculture_tw', region: 'taiwan', categories: ['anime', 'entertainment'], followers: 190000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'dm', value: 'X DM', reliability: 'low', source: 'Platform DM' }], outreachStatus: 'pending', languages: ['普通话', '日语'], joinedDate: '2019-07', assignedTo: '未分配' },
  // X - Taiwan
  { name: '汽車評論家', avatar: '', platform: 'x', platformHandle: '@carcritic_tw', region: 'taiwan', categories: ['automotive', 'tech'], followers: 120000, followerTier: '10-50w', contentType: 'both', contactInfo: [{ type: 'email', value: 'carcritic.tw@gmail.com', reliability: 'medium', source: 'X Bio' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2020-09', assignedTo: '王磊' },

  // 抖音 - Hong Kong
  { name: '港式生活館', avatar: '', platform: 'douyin', platformHandle: 'hk_life_gallery', region: 'hong_kong', categories: ['lifestyle', 'food'], followers: 450000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'hklife@gallery.com', reliability: 'high', source: '抖音主页' }], outreachStatus: 'contacted', languages: ['粤语', '普通话'], joinedDate: '2021-06', assignedTo: '张伟' },
  { name: '美妝小課堂HK', avatar: '', platform: 'douyin', platformHandle: 'beauty_class_hk', region: 'hong_kong', categories: ['beauty', 'lifestyle'], followers: 780000, followerTier: '50-100w', contentType: 'short', contactInfo: [{ type: 'email', value: 'beautyclass@hk.com', reliability: 'high', source: '抖音主页' }, { type: 'website', value: 'beautyclasshk.com', reliability: 'medium', source: '主页链接' }], outreachStatus: 'replied', languages: ['粤语', '普通话'], joinedDate: '2020-03', assignedTo: '李婷' },
  // 抖音 - Taiwan
  { name: '台灣吃貨日記', avatar: '', platform: 'douyin', platformHandle: 'tw_foodie_diary', region: 'taiwan', categories: ['food', 'travel'], followers: 1100000, followerTier: '100w+', contentType: 'short', contactInfo: [{ type: 'email', value: 'twfoodie@diary.com', reliability: 'high', source: '抖音主页' }], outreachStatus: 'pending', languages: ['普通话', '闽南语'], joinedDate: '2019-12', assignedTo: '陈思' },
  { name: '親子樂園TW', avatar: '', platform: 'douyin', platformHandle: 'family_fun_tw', region: 'taiwan', categories: ['parenting', 'lifestyle'], followers: 320000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'dm', value: '抖音私信', reliability: 'low', source: '平台私信' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2021-09', assignedTo: '未分配' },
  // 抖音 - Macau
  { name: '澳門旅遊指南', avatar: '', platform: 'douyin', platformHandle: 'macau_travel_guide', region: 'macau', categories: ['travel', 'food'], followers: 560000, followerTier: '50-100w', contentType: 'short', contactInfo: [{ type: 'email', value: 'macau@travelguide.com', reliability: 'high', source: '抖音主页' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2020-08', assignedTo: '未分配' },

  // 小红书 - Hong Kong
  { name: 'HK穿搭手記', avatar: '', platform: 'xiaohongshu', platformHandle: 'hk_fashion_notes', region: 'hong_kong', categories: ['beauty', 'lifestyle'], followers: 280000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'hkfashion@notes.com', reliability: 'high', source: '小红书简介' }], outreachStatus: 'pending', languages: ['粤语', '普通话', '英语'], joinedDate: '2021-02', assignedTo: '李婷' },
  { name: '收納達人HK', avatar: '', platform: 'xiaohongshu', platformHandle: 'organize_hk', region: 'hong_kong', categories: ['home', 'lifestyle'], followers: 150000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'dm', value: '小红书私信', reliability: 'low', source: '平台私信' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2022-01', assignedTo: '未分配' },
  // 小红书 - Taiwan
  { name: '台北咖啡控', avatar: '', platform: 'xiaohongshu', platformHandle: 'taipei_coffee_lover', region: 'taiwan', categories: ['food', 'lifestyle'], followers: 190000, followerTier: '10-50w', contentType: 'short', contactInfo: [{ type: 'email', value: 'taipeicoffee@lover.com', reliability: 'medium', source: '小红书简介' }], outreachStatus: 'contacted', languages: ['普通话'], joinedDate: '2021-07', assignedTo: '王磊' },
  { name: '手工藝生活', avatar: '', platform: 'xiaohongshu', platformHandle: 'handcraft_life_tw', region: 'taiwan', categories: ['diy', 'home'], followers: 85000, followerTier: '1-10w', contentType: 'short', contactInfo: [{ type: 'email', value: 'handcraft@life.tw', reliability: 'high', source: '小红书简介' }, { type: 'website', value: 'handcraftlife.tw', reliability: 'medium', source: '简介链接' }], outreachStatus: 'pending', languages: ['普通话'], joinedDate: '2022-03', assignedTo: '未分配' },
  // 小红书 - Macau
  { name: '澳門慢生活', avatar: '', platform: 'xiaohongshu', platformHandle: 'macau_slow_life', region: 'macau', categories: ['travel', 'photography'], followers: 62000, followerTier: '1-10w', contentType: 'short', contactInfo: [{ type: 'email', value: 'macau.slow@gmail.com', reliability: 'medium', source: '小红书简介' }], outreachStatus: 'pending', languages: ['粤语', '普通话'], joinedDate: '2022-06', assignedTo: '未分配' },
];

const recommendations: string[] = [
  '内容质量高，粉丝粘性强，适合B站知识区发展',
  '风格独特，与B站调性高度匹配，建议优先联系',
  '增长势头强劲，早期入驻可获得平台流量扶持',
  '内容可翻译性强，适合B站国际化内容布局',
  '粉丝画像与B站核心用户高度重合',
  '内容差异化明显，能填补B站该品类空白',
  '已有跨平台运营经验，入驻B站适应成本低',
  '互动率高，粉丝活跃，适合B站社区氛围',
  '内容深度好，适合B站中长视频生态',
  '个人品牌辨识度高，有助于B站品类破圈',
];

const frequencies = ['每周2-3更', '每周1更', '每两周1更', '每月2-3更', '几乎日更', '不定期更新'];

function getFitScore(followers: number, category: string): number {
  const base = followers > 1000000 ? 7 : followers > 500000 ? 6 : followers > 100000 ? 5 : 4;
  const bonus = ['tech', 'gaming', 'anime', 'education', 'food'].includes(category) ? 2 : 1;
  return Math.min(10, base + bonus + Math.floor(Math.random() * 2));
}

export function generateMockCreators(): Creator[] {
  return creatorTemplates.map((template, index) => {
    const mainCategory = template.categories[0];
    const tags = styleTags[mainCategory] || styleTags.lifestyle;
    const selectedTags = tags.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));
    const trend = Math.random() > 0.3 ? 'rising' : Math.random() > 0.5 ? 'stable' : 'declining';
    const fitScore = getFitScore(template.followers, mainCategory);

    return {
      ...template,
      id: `creator-${String(index + 1).padStart(3, '0')}`,
      evaluation: {
        contentStyleTags: selectedTags,
        audienceProfile: `18-35岁${mainCategory === 'tech' ? '科技爱好者' : mainCategory === 'food' ? '美食爱好者' : '年轻用户'}为主，港澳台占比${60 + Math.floor(Math.random() * 30)}%`,
        updateFrequency: frequencies[Math.floor(Math.random() * frequencies.length)],
        growthTrend: trend,
        fitScore,
        cooperationWillingness: Math.min(10, Math.floor(Math.random() * 4) + 5),
        recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
      },
      growthData: generateGrowthData(template.followers, trend),
      recentVideos: generateRecentVideos(mainCategory, template.platform),
    };
  });
}

export const mockCreators: Creator[] = generateMockCreators();
