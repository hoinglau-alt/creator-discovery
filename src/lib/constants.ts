import type { Platform, Region, Category } from './types';

export const PLATFORMS: { value: Platform; label: string; icon: string; color: string }[] = [
  { value: 'youtube', label: 'YouTube', icon: 'Youtube', color: '#FF0000' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram', color: '#E4405F' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music2', color: '#000000' },
  { value: 'x', label: 'X (Twitter)', icon: 'Twitter', color: '#1DA1F2' },
  { value: 'douyin', label: '抖音', icon: 'Video', color: '#161823' },
  { value: 'xiaohongshu', label: '小红书', icon: 'BookOpen', color: '#FE2C55' },
];

export const REGIONS: { value: Region; label: string; flag: string }[] = [
  { value: 'hong_kong', label: '香港', flag: 'HK' },
  { value: 'macau', label: '澳门', flag: 'MO' },
  { value: 'taiwan', label: '台湾', flag: 'TW' },
];

export const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'tech', label: '科技数码', emoji: '💻' },
  { value: 'food', label: '美食', emoji: '🍜' },
  { value: 'lifestyle', label: '生活日常', emoji: '🏠' },
  { value: 'gaming', label: '游戏', emoji: '🎮' },
  { value: 'beauty', label: '美妆时尚', emoji: '💄' },
  { value: 'music', label: '音乐', emoji: '🎵' },
  { value: 'education', label: '知识科普', emoji: '📚' },
  { value: 'comedy', label: '搞笑幽默', emoji: '😂' },
  { value: 'entertainment', label: '影视娱乐', emoji: '🎬' },
  { value: 'anime', label: '动漫二次元', emoji: '🎌' },
  { value: 'fitness', label: '运动健身', emoji: '💪' },
  { value: 'travel', label: '旅行', emoji: '✈️' },
  { value: 'pets', label: '宠物', emoji: '🐾' },
  { value: 'automotive', label: '汽车', emoji: '🚗' },
  { value: 'finance', label: '财经商业', emoji: '💰' },
  { value: 'photography', label: '摄影', emoji: '📷' },
  { value: 'diy', label: '手工DIY', emoji: '🔨' },
  { value: 'dance', label: '舞蹈', emoji: '💃' },
  { value: 'parenting', label: '亲子育儿', emoji: '👶' },
  { value: 'home', label: '家居装修', emoji: '🏡' },
];

export const FOLLOWER_TIERS: { value: '1-10w' | '10-50w' | '50-100w' | '100w+'; label: string }[] = [
  { value: '1-10w', label: '1-10万' },
  { value: '10-50w', label: '10-50万' },
  { value: '50-100w', label: '50-100万' },
  { value: '100w+', label: '100万+' },
];

export const CONTENT_TYPES: { value: 'mid_long' | 'short' | 'both'; label: string }[] = [
  { value: 'mid_long', label: '中长视频优先' },
  { value: 'short', label: '短视频也可以' },
  { value: 'both', label: '不限' },
];

export const OUTREACH_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'pending', label: '待联系', color: '#94A3B8' },
  { value: 'contacted', label: '已联系', color: '#3B82F6' },
  { value: 'replied', label: '已回复', color: '#F59E0B' },
  { value: 'negotiating', label: '谈判中', color: '#8B5CF6' },
  { value: 'onboarded', label: '已入驻', color: '#10B981' },
];

export const OPERATORS = [
  '张伟',
  '李婷',
  '王磊',
  '陈思',
  '未分配',
];

