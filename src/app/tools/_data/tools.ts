export type ToolCategory = 'Growth' | 'Content' | 'Marketing' | 'Analytics';

export interface InstagramTool {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  badges?: string[];
}

export const toolCategoryTabs = ['All', 'Growth', 'Content', 'Marketing', 'Analytics'] as const;
export type ToolCategoryTab = typeof toolCategoryTabs[number];

export const instagramTools: InstagramTool[] = [
  {
    slug: 'ai-brand-influencer-matcher',
    title: 'AI Brand–Influencer Matcher',
    description: 'Get matched with brand partnership opportunities based on your profile and audience.',
    category: 'Marketing',
    badges: ['Free'],
  },
  {
    slug: 'ai-product-matchmaker',
    title: 'AI Matchmaker for Free Products',
    description: 'Discover product gifting collaborations tailored to your niche and content style.',
    category: 'Marketing',
    badges: ['Free'],
  },
  {
    slug: 'instagram-ads-spy',
    title: 'Instagram Ads Spy Tool',
    description: 'Analyze ads from competitors and brands to inspire creatives and strategy.',
    category: 'Marketing',
    badges: ['Free'],
  },
  {
    slug: 'fake-follower-checker',
    title: 'Instagram Fake Follower Checker',
    description: 'Estimate follower quality and spot potential bots or suspicious patterns.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'caption-generator',
    title: 'Instagram Caption Generator',
    description: 'Generate captions optimized for engagement and your brand voice.',
    category: 'Content',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'content-ideas-generator',
    title: 'Instagram Content Ideas Generator',
    description: 'Get fresh content ideas for posts, stories, and Reels based on your niche.',
    category: 'Content',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'emv-calculator',
    title: 'Instagram Earned Media Value (EMV) Calculator',
    description: 'Estimate the earned media value for creators or campaigns.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'engagement-calculator',
    title: 'Instagram Engagement Calculator',
    description: 'Calculate engagement rate using likes, comments, and followers.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'engagement-rate-calculator',
    title: 'Instagram Engagement Rate Calculator (Posts/Reels)',
    description: 'Check engagement rates and performance signals for posts and Reels.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'follower-count-tracker',
    title: 'Instagram Follower Count Tracker (Real-Time)',
    description: 'Track follower changes over time to monitor growth and churn.',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'follower-following-ratio',
    title: 'Follower-to-Following Ratio Calculator',
    description: 'Understand account health with follower/following ratio insights.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'fancy-fonts-generator',
    title: 'Instagram Fancy Fonts Generator',
    description: 'Generate copy‑paste fancy fonts for your bio and captions.',
    category: 'Content',
    badges: ['Free'],
  },
  {
    slug: 'hashtag-generator',
    title: 'AI Hashtag Generator',
    description: 'Generate relevant hashtags for posts and Reels based on topic and category.',
    category: 'Content',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'trending-hashtags-by-country',
    title: 'Trending Instagram Hashtags by Country',
    description: 'Find popular hashtags by location to improve discovery.',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'anonymous-highlight-viewer',
    title: 'Anonymous Instagram Highlight Viewer',
    description: 'View public highlights anonymously (privacy-first viewing).',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'influencer-comparison',
    title: 'Influencer Comparison Tool',
    description: 'Compare influencers side-by-side using key performance signals.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'influencer-pricing-calculator',
    title: 'Influencer Pricing Calculator',
    description: 'Estimate pricing for sponsored posts based on account size and engagement.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'influencer-search',
    title: 'Influencer Search Tool',
    description: 'Discover influencers by niche, audience size, and keywords.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'likes-to-followers-ratio',
    title: 'Likes-to-Followers Ratio Calculator',
    description: 'Measure engagement quality relative to follower count.',
    category: 'Analytics',
    badges: ['Free'],
  },
  {
    slug: 'lookalike-finder',
    title: 'Instagram Lookalike Finder',
    description: 'Find creators similar to your top performers for scaling partnerships.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'metrics-knowledge-quiz',
    title: 'Instagram Metrics Knowledge Quiz',
    description: 'Test your understanding of Instagram metrics and best practices.',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'money-calculator',
    title: 'Instagram Money Calculator',
    description: 'Estimate potential earnings from sponsored content based on performance.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'photo-downloader',
    title: 'Instagram Photo Downloader',
    description: 'Save photos from public posts and carousels (where permitted).',
    category: 'Content',
    badges: ['Free'],
  },
  {
    slug: 'reels-downloader',
    title: 'Instagram Reels Downloader',
    description: 'Download Reels from public profiles (where permitted).',
    category: 'Content',
    badges: ['Free'],
  },
  {
    slug: 'anonymous-story-viewer',
    title: 'Anonymous Instagram Story Viewer',
    description: 'View public stories anonymously (privacy-first viewing).',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'username-checker',
    title: 'Instagram Username Checker',
    description: 'Check username availability and brainstorm handle ideas.',
    category: 'Growth',
    badges: ['Free', 'No login required'],
  },
  {
    slug: 'web-viewer',
    title: 'Web Viewer for Instagram',
    description: 'Browse public profiles and content on the web with a simple viewer.',
    category: 'Growth',
    badges: ['Free'],
  },
  {
    slug: 'local-influencer-search',
    title: 'Local Influencer Search',
    description: 'Find influencers by location for local campaigns.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
  {
    slug: 'niche-influencer-search',
    title: 'Niche Influencer Search',
    description: 'Find influencers by niche keywords in bio or content.',
    category: 'Marketing',
    badges: ['AI', 'Free'],
  },
];

export function getToolBySlug(slug: string): InstagramTool | undefined {
  return instagramTools.find((t) => t.slug === slug);
}


