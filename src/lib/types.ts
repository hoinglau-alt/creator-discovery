export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'x' | 'douyin' | 'xiaohongshu';

export type Region = 'hong_kong' | 'macau' | 'taiwan';

export type Category =
  | 'tech' | 'food' | 'lifestyle' | 'gaming' | 'beauty'
  | 'music' | 'education' | 'comedy' | 'entertainment' | 'anime'
  | 'fitness' | 'travel' | 'pets' | 'automotive' | 'finance'
  | 'photography' | 'diy' | 'dance' | 'parenting' | 'home';

export type FollowerTier = '1-10w' | '10-50w' | '50-100w' | '100w+';

export type ContentType = 'mid_long' | 'short' | 'both';

export type OutreachStatus = 'pending' | 'contacted' | 'replied' | 'negotiating' | 'onboarded';

export type ContactReliability = 'high' | 'medium' | 'low';

export interface ContactInfo {
  type: 'email' | 'dm' | 'website' | 'other';
  value: string;
  reliability: ContactReliability;
  source: string;
}

export interface CreatorEvaluation {
  contentStyleTags: string[];
  audienceProfile: string;
  updateFrequency: string;
  growthTrend: 'rising' | 'stable' | 'declining';
  fitScore: number; // 1-10
  cooperationWillingness: number; // 1-10
  recommendation: string;
}

export interface GrowthDataPoint {
  month: string;
  followers: number;
}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  platform: Platform;
  platformHandle: string;
  region: Region;
  categories: Category[];
  followers: number;
  followerTier: FollowerTier;
  contentType: ContentType;
  contactInfo: ContactInfo[];
  evaluation: CreatorEvaluation;
  outreachStatus: OutreachStatus;
  growthData: GrowthDataPoint[];
  recentVideos: { title: string; views: number; date: string }[];
  languages: string[];
  joinedDate: string;
  assignedTo: string;
}

export interface FilterState {
  platforms: Platform[];
  categories: Category[];
  regions: Region[];
  followerTiers: FollowerTier[];
  contentType: ContentType | 'all';
  searchQuery: string;
  outreachStatus: OutreachStatus[];
}