// YouTube search keywords per category
export const CATEGORY_KEYWORDS_YT: Record<string, string[]> = {
  tech: ['科技評測', '3C開箱', '科技新聞', '手機評測', '電腦開箱', '科技博主', '數碼評測', '科技達人'],
  food: ['美食探店', '料理教學', '吃播', '美食博主', '烹飪教學', '食譜分享', '美食推薦', '香港美食', '台灣美食'],
  lifestyle: ['日常Vlog', '生活分享', '生活紀錄', '生活方式', '生活博主', 'Vlog博主', '生活日常', '港漂生活', '台灣生活'],
  gaming: ['遊戲實況', '遊戲攻略', '遊戲評測', '遊戲主播', '電競', '遊戲博主', '手遊攻略', 'PC遊戲'],
  beauty: ['美妝教學', '彩妝', '穿搭分享', '美妝博主', '護膚分享', '化妝教程', '時尚穿搭', '美妝推薦'],
  music: ['翻唱', '原創音樂', '音樂MV', '音樂博主', '歌手', '音樂製作', '彈唱', '音樂分享'],
  education: ['知識分享', '科普', '教學頻道', '教育博主', '學習分享', '知識博主', '科普達人', '教學視頻'],
  comedy: ['搞笑', '喜劇', '脫口秀', '搞笑博主', '幽默', '笑話', '搞笑視頻', '喜劇演員'],
  entertainment: ['影評', '娛樂新聞', '影視解說', '娛樂博主', '電影推薦', '電視劇評', '娛樂圈'],
  anime: ['動漫', '二次元', 'Cosplay', '動漫博主', '動畫評測', '漫畫推薦', '動漫解說', 'ACG'],
  fitness: ['健身教學', '運動', '瑜伽', '健身博主', '減肥', '運動教學', '健身達人', '體能訓練'],
  travel: ['旅行Vlog', '旅遊攻略', '背包客', '旅遊博主', '旅行分享', '景點推薦', '旅行達人', '香港旅遊', '台灣旅遊'],
  pets: ['寵物', '貓咪', '狗狗', '寵物博主', '寵物護理', '貓奴', '狗奴', '寵物日常'],
  automotive: ['汽車評測', '改車', '機車', '汽車博主', '車評', '汽車推薦', '機車騎士', '汽車文化'],
  finance: ['理財', '投資', '財經', '財經博主', '股票', '基金', '理財教學', '投資分享'],
  photography: ['攝影教學', '攝影作品', '相機評測', '攝影博主', '攝影師', '拍照技巧', '攝影分享'],
  diy: ['DIY', '手作', '手工藝', 'DIY博主', '手工製作', '創意手工', 'DIY教學'],
  dance: ['舞蹈', '編舞', 'Dance Cover', '舞蹈博主', '舞者', '舞蹈教學', '街舞', '編舞師'],
  parenting: ['育兒', '親子', '媽媽', '育兒博主', '親子活動', '媽媽分享', '育兒經驗', '親子教育'],
  home: ['家居', '裝潢', '室內設計', '家居博主', '裝修', '家居佈置', '室內設計師', '家居分享'],
};

// 批量搜索关键词生成器
export function generateSearchKeywords(category: string, region: string): string[] {
  const keywords = CATEGORY_KEYWORDS_YT[category] || [];
  const regionPrefix = REGION_LANG_MAP[region] || '';
  
  const searchKeywords: string[] = [];
  
  // 组合关键词：地区 + 品类关键词
  for (const keyword of keywords) {
    searchKeywords.push(`${regionPrefix}${keyword}`);
    searchKeywords.push(`${keyword}${regionPrefix}`);
  }
  
  // 添加通用搜索词
  searchKeywords.push(`${regionPrefix}YouTuber`);
  searchKeywords.push(`${regionPrefix}博主`);
  searchKeywords.push(`${regionPrefix}KOL`);
  searchKeywords.push(`${regionPrefix}網紅`);
  searchKeywords.push(`${regionPrefix}創作者`);
  
  return searchKeywords;
}

// Region to language mapping
export const REGION_LANG_MAP: Record<string, string> = {
  hong_kong: 'yue',
  macau: 'yue',
  taiwan: 'zh-Hant',
};

// Platform domain mapping
export const PLATFORM_DOMAINS: Record<string, string> = {
  youtube: 'youtube.com',
  instagram: 'instagram.com',
  tiktok: 'tiktok.com',
  x: 'x.com',
  douyin: 'douyin.com',
  xiaohongshu: 'xiaohongshu.com',
};
