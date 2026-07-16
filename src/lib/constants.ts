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
