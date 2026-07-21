// 应用配置（非敏感配置）
// 敏感信息（API Key）请通过部署平台的环境变量配置

export const APP_CONFIG = {
  // YouTube API Key（硬编码）
  youtubeApiKey: 'AIzaSyDX9c5L__bfa9SfsGzWalyNAmPqurFtSq8',
  
  // Supabase - 优先从环境变量读取
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
