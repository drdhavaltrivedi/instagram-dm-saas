'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Users, 
  Hash, 
  UserPlus, 
  Filter, 
  Send, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Instagram,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Target,
  Plus,
  List,
  Clock,
  MessageSquare,
  X
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { usePostHog } from '@/hooks/use-posthog';
import { toast } from 'sonner';
import { MobileLeadCard } from "@/components/leads/mobile-lead-card";
import { LeadProfileModal } from '@/components/leads/lead-profile-modal';
import { getRandomDelay, formatDelayTime } from '@/lib/utils/rate-limit';

// Use relative URLs since we're on the same domain (Next.js API routes)
// All API calls use relative URLs since backend and frontend are on the same domain

interface Lead {
  id: string;
  igUserId: string;
  igUsername: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  isVerified: boolean;
  isPrivate: boolean;
  isBusiness: boolean;
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'unsubscribed';
  tags: string[];
  matchedKeywords: string[];
  source: string;
  sourceQuery?: string;
  createdAt: string;
  // Enhanced fields
  leadScore?: number;
  engagementRate?: number;
  accountAge?: number;
  postFrequency?: number;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  timesContacted?: number;
  lastContactedAt?: string;
  lastInteractionAt?: string;
}

interface InstagramAccount {
  id: string;
  igUserId: string;
  igUsername: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  contacted: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  replied: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  converted: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  unsubscribed: { bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
};

// Preset keyword categories for different target audiences
const KEYWORD_PRESETS = [
  {
    name: 'E-commerce Founders',
    keywords: ['ecommerce founder', 'e-commerce founder', 'shopify', 'ecom', 'dropshipping', 'amazon fba', 'online store', 'dtc brand', 'd2c'],
    icon: '🛒',
  },
  {
    name: 'AI / Tech Influencers',
    keywords: ['ai influencer', 'ai founder', 'tech founder', 'artificial intelligence', 'machine learning', 'saas founder', 'startup founder', 'tech entrepreneur'],
    icon: '🤖',
  },
  {
    name: 'Business Coaches',
    keywords: ['business coach', 'life coach', 'executive coach', 'mentor', 'consultant', 'coaching', 'helping entrepreneurs'],
    icon: '📈',
  },
  {
    name: 'Content Creators',
    keywords: ['content creator', 'digital creator', 'youtuber', 'podcaster', 'influencer', 'ugc creator', 'brand ambassador'],
    icon: '🎬',
  },
  {
    name: 'Agency Owners',
    keywords: ['agency owner', 'marketing agency', 'digital agency', 'smma', 'social media manager', 'ad agency', 'creative agency'],
    icon: '🏢',
  },
  {
    name: 'Real Estate',
    keywords: ['real estate', 'realtor', 'real estate agent', 'property investor', 'real estate investor', 'broker'],
    icon: '🏠',
  },
  {
    name: 'Fitness / Health',
    keywords: ['fitness coach', 'personal trainer', 'nutritionist', 'health coach', 'wellness', 'gym owner', 'fitness influencer'],
    icon: '💪',
  },
  {
    name: 'General Entrepreneurs',
    keywords: ['founder', 'ceo', 'entrepreneur', 'business owner', 'startup', 'co-founder', 'building', 'bootstrapped'],
    icon: '🚀',
  },
];

// Smart keyword matching function
function matchKeywordsInBio(bio: string, keywords: string[]): string[] {
  const lowerBio = bio.toLowerCase();
  const matched: string[] = [];
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase().trim();
    if (!lowerKeyword) continue;
    
    // Check for exact phrase match
    if (lowerBio.includes(lowerKeyword)) {
      matched.push(keyword);
      continue;
    }
    
    // Check for word-by-word match (for multi-word phrases)
    const words = lowerKeyword.split(' ').filter(w => w.length > 2);
    if (words.length > 1) {
      const allWordsPresent = words.every(word => lowerBio.includes(word));
      if (allWordsPresent) {
        matched.push(keyword);
      }
    }
  }
  
  return Array.from(new Set(matched)); // Remove duplicates
}

// Decode HTML entities in text
function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function LeadsPage() {
  const { capture } = usePostHog();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  // Search state
  const [searchType, setSearchType] = useState<'username' | 'hashtag' | 'followers'>('username');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLimit, setSearchLimit] = useState(50);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null); // For followers search
  
  // Hashtag posts state
  const [hashtagPosts, setHashtagPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoadingPostDetails, setIsLoadingPostDetails] = useState(false);
  
  // Hashtag search now defaults to bio only (posts option removed)
  
  // Followers/Following search state
  const [targetUserProfile, setTargetUserProfile] = useState<any>(null);
  const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');
  const [isLoadingTargetUser, setIsLoadingTargetUser] = useState(false);
  
  // Filter state
  const [bioKeywords, setBioKeywords] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customKeyword, setCustomKeyword] = useState('');
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [followerRange, setFollowerRange] = useState<[number, number] | null>(null);
  const [engagementRateRange, setEngagementRateRange] = useState<[number, number] | null>(null);
  const [accountAgeRange, setAccountAgeRange] = useState<[number, number] | null>(null);
  const [postFrequencyRange, setPostFrequencyRange] = useState<[number, number] | null>(null);
  const [minLeadScore, setMinLeadScore] = useState<number | null>(null);
  
  // Bulk actions
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'status' | 'tags' | null>(null);
  const [bulkActionValue, setBulkActionValue] = useState('');
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  
  // Lead Lists
  const [leadLists, setLeadLists] = useState<any[]>([]);
  const [showLeadListsModal, setShowLeadListsModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  
  // Leads list state
  const [leadsSearchQuery, setLeadsSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'followers' | 'name' | 'score' | 'engagement'>('newest');
  const [displayedLeadsCount, setDisplayedLeadsCount] = useState(50); // Start with 50 leads
  const leadsPerBatch = 50; // Load 50 more at a time
  
  // Modals
  const [showBulkDmModal, setShowBulkDmModal] = useState(false);
  const [bulkDmMessage, setBulkDmMessage] = useState('');
  const [isSendingBulkDm, setIsSendingBulkDm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Batch loading states
  const [displayedSearchResults, setDisplayedSearchResults] = useState<any[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [batchSize] = useState(10); // Load 10 initially
  const [moreBatchSize] = useState(5); // Load 5 more on button click
  
  // Profile modal state
  const [showLeadProfileModal, setShowLeadProfileModal] = useState(false);
  const [profileModalUsername, setProfileModalUsername] = useState('');

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('instagram_accounts')
        .select('id, ig_user_id, ig_username')
        .eq('is_active', true);

      if (data) {
        const accs = data.map((a: any) => ({
          id: a.id,
          igUserId: a.ig_user_id,
          igUsername: a.ig_username,
        }));
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccount) {
          setSelectedAccount(accs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, [selectedAccount]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLeads((data || []).map((l: any) => ({
        id: l.id,
        igUserId: l.ig_user_id,
        igUsername: l.ig_username,
        fullName: l.full_name,
        bio: l.bio,
        profilePicUrl: l.profile_pic_url,
        followerCount: l.follower_count,
        followingCount: l.following_count,
        postCount: l.post_count,
        isVerified: l.is_verified,
        isPrivate: l.is_private,
        isBusiness: l.is_business,
        status: l.status,
        tags: l.tags || [],
        matchedKeywords: l.matched_keywords || [],
        source: l.source,
        sourceQuery: l.source_query,
        createdAt: l.created_at,
        // Enhanced fields
        leadScore: l.lead_score,
        engagementRate: l.engagement_rate,
        accountAge: l.account_age,
        postFrequency: l.post_frequency,
        email: l.email,
        phone: l.phone,
        website: l.website,
        location: l.location,
        timesContacted: l.times_contacted || 0,
        lastContactedAt: l.last_contacted_at,
        lastInteractionAt: l.last_interaction_at,
      })));
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAccounts();
    fetchLeads();
  }, [fetchAccounts, fetchLeads]);

  // Get cookies from localStorage
  const getCookies = () => {
    if (!selectedAccount) {
      console.log('getCookies: No selected account');
      return null;
    }
    // Try different possible cookie keys
    const possibleKeys = [
      `socialora_cookies_${selectedAccount.igUserId}`,
      `socialora_cookies_${selectedAccount.igUsername}`,
      `instagram_cookies_${selectedAccount.igUserId}`,
    ];
    
    for (const key of possibleKeys) {
      const cookiesStr = localStorage.getItem(key);
      if (cookiesStr) {
        console.log(`getCookies: Found cookies with key ${key}`);
        return JSON.parse(cookiesStr);
      }
    }
    
    console.log('getCookies: No cookies found. Available keys:', Object.keys(localStorage).filter(k => k.includes('cookie') || k.includes('socialora')));
    return null;
  };
  
  // State for search errors
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Extension-based hashtag scraping
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [waitingForExtensionData, setWaitingForExtensionData] = useState(false);
  const instagramTabRef = useRef<Window | null>(null);

  // Check if extension is available
  useEffect(() => {
    const checkExtension = () => {
      window.postMessage({ type: 'SOCIALORA_PING' }, window.location.origin);
    };
    
    const handlePong = () => {
      setExtensionAvailable(true);
      console.log('[Leads] Extension detected');
    };
    
    window.addEventListener('socialora_pong', handlePong);
    checkExtension();
    
    return () => {
      window.removeEventListener('socialora_pong', handlePong);
    };
  }, []);

  // Listen for hashtag data from extension
  useEffect(() => {
    const handleHashtagData = async (data: any) => {
      console.log('[Leads] Received hashtag data from extension:', data);
      console.log('[Leads] Posts:', data.posts?.length, 'Usernames:', data.usernames?.length);
      
      const { hashtag, posts, usernames } = data;
      
      // Store posts for display
      setHashtagPosts(posts || []);
      
      // Close the Instagram tab and focus back on app
      if (instagramTabRef.current) {
        try {
          // Check if tab is still open before trying to close
          if (!instagramTabRef.current.closed) {
            instagramTabRef.current.close();
            console.log('[Leads] Closed Instagram tab');
          } else {
            console.log('[Leads] Instagram tab already closed');
          }
        } catch (e) {
          console.error('[Leads] Could not close tab:', e);
        }
        instagramTabRef.current = null;
      }
      
      // Focus back on the app window
      window.focus();
      
      // Process the data
      setWaitingForExtensionData(false);
      
      if (!usernames || usernames.length === 0) {
        toast.error('No usernames found', {
          description: `Found ${posts?.length || 0} posts but couldn't extract usernames. Instagram may have changed their page structure.`,
        });
        return;
      }
      
      toast.success(`Found ${posts?.length || 0} posts from #${hashtag}!`, {
        description: `Extracting profiles from ${usernames.length} users...`,
      });
      
      // Fetch profiles for the usernames
      await fetchProfilesFromUsernames(usernames, hashtag);
    };
    
    // Listen via window.postMessage
    const messageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SOCIALORA_HASHTAG_DATA_AVAILABLE') {
        console.log('[Leads] Received via postMessage:', event.data);
        handleHashtagData(event.data.data);
      }
    };
    
    // Listen via custom event (more reliable for extension -> page communication)
    const customEventListener = (event: any) => {
      if (event.detail && event.detail.type === 'SOCIALORA_HASHTAG_DATA_AVAILABLE') {
        console.log('[Leads] Received via custom event:', event.detail);
        handleHashtagData(event.detail.data);
      }
    };
    
    window.addEventListener('message', messageListener);
    window.addEventListener('socialora_hashtag_data', customEventListener as EventListener);
    
    return () => {
      window.removeEventListener('message', messageListener);
      window.removeEventListener('socialora_hashtag_data', customEventListener as EventListener);
    };
  }, []);

  // Fetch profiles from usernames list
  const fetchProfilesFromUsernames = async (usernames: string[], source: string) => {
    setIsSearching(true);
    setSearchResults([]);
    
    const users: any[] = [];
    let keywords: string[] = [];
    
    // Get bio keywords for filtering
    if (selectedPreset) {
      const preset = KEYWORD_PRESETS.find(p => p.name === selectedPreset);
      keywords = preset?.keywords || [];
    }
    const customKeywords = bioKeywords.split(',').map(k => k.trim()).filter(k => k);
    keywords = [...keywords, ...customKeywords];
    
    toast.info(`Fetching ${usernames.length} profiles...`, {
      description: keywords.length > 0 ? 'Filtering by bio keywords' : 'This may take a minute',
    });
    
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      
      try {
        const response = await fetch('/api/leads/scrape-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        
        if (response.ok) {
          const profileData = await response.json();
          
          // Filter by bio keywords if provided
          if (keywords.length > 0) {
            const bio = (profileData.bio || '').toLowerCase();
            const hasMatch = keywords.some(kw => bio.includes(kw.toLowerCase()));
            if (!hasMatch) continue;
            
            profileData.matchedKeywords = keywords.filter(kw =>
              bio.includes(kw.toLowerCase())
            );
          }
          
          users.push({
            pk: username,
            username,
            fullName: profileData.fullName || username,
            profilePicUrl: profileData.profilePicUrl || '',
            bio: profileData.bio || '',
            followerCount: profileData.followerCount || 0,
            followingCount: profileData.followingCount || 0,
            postCount: profileData.postCount || 0,
            isPrivate: profileData.isPrivate || false,
            isVerified: profileData.isVerified || false,
            isBusiness: profileData.isBusiness || false,
            source: source,
            matchedKeywords: profileData.matchedKeywords || [],
          });
        }
        
        // Update progress
        if ((i + 1) % 5 === 0) {
          toast.info(`Progress: ${i + 1}/${usernames.length} profiles`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (err) {
        console.error(`Failed to fetch profile for ${username}:`, err);
      }
    }
    
    setSearchResults(users);
    setIsSearching(false);
    
    toast.success(`Found ${users.length} profiles!`, {
      description: keywords.length > 0 ? `Filtered by bio keywords` : '',
    });
    
    capture('lead_search_performed', {
      search_type: 'hashtag_extension',
      results_count: users.length,
      source: source,
    });
  };

  // Fetch post details by shortcode
  const fetchPostDetails = async (shortcode: string) => {
    if (!shortcode) return null;
    
    setIsLoadingPostDetails(true);
    try {
      console.log('[Leads] Fetching post details for:', shortcode);
      const response = await fetch(`/api/instagram/post/${shortcode}`);
      const data = await response.json();
      
      console.log('[Leads] API response:', data);
      
      if (data.success && data.post) {
        console.log('[Leads] Successfully fetched post details:', {
          username: data.post.owner?.username,
          followerCount: data.post.owner?.followerCount,
          hasOwner: !!data.post.owner
        });
        return data.post;
      }
      
      console.error('[Leads] Failed to fetch post details:', data.error);
      toast.error('Could not fetch post details', {
        description: data.error || 'The post may be private or unavailable'
      });
      return null;
    } catch (error) {
      console.error('[Leads] Error fetching post details:', error);
      toast.error('Error loading post details');
      return null;
    } finally {
      setIsLoadingPostDetails(false);
    }
  };

  // Handle post selection and fetch details if needed
  const handlePostSelection = async (post: any) => {
    console.log('[Leads] Post selected:', post);
    setSelectedPost(post);
    setShowPostModal(true);
    
    // Try to extract username from various sources
    let username = post.username || post.owner?.username;
    
    // Filter out invalid usernames (common false positives from alt text)
    const invalidUsernames = ['Photo', 'photo', 'Image', 'image', 'Video', 'video', 'Post', 'post', 'Best', 'best', 'New', 'new', 'Latest', 'latest', 'Top', 'top', 'null'];
    if (username && invalidUsernames.includes(username)) {
      username = null;
    }
    
    // If no username but we have shortcode, scrape the post to get username
    if (!username && post.shortcode) {
      console.log('[Leads] No username in cache, scraping post to get account info:', post.shortcode);
      setIsLoadingPostDetails(true);
      
      try {
        // Scrape the post page to get username
        const postResponse = await fetch('/api/instagram/scrape-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shortcode: post.shortcode }),
        });
        
        const postData = await postResponse.json();
        console.log('[Leads] Post scrape response:', postData);
        
        if (postData.success && postData.username) {
          username = postData.username;
          console.log('[Leads] Successfully extracted username from post:', username);
          
          // Update post with username and caption
          setSelectedPost({
            ...post,
            username: username,
            caption: postData.caption,
          });
        } else {
          console.error('[Leads] Failed to scrape post:', postData.error);
          setIsLoadingPostDetails(false);
          toast.error('Could not identify account', {
            description: 'Unable to determine who posted this. Try opening on Instagram.'
          });
          return;
        }
      } catch (error) {
        console.error('[Leads] Error scraping post:', error);
        setIsLoadingPostDetails(false);
        toast.error('Error loading post details');
        return;
      }
    }
    
    if (!username) {
      console.log('[Leads] No valid username found');
      return;
    }
    
    // If owner info is missing or incomplete, fetch user profile
    const hasCompleteOwnerInfo = post.owner && 
      (post.owner.followerCount !== undefined || 
       post.owner.followingCount !== undefined);
    
    console.log('[Leads] Has complete owner info:', hasCompleteOwnerInfo, 'Username:', username);
    
    if (!hasCompleteOwnerInfo) {
      console.log('[Leads] Fetching profile for username:', username);
      setIsLoadingPostDetails(true);
      
      try {
        // Use the no-auth scraper API to get profile info
        const response = await fetch('/api/leads/scrape-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        
        const profileData = await response.json();
        console.log('[Leads] Profile data response:', profileData);
        
        if (profileData.success) {
          // Update the post with owner information from profile
          const updatedPost = {
            ...post,
            username: username,
            caption: post.caption,
            owner: {
              username: profileData.username,
              fullName: profileData.fullName,
              profilePicUrl: profileData.profilePicUrl,
              isVerified: profileData.isVerified,
              followerCount: profileData.followerCount,
              followingCount: profileData.followingCount,
              postCount: profileData.postCount,
              biography: profileData.bio,
            }
          };
          console.log('[Leads] Updated post with profile data:', updatedPost);
          setSelectedPost(updatedPost);
          
          toast.success('Account info loaded', {
            description: `@${username}`,
          });
        } else {
          console.error('[Leads] Failed to fetch profile:', profileData.error);
          toast.error('Could not load account info', {
            description: profileData.error || 'Profile may be private'
          });
        }
      } catch (error) {
        console.error('[Leads] Error fetching profile:', error);
        toast.error('Error loading account info');
      } finally {
        setIsLoadingPostDetails(false);
      }
    }
  };

  // Trigger extension-based hashtag scraping
  const handleHashtagSearchViaExtension = (hashtag: string) => {
    const cleanHashtag = hashtag.replace('#', '').trim();
    
    // Clear old posts before starting new search
    setHashtagPosts([]);
    
    // Close any existing Instagram tab
    if (instagramTabRef.current && !instagramTabRef.current.closed) {
      try {
        instagramTabRef.current.close();
        console.log('[Leads] Closed previous Instagram tab');
      } catch (e) {
        console.error('[Leads] Could not close previous tab:', e);
      }
      instagramTabRef.current = null;
    }
    
    // Open Instagram in new tab and wait for extension to scrape
    const instagramUrl = `https://www.instagram.com/explore/tags/${cleanHashtag}/`;
    
    console.log('[Leads] Opening Instagram hashtag URL:', instagramUrl);
    
    toast.info('Opening Instagram...', {
      description: 'The extension will scrape hashtag data automatically. Tab will close automatically.',
      duration: 5000,
    });
    
    setWaitingForExtensionData(true);
    
    // Open the URL
    const newTab = window.open(instagramUrl, '_blank');
    if (!newTab) {
      toast.error('Failed to open Instagram tab', {
        description: 'Please allow popups for this site',
      });
      setWaitingForExtensionData(false);
      return;
    }
    
    // Store tab reference for later closing
    instagramTabRef.current = newTab;
    
    console.log('[Leads] Opened tab for hashtag:', cleanHashtag);
    
    // Poll chrome.storage for data (fallback method)
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      console.log('[Leads] Polling chrome.storage for hashtag data, attempt:', pollCount);
      
      // Check chrome.storage.local for data
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['socialora_hashtag_data'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('[Leads] Storage access error:', chrome.runtime.lastError);
            return;
          }
          
          const storedData = result.socialora_hashtag_data;
          if (storedData && storedData.data) {
            console.log('[Leads] Found hashtag data in storage!', storedData.data);
            
            // Clear the stored data
            chrome.storage.local.remove(['socialora_hashtag_data']);
            
            // Process the data
            clearInterval(pollInterval);
            setWaitingForExtensionData(false);
            
            const { hashtag, posts, usernames } = storedData.data;
            
            // Store the posts for display
            if (posts && posts.length > 0) {
              setHashtagPosts(posts);
              console.log('[Leads] Stored', posts.length, 'posts from hashtag');
            }
            
            // Close the Instagram tab
            if (instagramTabRef.current && !instagramTabRef.current.closed) {
              try {
                instagramTabRef.current.close();
                console.log('[Leads] Closed Instagram tab via chrome.storage method');
              } catch (e) {
                console.error('[Leads] Could not close tab:', e);
              }
              instagramTabRef.current = null;
            }
            
            // Focus back on the app window
            window.focus();
            
            toast.success(`Found ${posts.length} posts from #${hashtag}!`);
            fetchProfilesFromUsernames(usernames, hashtag);
          }
        });
      }
      
      // Stop polling after 30 seconds
      if (pollCount >= 30) {
        clearInterval(pollInterval);
        if (waitingForExtensionData) {
          setWaitingForExtensionData(false);
          toast.error('Timeout', {
            description: 'Did not receive data from extension. Make sure the Socialora extension is installed and the Instagram tab loaded completely.',
          });
        }
      }
    }, 1000); // Poll every second
  };

  // Search users
  const handleSearch = async (loadMore = false, overrideQuery?: string, overrideType?: 'username' | 'hashtag' | 'followers') => {
    const query = overrideQuery || searchQuery;
    const type = overrideType || searchType;
    
    setSearchError(null);
    console.log('handleSearch called:', { query, type, selectedAccount, loadMore });
    
    if (!query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }
    
    // For hashtag search, use extension if available
    if (type === 'hashtag') {
      if (!extensionAvailable) {
        toast.error('Extension required', {
          description: 'Hashtag search requires the Socialora Chrome Extension.',
          duration: 5000,
        });
        setSearchError('Please install the Socialora Chrome Extension to use hashtag search.');
        setIsSearching(false);
        return;
      }
      
      handleHashtagSearchViaExtension(query);
      return;
    }
    
    if (!selectedAccount) {
      setSearchError('Please select an Instagram account first');
      return;
    }

    const cookies = getCookies();
    console.log('Cookies found:', !!cookies);
    
    if (!cookies) {
      setSearchError('No session found. Please reconnect your Instagram account from Settings > Instagram Accounts. Use the Chrome extension to grab your session.');
      return;
    }

    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
      setSearchResults([]);
      setSearchLimit(50);
      setTargetUserId(null);
    }

    const currentLimit = loadMore ? searchLimit + 50 : 50;

    try {
      let endpoint = '';
      let body: any = { cookies };
      let userId = targetUserId;

      switch (type) {
        case 'username':
          endpoint = '/api/instagram/cookie/users/search';
          body.query = query;
          body.limit = Math.min(currentLimit, 50); // Username search limited to 50
          break;
        case 'hashtag':
          // Fallback to API if extension not available
          if (!extensionAvailable) {
            setSearchError('Hashtag search requires the Socialora Chrome extension. Please install it from the Chrome Web Store.');
            setIsSearching(false);
            return;
          }
          endpoint = `/api/instagram/cookie/hashtag/${query.replace('#', '')}/users`;
          body.limit = currentLimit;
          body.searchSource = 'bio'; // Always use bio search for hashtags
          // Include bio keywords for filtering
          let keywords: string[] = [];
          if (selectedPreset) {
            const preset = KEYWORD_PRESETS.find(p => p.name === selectedPreset);
            keywords = preset?.keywords || [];
          }
          const customKeywords = bioKeywords.split(',').map(k => k.trim()).filter(k => k);
          body.bioKeywords = [...keywords, ...customKeywords];
          break;
        case 'followers':
          // Use cached user ID from lookup
          if (!userId) {
            toast.warning('User lookup required', {
              description: 'Please lookup the user first to get their profile information.',
            });
            setIsSearching(false);
            setIsLoadingMore(false);
            return;
          }
          // Use followListType to decide followers or following
          endpoint = `/api/instagram/cookie/user/by-id/${userId}/${followListType}`;
          body.limit = currentLimit;
          break;
      }

      console.log('Making request to:', endpoint, body);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Search result:', result);

      if (result.success) {
        const results = result.users || result.followers || result.following || [];
        
        if (!loadMore) {
          // Reset batch loading state on new search
          setSearchResults(results);
          setDisplayedSearchResults([]);
          setCurrentBatchIndex(0);
          
          // Automatically trigger loading first batch if we have results
          if (results.length > 0) {
            setTimeout(() => {
              loadNextBatch(batchSize);
            }, 500);
          }
        } else {
          // For load more, just add to search results
          setSearchResults(results);
        }
        
        setSearchLimit(currentLimit);
        setSearchError(''); // Clear any previous errors
        
        // Track lead search
        capture('lead_search_performed', {
          search_type: type,
          query: query,
          results_count: results.length,
          has_preset: !!selectedPreset,
          has_custom_keywords: !!bioKeywords,
        });
        
        if (results.length === 0) {
          // Provide more helpful error messages based on search type
          if (type === 'hashtag') {
            setSearchError(
              `No users found for "${query}". Try:\n` +
              `• Using a more popular or specific keyword\n` +
              `• Checking if the hashtag exists on Instagram\n` +
              `• Trying a related keyword (e.g., "business coach" instead of "businesscoach")\n` +
              `• Using a different search method (try username search)`
            );
          } else if (type === 'username') {
            setSearchError(`No users found matching "${query}". Try a different search term.`);
          } else {
            setSearchError('No users found. Try a different keyword or check your Instagram session.');
          }
        }
        
        // Check if there might be more results
        // For followers/hashtag, if we got the full limit, there might be more
        if (type !== 'username' && results.length >= currentLimit) {
          setHasMoreResults(true);
        } else {
          setHasMoreResults(false);
        }
      } else {
        console.error('Search failed:', result.error);
        const errorMsg = result.error || 'Search failed. Please check your Instagram session.';
        setSearchError(errorMsg);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMsg = (error as Error).message;
      setSearchError(`Search failed: ${errorMsg}`);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  // Lookup user for followers/following search
  const handleLookupUser = async () => {
    if (!searchQuery.trim() || !selectedAccount) return;

    const cookies = getCookies();
    if (!cookies) {
      toast.error('Session expired', {
        description: 'Please reconnect your Instagram account.',
      });
      return;
    }

    setIsLoadingTargetUser(true);
    setTargetUserProfile(null);
    setSearchResults([]);

    try {
      const userRes = await fetch(`/api/instagram/cookie/user/${searchQuery.replace('@', '')}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies }),
      });
      const userData = await userRes.json();

      if (!userData.success || !userData.profile) {
        toast.error('User not found', {
          description: 'Please check the username and try again.',
        });
        return;
      }

      const profile = userData.profile;
      setTargetUserProfile({
        pk: profile.pk,
        username: profile.username,
        fullName: profile.fullName,
        bio: profile.biography || profile.bio,
        profilePicUrl: profile.profilePicUrl,
        isVerified: profile.isVerified,
        isPrivate: profile.isPrivate,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        mediaCount: profile.mediaCount,
        // Friendship status
        followedByViewer: profile.followedByViewer,
        followsViewer: profile.followsViewer,
      });
      setTargetUserId(profile.pk);
    } catch (error) {
      console.error('Lookup error:', error);
      toast.error('Lookup failed', {
        description: 'Failed to lookup user. Please try again.',
      });
    } finally {
      setIsLoadingTargetUser(false);
    }
  };

  // Load batch of search results with random delays
  const loadNextBatch = async (count: number) => {
    if (!selectedAccount || searchResults.length === 0) return;

    const cookies = getCookies();
    if (!cookies) {
      toast.error('Session expired', {
        description: 'Please reconnect your Instagram account.',
      });
      return;
    }

    // Get keywords from preset or custom input
    let keywords: string[] = [];
    if (selectedPreset) {
      const preset = KEYWORD_PRESETS.find(p => p.name === selectedPreset);
      keywords = preset?.keywords || [];
    }
    const customKeywords = bioKeywords.split(',').map(k => k.trim()).filter(k => k);
    keywords = [...keywords, ...customKeywords];

    setIsLoadingBatch(true);
    const startIndex = currentBatchIndex;
    const endIndex = Math.min(startIndex + count, searchResults.length);
    const batch = searchResults.slice(startIndex, endIndex);
    
    setLoadingProgress({ current: 0, total: batch.length });

    const newDisplayedResults: any[] = [];

    for (let i = 0; i < batch.length; i++) {
      const userProfile = batch[i];
      
      try {
        setLoadingProgress({ current: i + 1, total: batch.length });
        
        // Fetch full profile with bio
        const profileRes = await fetch(`/api/instagram/cookie/user/${userProfile.username}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookies }),
        });
        const profileData = await profileRes.json();
        
        const profile = profileData.success ? profileData.profile : userProfile;
        const bio = profile.bio || '';
        
        // Use smart keyword matching
        const matchedKeywords = matchKeywordsInBio(bio, keywords);
        
        // Add to displayed results with full profile data
        newDisplayedResults.push({
          ...profile,
          username: profile.username || userProfile.username,
          fullName: profile.fullName || userProfile.fullName,
          bio: profile.bio,
          matchedKeywords,
          source: userProfile.source,
          matchedKeyword: userProfile.matchedKeyword,
        });

        // Update displayed results immediately (incremental display)
        setDisplayedSearchResults(prev => [...prev, {
          ...profile,
          username: profile.username || userProfile.username,
          fullName: profile.fullName || userProfile.fullName,
          bio: profile.bio,
          matchedKeywords,
          source: userProfile.source,
          matchedKeyword: userProfile.matchedKeyword,
        }]);

        // Random delay between 5-15 seconds (except for the last item)
        if (i < batch.length - 1) {
          const delay = getRandomDelay();
          console.log(`Waiting ${formatDelayTime(delay)} before next profile...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Failed to load profile ${userProfile.username}:`, error);
      }
    }

    setCurrentBatchIndex(endIndex);
    setIsLoadingBatch(false);
    setLoadingProgress({ current: 0, total: 0 });

    if (endIndex >= searchResults.length) {
      toast.success('All profiles loaded!', {
        description: `Loaded ${displayedSearchResults.length + newDisplayedResults.length} profiles`,
      });
    }
  };

  // Add leads from displayed results
  const handleAddLeads = async (users: any[]) => {
    if (!selectedAccount) return;

    const cookies = getCookies();
    if (!cookies) {
      toast.error('Session expired', {
        description: 'Please reconnect your Instagram account.',
      });
      return;
    }

    // Get keywords from preset or custom input
    let keywords: string[] = [];
    if (selectedPreset) {
      const preset = KEYWORD_PRESETS.find(p => p.name === selectedPreset);
      keywords = preset?.keywords || [];
    }
    // Add custom keywords
    const customKeywords = bioKeywords.split(',').map(k => k.trim()).filter(k => k);
    keywords = [...keywords, ...customKeywords];
    
    const supabase = createClient();
    // Get current user's workspace
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error('Authentication required', {
        description: 'Please log in to continue.',
      });
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('supabase_auth_id', authUser.id)
      .single();

    if (!user?.workspace_id) {
      toast.error('Workspace not found', {
        description: 'Please refresh the page and try again.',
      });
      return;
    }

    const workspaceId = user.workspace_id;

    let addedCount = 0;

    // Show progress
    toast.info('Adding leads', {
      description: `Adding ${users.length} leads to database...`,
      duration: 3000,
    });

    for (const profile of users) {
      try {
        // Insert into database (RLS will verify workspace_id)
        await supabase.from('leads').upsert({
          workspace_id: workspaceId,
          instagram_account_id: selectedAccount.id,
          ig_user_id: profile.pk,
          ig_username: profile.username,
          full_name: profile.fullName,
          bio: profile.bio,
          profile_pic_url: profile.profilePicUrl,
          follower_count: profile.followerCount,
          following_count: profile.followingCount,
          post_count: profile.postCount,
          is_verified: profile.isVerified || false,
          is_private: profile.isPrivate || false,
          is_business: profile.isBusiness || false,
          status: 'new',
          source: searchType,
          source_query: searchQuery,
          matched_keywords: profile.matchedKeywords || [],
        }, {
          onConflict: 'ig_user_id,workspace_id'
        });

        addedCount++;
      } catch (error) {
        console.error(`Failed to add lead ${profile.username}:`, error);
      }
    }

    toast.success('Leads added!', {
      description: `Successfully added ${addedCount} leads to your database`,
      duration: 5000,
    });
    setDisplayedSearchResults([]);
    setSearchResults([]);
    setCurrentBatchIndex(0);
    fetchLeads();
  };

  // View profile
  const handleViewProfile = async (lead: Lead) => {
    setShowProfileModal(true);
    setIsLoadingProfile(true);
    
    // Always fetch full lead data including history and enrichment
    const supabase = createClient();
    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .single();

    // Set initial profile with history data
    setSelectedProfile({ 
      ...lead, 
      // Include history and enrichment data
      leadScore: leadData?.lead_score,
      engagementRate: leadData?.engagement_rate,
      accountAge: leadData?.account_age,
      postFrequency: leadData?.post_frequency,
      email: leadData?.email,
      phone: leadData?.phone,
      website: leadData?.website,
      location: leadData?.location,
      timesContacted: leadData?.times_contacted || 0,
      lastContactedAt: leadData?.last_contacted_at,
      lastInteractionAt: leadData?.last_interaction_at,
      dmSentAt: leadData?.dm_sent_at,
      dmRepliedAt: leadData?.dm_replied_at,
    });
    
    // Fetch fresh profile data from Instagram if account is connected
    if (selectedAccount) {
      const cookies = getCookies();
      if (cookies) {
        try {
          const res = await fetch(`/api/instagram/cookie/user/${lead.igUsername}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookies }),
          });
          const data = await res.json();
          if (data.success) {
            setSelectedProfile((prev: any) => ({ 
              ...prev,
              ...data.profile,
            }));
            
            // Update in database
            await supabase.from('leads').update({
              bio: data.profile.bio,
              follower_count: data.profile.followerCount,
              following_count: data.profile.followingCount,
              post_count: data.profile.postCount,
            }).eq('id', lead.id);
          }
        } catch (e) {
          console.error('Failed to fetch profile:', e);
        }
      }
    }
    setIsLoadingProfile(false);
  };

  // Send bulk DM
  const handleSendBulkDm = async () => {
    if (!selectedAccount || selectedLeads.size === 0 || !bulkDmMessage.trim()) return;

    const cookies = getCookies();
    if (!cookies) {
      toast.error('Session expired', {
        description: 'Please reconnect your Instagram account.',
      });
      return;
    }

    setIsSendingBulkDm(true);

    const leadsToMessage = leads.filter(l => selectedLeads.has(l.id));
    let sentCount = 0;
    let failedCount = 0;

    for (const lead of leadsToMessage) {
      try {
        const response = await fetch('/api/instagram/cookie/dm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookies,
            recipientUsername: lead.igUsername,
            message: bulkDmMessage.replace('{{name}}', lead.fullName || lead.igUsername),
          }),
        });

        const result = await response.json();

        if (result.success) {
          sentCount++;
          // Update lead status
          const supabase = createClient();
          await supabase.from('leads').update({
            status: 'contacted',
            dm_sent_at: new Date().toISOString(),
          }).eq('id', lead.id);
        } else {
          failedCount++;
        }

        // Delay between messages
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        failedCount++;
      }
    }

    toast.success('Bulk DM sent!', {
      description: `Sent ${sentCount} DMs${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
    });
    setShowBulkDmModal(false);
    setBulkDmMessage('');
    setSelectedLeads(new Set());
    fetchLeads();
    setIsSendingBulkDm(false);
  };

  // Delete leads
  const handleDeleteLeads = async () => {
    if (selectedLeads.size === 0) return;
    if (!confirm(`Delete ${selectedLeads.size} leads?`)) return;

    const supabase = createClient();
    await supabase.from('leads').delete().in('id', Array.from(selectedLeads));
    setSelectedLeads(new Set());
    fetchLeads();
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedLeads.size === 0 || !bulkActionType) return;

    setIsPerformingBulkAction(true);
    try {
      const response = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkActionType === 'status' ? 'updateStatus' : 'addTags',
          leadIds: Array.from(selectedLeads),
          data: bulkActionType === 'status' 
            ? { status: bulkActionValue }
            : { tags: bulkActionValue.split(',').map(t => t.trim()).filter(Boolean) },
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Bulk action completed', {
          description: `Updated ${result.updated} leads.`,
        });
        setShowBulkActionsModal(false);
        setBulkActionType(null);
        setBulkActionValue('');
        setSelectedLeads(new Set());
        fetchLeads();
      } else {
        toast.error('Bulk action failed', {
          description: result.error || 'Unknown error occurred.',
        });
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Bulk action failed', {
        description: 'Please try again later.',
      });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Export leads to CSV
  const handleExportLeads = async () => {
    const leadIds = selectedLeads.size > 0 ? Array.from(selectedLeads) : undefined;
    
    try {
      const response = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Export successful', {
        description: 'Leads exported to CSV file.',
      });
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error('Export failed', {
        description: 'Failed to export leads. Please try again.',
      });
    }
  };

  // Fetch lead lists
  const fetchLeadLists = useCallback(async () => {
    setIsLoadingLists(true);
    try {
      const response = await fetch('/api/leads/lists');
      const result = await response.json();
      if (result.success) {
        setLeadLists(result.lists || []);
      }
    } catch (error) {
      console.error('Error fetching lead lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  }, []);

  // Create lead list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.warning('List name required', {
        description: 'Please enter a name for the list.',
      });
      return;
    }

    try {
      const response = await fetch('/api/leads/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewListName('');
        setNewListDescription('');
        setShowCreateListModal(false);
        fetchLeadLists();
        toast.success('List created!', {
          description: 'Lead list created successfully.',
        });
      } else {
        toast.error('Failed to create list', {
          description: result.error || 'Unknown error occurred.',
        });
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list', {
        description: 'Please try again later.',
      });
    }
  };

  // Add selected leads to list
  const handleAddToList = async (listId: string) => {
    if (selectedLeads.size === 0) {
      toast.warning('No leads selected', {
        description: 'Please select leads to add to the list.',
      });
      return;
    }

    try {
      const response = await fetch(`/api/leads/lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Added ${result.added} leads to list`);
        setShowLeadListsModal(false);
        setSelectedLeads(new Set());
      } else {
        alert('Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding leads to list:', error);
      alert('Failed to add leads to list');
    }
  };

  // Load lead lists on mount
  useEffect(() => {
    fetchLeadLists();
  }, [fetchLeadLists]);

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  // Filter, search, and sort leads
  const processedLeads = leads
    .filter(lead => {
      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      
      // Bio keywords filter
      if (filterKeywords.length > 0) {
        const bio = (lead.bio || '').toLowerCase();
        if (!filterKeywords.some(k => bio.includes(k.toLowerCase()))) return false;
      }
      
      // Search query filter
      if (leadsSearchQuery) {
        const query = leadsSearchQuery.toLowerCase();
        const matchesUsername = lead.igUsername?.toLowerCase().includes(query);
        const matchesName = lead.fullName?.toLowerCase().includes(query);
        const matchesBio = lead.bio?.toLowerCase().includes(query);
        const matchesTags = lead.matchedKeywords?.some(k => k.toLowerCase().includes(query));
        if (!matchesUsername && !matchesName && !matchesBio && !matchesTags) return false;
      }
      
      // Advanced filters
      if (followerRange) {
        const followers = lead.followerCount || 0;
        if (followers < followerRange[0] || followers > followerRange[1]) return false;
      }
      
      if (engagementRateRange && lead.engagementRate !== undefined && lead.engagementRate !== null) {
        if (lead.engagementRate < engagementRateRange[0] || lead.engagementRate > engagementRateRange[1]) return false;
      }
      
      if (accountAgeRange && lead.accountAge !== undefined && lead.accountAge !== null) {
        if (lead.accountAge < accountAgeRange[0] || lead.accountAge > accountAgeRange[1]) return false;
      }
      
      if (postFrequencyRange && lead.postFrequency !== undefined && lead.postFrequency !== null) {
        if (lead.postFrequency < postFrequencyRange[0] || lead.postFrequency > postFrequencyRange[1]) return false;
      }
      
      if (minLeadScore !== null && (lead.leadScore === undefined || lead.leadScore === null || lead.leadScore < minLeadScore)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'followers':
          return (b.followerCount || 0) - (a.followerCount || 0);
        case 'name':
          return (a.igUsername || '').localeCompare(b.igUsername || '');
        case 'score':
          return (b.leadScore || 0) - (a.leadScore || 0);
        case 'engagement':
          return (b.engagementRate || 0) - (a.engagementRate || 0);
        default:
          return 0;
      }
    });

  // Display leads (limited by displayedLeadsCount)
  const displayedLeads = processedLeads.slice(0, displayedLeadsCount);
  const hasMoreLeads = processedLeads.length > displayedLeadsCount;

  // Load more leads
  const handleLoadMore = () => {
    setDisplayedLeadsCount(prev => prev + leadsPerBatch);
  };

  // Reset displayed leads count when filters change
  useEffect(() => {
    setDisplayedLeadsCount(50); // Reset to initial batch size
  }, [statusFilter, leadsSearchQuery, sortBy, filterKeywords]);

  return (
    <div className="min-h-screen">
      <Header
        title="Lead Generation"
        subtitle="Find and target potential customers on Instagram"
      />

      <div className="p-4 md:p-6">
        {/* No Accounts Warning */}
        {accounts.length === 0 && !isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-400 font-medium">
                Connect an Instagram account first
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (window.location.href = "/settings/instagram")}
              className="w-full sm:w-auto">
              <Instagram className="h-4 w-4" />
              Connect
            </Button>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-background-secondary rounded-xl border border-border p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Find Leads
          </h3>

          {/* Account Selector */}
          {accounts.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Using Account
              </label>
              <select
                value={selectedAccount?.id || ""}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.id === e.target.value);
                  if (acc) setSelectedAccount(acc);
                }}
                className="w-full max-w-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm">
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.igUsername}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Type Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              {
                type: "username",
                icon: Search,
                label: "Search Target Audience",
              },
              { 
                type: "hashtag", 
                icon: Hash, 
                label: "Hashtag (via Extension)",
                badge: extensionAvailable ? "✓" : "⚠️"
              },
              { type: "followers", icon: Users, label: "User's Followers" },
            ].map(({ type, icon: Icon, label, badge }) => (
              <button
                key={type}
                onClick={() => setSearchType(type as any)}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
                  searchType === type
                    ? "bg-accent text-white"
                    : "bg-background-elevated text-foreground-muted hover:text-foreground"
                )}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
                {badge && <span className="text-xs opacity-75">{badge}</span>}
              </button>
            ))}
          </div>

          {/* Extension status for hashtag */}
          {searchType === 'hashtag' && !extensionAvailable && (
            <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="space-y-2">
                <p className="text-sm text-amber-400 flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <span>Extension required for hashtag search</span>
                </p>
                <p className="text-xs text-amber-300/80">
                  Install the Socialora Chrome Extension to enable hashtag scraping. The extension will automatically extract usernames from Instagram hashtag pages.
                </p>
              </div>
            </div>
          )}

          {/* Waiting for extension data */}
          {waitingForExtensionData && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Scraping Instagram hashtag page... Keep the tab open for 10-15 seconds.</span>
              </p>
            </div>
          )}

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder={
                  searchType === "username"
                    ? "Search target audience by name or niche..."
                    : searchType === "hashtag"
                    ? "Enter hashtag (e.g., entrepreneur)"
                    : "Enter username to get their followers/following"
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Reset target user when query changes for followers search
                  if (searchType === "followers") {
                    setTargetUserProfile(null);
                  }
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (searchType === "followers"
                    ? handleLookupUser()
                    : handleSearch())
                }
                leftIcon={
                  searchType === "hashtag" ? (
                    <Hash className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )
                }
              />
            </div>
            {searchType === "followers" ? (
              <Button
                onClick={handleLookupUser}
                disabled={isLoadingTargetUser || !searchQuery.trim()}
                variant="secondary"
                className="w-full sm:w-auto">
                {isLoadingTargetUser ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Lookup User</span>
                <span className="sm:hidden">Lookup</span>
              </Button>
            ) : (
              <Button
                data-search-btn
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full sm:w-auto">
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isSearching ? "Searching..." : "Search"}
              </Button>
            )}
          </div>

          {/* Followers/Following User Card */}
          {searchType === "followers" && targetUserProfile && (
            <div
              className={cn(
                "mb-4 p-4 rounded-xl border",
                targetUserProfile.isPrivate
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20"
                  : "bg-gradient-to-r from-accent/10 to-purple-500/10 border-accent/20"
              )}>
              <div className="flex items-center gap-4">
                <Avatar
                  src={targetUserProfile.profilePicUrl}
                  name={targetUserProfile.username}
                  size="lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground text-lg">
                      @{targetUserProfile.username}
                    </h4>
                    {targetUserProfile.isVerified && (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    )}
                    {targetUserProfile.isPrivate && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        🔒 Private
                      </span>
                    )}
                  </div>
                  <p className="text-foreground-muted">
                    {targetUserProfile.fullName}
                  </p>
                  {targetUserProfile.bio && (
                    <p className="text-sm text-foreground-subtle mt-1 line-clamp-2">
                      {targetUserProfile.bio}
                    </p>
                  )}
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {targetUserProfile.followerCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-foreground-muted">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {targetUserProfile.followingCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-foreground-muted">Following</p>
                  </div>
                </div>
              </div>

              {/* Private Account Warning */}
              {targetUserProfile.isPrivate && (
                <div
                  className={cn(
                    "mt-3 p-3 rounded-lg border",
                    targetUserProfile.followedByViewer
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                  <div className="flex items-start gap-2">
                    {targetUserProfile.followedByViewer ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-400">
                            Private Account - You Follow Them ✓
                          </p>
                          <p className="text-xs text-foreground-muted mt-1">
                            Your account (@{selectedAccount?.igUsername})
                            follows this user, so you can access their
                            followers/following list.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-400">
                            Private Account - Access Restricted
                          </p>
                          <p className="text-xs text-foreground-muted mt-1">
                            Your account (@{selectedAccount?.igUsername})
                            doesn't follow this user. Instagram will block
                            access to their followers/following list.
                            <br />
                            <span className="text-amber-400">
                              Tip: Follow this account first to gain access.
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Followers/Following Toggle */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-foreground-muted">Get:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFollowListType("followers")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      followListType === "followers"
                        ? "bg-accent text-white"
                        : "bg-background text-foreground-muted hover:text-foreground"
                    )}>
                    <Users className="h-4 w-4 inline mr-1" />
                    Followers (
                    {targetUserProfile.followerCount?.toLocaleString() || 0})
                  </button>
                  <button
                    onClick={() => setFollowListType("following")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      followListType === "following"
                        ? "bg-accent text-white"
                        : "bg-background text-foreground-muted hover:text-foreground"
                    )}>
                    <UserPlus className="h-4 w-4 inline mr-1" />
                    Following (
                    {targetUserProfile.followingCount?.toLocaleString() || 0})
                  </button>
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={
                    isSearching ||
                    (targetUserProfile.isPrivate &&
                      !targetUserProfile.followedByViewer)
                  }
                  className="ml-auto">
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isSearching
                    ? "Loading..."
                    : `Get ${
                        followListType === "followers"
                          ? "Followers"
                          : "Following"
                      }`}
                </Button>
              </div>
            </div>
          )}

          {/* Target Audience Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-muted mb-2">
              🎯 Quick Select Target Audience
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {KEYWORD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    if (selectedPreset === preset.name) {
                      setSelectedPreset(null);
                    } else {
                      setSelectedPreset(preset.name);
                      // Auto-search with the first keyword as hashtag
                      const firstKeyword = preset.keywords[0].replace(
                        /\s+/g,
                        ""
                      );
                      setSearchType("hashtag");
                      setSearchQuery(firstKeyword);
                      // Directly call search with the query
                      handleSearch(false, firstKeyword, "hashtag");
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedPreset === preset.name
                      ? "bg-accent text-white shadow-lg shadow-accent/30"
                      : "bg-background-elevated text-foreground-muted hover:text-foreground hover:bg-background-elevated/80"
                  )}>
                  <span>{preset.icon}</span>
                  {preset.name}
                </button>
              ))}
            </div>
            {selectedPreset && (
              <div className="mb-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent font-medium mb-1">
                  🎯 Target: {selectedPreset}
                </p>
                <p className="text-xs text-foreground-muted">
                  Bio filter keywords:{" "}
                  {KEYWORD_PRESETS.find((p) => p.name === selectedPreset)
                    ?.keywords.slice(0, 5)
                    .join(", ")}
                  ...
                </p>
              </div>
            )}
          </div>

          {/* Custom Keywords Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground-muted mb-2">
              ➕ Additional Keywords (optional)
            </label>
            <Input
              placeholder="e.g., saas, b2b, growth hacker"
              value={bioKeywords}
              onChange={(e) => setBioKeywords(e.target.value)}
            />
            <p className="text-xs text-foreground-subtle mt-1">
              Add custom keywords to combine with the selected preset (comma
              separated)
            </p>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{searchError}</p>
              </div>
              {searchError.includes("session") && (
                <div className="mt-2 ml-7">
                  <a
                    href="/settings/instagram"
                    className="text-xs text-red-300 hover:text-red-200 underline">
                    Go to Instagram Settings to reconnect →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {/* Hashtag Posts Grid */}
          {hashtagPosts.length > 0 && (
            <div className="mb-6 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Hashtag Posts ({hashtagPosts.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHashtagPosts([])}
                >
                  Clear Posts
                </Button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {hashtagPosts.map((post, index) => (
                  <div
                    key={post.id || index}
                    onClick={() => handlePostSelection(post)}
                    className="aspect-square cursor-pointer relative group overflow-hidden rounded-lg bg-background-elevated"
                  >
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={`Post ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-background-muted">
                        <Hash className="h-8 w-8 text-foreground-muted" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm">
                      {post.likeCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <span>❤️</span>
                          <span>{post.likeCount}</span>
                        </div>
                      )}
                      {post.commentCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.commentCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {(searchResults.length > 0 || displayedSearchResults.length > 0) && (
            <div className="border-t border-border pt-4">
              {/* Search info header */}
              {searchResults.length > 0 && displayedSearchResults.length === 0 && !isLoadingBatch && (
                <div className="mb-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-accent font-medium">
                    ✨ Found {searchResults.length} profiles. Loading first {Math.min(batchSize, searchResults.length)}...
                  </p>
                </div>
              )}
              
              {/* Loading indicator */}
              {isLoadingBatch && (
                <div className="mb-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-accent animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-accent font-medium">
                        Loading profile {loadingProgress.current} of {loadingProgress.total}...
                      </p>
                      <div className="mt-2 bg-background-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-accent h-full transition-all duration-300"
                          style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Displayed results */}
              {displayedSearchResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">
                        Loaded {displayedSearchResults.length} of {searchResults.length} profiles
                      </h4>
                      <div className="flex gap-3 mt-1">
                        {searchType === "hashtag" && (
                          <span className="text-xs text-foreground-muted flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {
                              displayedSearchResults.filter(
                                (u) =>
                                  u.source === "bio_match" || u.source === "hashtag"
                              ).length
                            }{" "}
                            from bio search
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddLeads(displayedSearchResults)} disabled={isLoadingBatch}>
                      <UserPlus className="h-4 w-4" />
                      Add All {displayedSearchResults.length} as Leads
                    </Button>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                    {displayedSearchResults.map((user, i) => (
                      <div
                        key={`${user.pk}-${i}`}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          user.source === "bio_match"
                            ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                            : "bg-background-elevated border-border hover:bg-background-elevated/80"
                        )}>
                        <div className="flex items-start gap-3">
                          <Avatar
                            src={user.profilePicUrl}
                            name={user.username}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">
                                @{user.username}
                              </p>
                              {user.isVerified && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                              )}
                              {user.isPrivate && (
                                <span className="text-xs text-amber-400">🔒</span>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted truncate">
                              {user.fullName}
                            </p>

                            {/* Follower count */}
                            {user.followerCount && (
                              <p className="text-xs text-foreground-subtle mt-1">
                                {user.followerCount.toLocaleString()} followers
                              </p>
                            )}

                            {/* Bio preview */}
                            {user.bio && (
                              <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                                {user.bio}
                              </p>
                            )}

                            {/* Source & Matched keyword badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.source && (
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    user.source === "bio_match"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-accent/20 text-accent"
                                  )}>
                                  {user.source === "bio_match"
                                    ? "📝 Bio match"
                                    : "#️⃣ Hashtag"}
                                </span>
                              )}
                              {user.matchedKeyword && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-medium">
                                  ✓ {user.matchedKeyword}
                                </span>
                              )}
                            </div>

                            {/* View Profile Button */}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="mt-2 w-full text-xs"
                              onClick={() => {
                                setProfileModalUsername(user.username);
                                setShowLeadProfileModal(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {currentBatchIndex < searchResults.length && !isLoadingBatch && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => loadNextBatch(moreBatchSize)}
                        disabled={isLoadingBatch}
                      >
                        Load {Math.min(moreBatchSize, searchResults.length - currentBatchIndex)} More 
                        ({searchResults.length - currentBatchIndex} remaining)
                      </Button>
                      <p className="text-xs text-foreground-muted">
                        Each profile loads with 5-15 second delay for safety
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Old Search Results (shown only when not using batch loading) */}
          {searchResults.length > 0 && displayedSearchResults.length === 0 && !isLoadingBatch && false && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">
                    Found {searchResults.length} potential leads
                  </h4>
                  <div className="flex gap-3 mt-1">
                    {searchType === "hashtag" && (
                      <span className="text-xs text-foreground-muted flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {
                          searchResults.filter(
                            (u) =>
                              u.source === "bio_match" || u.source === "hashtag"
                          ).length
                        }{" "}
                        from bio search
                      </span>
                    )}
                    {hasMoreResults && (
                      <span className="text-xs text-accent">
                        More available
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAddLeads(searchResults)}>
                  <UserPlus className="h-4 w-4" />
                  Add All {searchResults.length} as Leads
                </Button>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {searchResults.map((user, i) => (
                  <div
                    key={`${user.pk}-${i}`}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      user.source === "bio_match"
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                        : "bg-background-elevated border-border hover:bg-background-elevated/80"
                    )}>
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={user.profilePicUrl}
                        name={user.username}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            @{user.username}
                          </p>
                          {user.isVerified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          )}
                          {user.isPrivate && (
                            <span className="text-xs text-amber-400">🔒</span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted truncate">
                          {user.fullName}
                        </p>

                        {/* Follower count */}
                        {user.followerCount && (
                          <p className="text-xs text-foreground-subtle mt-1">
                            {user.followerCount.toLocaleString()} followers
                          </p>
                        )}

                        {/* Bio preview */}
                        {user.bio && (
                          <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}

                        {/* Source & Matched keyword badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.source && (
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                user.source === "bio_match"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-accent/20 text-accent"
                              )}>
                              {user.source === "bio_match"
                                ? "📝 Bio match"
                                : "#️⃣ Hashtag"}
                            </span>
                          )}
                          {user.matchedKeyword && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-medium">
                              ✓ {user.matchedKeyword}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More / Stats */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-foreground-muted">
                  Showing {searchResults.length} users
                  {searchType !== "username" && ` • Limit: ${searchLimit}`}
                </p>
                {searchType !== "username" && hasMoreResults && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSearch(true)}
                    disabled={isLoadingMore}>
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Load 50 More
                      </>
                    )}
                  </Button>
                )}
                {!hasMoreResults && searchResults.length >= searchLimit && (
                  <span className="text-sm text-emerald-400">
                    ✓ All available results loaded
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leads List */}
        <div className="bg-background-secondary rounded-xl border border-border">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Your Leads ({processedLeads.length})
              </h3>

              {/* Actions */}
              {selectedLeads.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground-muted">
                    {selectedLeads.size} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowBulkActionsModal(true)}>
                    <Filter className="h-4 w-4" />
                    Bulk Actions
                  </Button>
                  <Button size="sm" onClick={() => setShowBulkDmModal(true)}>
                    <Send className="h-4 w-4" />
                    Send DM
                  </Button>
                  <Button size="sm" onClick={handleExportLeads}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button size="sm" onClick={() => setShowLeadListsModal(true)}>
                    <List className="h-4 w-4" />
                    Add to List
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteLeads}
                    className="text-error">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              {/* Search Leads */}
              <div className="flex-1 min-w-0 sm:min-w-[200px] sm:max-w-md">
                <Input
                  placeholder="Search leads by name, username, or bio..."
                  value={leadsSearchQuery}
                  onChange={(e) => setLeadsSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm w-full sm:w-auto">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="followers">Most Followers</option>
                <option value="name">Name A-Z</option>
                <option value="score">Lead Score</option>
                <option value="engagement">Engagement Rate</option>
              </select>

              {/* Advanced Filters Toggle */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                {showAdvancedFilters ? "Hide" : "Advanced"} Filters
              </Button>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1">
                {["all", "new", "contacted", "replied", "converted"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        statusFilter === status
                          ? "bg-accent text-white"
                          : "bg-background-elevated text-foreground-muted hover:text-foreground"
                      )}>
                      {status === "all"
                        ? "All"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="p-4 bg-background-elevated rounded-lg border border-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Follower Range */}
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-2">
                      Followers Range
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={followerRange?.[0] || ""}
                        onChange={(e) =>
                          setFollowerRange([
                            e.target.value ? parseInt(e.target.value) : 0,
                            followerRange?.[1] || 1000000,
                          ])
                        }
                        className="w-full"
                      />
                      <span className="text-foreground-muted">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={followerRange?.[1] || ""}
                        onChange={(e) =>
                          setFollowerRange([
                            followerRange?.[0] || 0,
                            e.target.value ? parseInt(e.target.value) : 1000000,
                          ])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Engagement Rate Range */}
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-2">
                      Engagement Rate (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Min"
                        value={engagementRateRange?.[0] || ""}
                        onChange={(e) =>
                          setEngagementRateRange([
                            e.target.value ? parseFloat(e.target.value) : 0,
                            engagementRateRange?.[1] || 10,
                          ])
                        }
                        className="w-full"
                      />
                      <span className="text-foreground-muted">-</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Max"
                        value={engagementRateRange?.[1] || ""}
                        onChange={(e) =>
                          setEngagementRateRange([
                            engagementRateRange?.[0] || 0,
                            e.target.value ? parseFloat(e.target.value) : 10,
                          ])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Account Age Range */}
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-2">
                      Account Age (days)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={accountAgeRange?.[0] || ""}
                        onChange={(e) =>
                          setAccountAgeRange([
                            e.target.value ? parseInt(e.target.value) : 0,
                            accountAgeRange?.[1] || 3650,
                          ])
                        }
                        className="w-full"
                      />
                      <span className="text-foreground-muted">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={accountAgeRange?.[1] || ""}
                        onChange={(e) =>
                          setAccountAgeRange([
                            accountAgeRange?.[0] || 0,
                            e.target.value ? parseInt(e.target.value) : 3650,
                          ])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Post Frequency Range */}
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-2">
                      Post Frequency (per week)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Min"
                        value={postFrequencyRange?.[0] || ""}
                        onChange={(e) =>
                          setPostFrequencyRange([
                            e.target.value ? parseFloat(e.target.value) : 0,
                            postFrequencyRange?.[1] || 10,
                          ])
                        }
                        className="w-full"
                      />
                      <span className="text-foreground-muted">-</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Max"
                        value={postFrequencyRange?.[1] || ""}
                        onChange={(e) =>
                          setPostFrequencyRange([
                            postFrequencyRange?.[0] || 0,
                            e.target.value ? parseFloat(e.target.value) : 10,
                          ])
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Minimum Lead Score */}
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-2">
                      Minimum Lead Score
                    </label>
                    <Input
                      type="number"
                      placeholder="0-100"
                      min="0"
                      max="100"
                      value={minLeadScore || ""}
                      onChange={(e) =>
                        setMinLeadScore(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFollowerRange(null);
                      setEngagementRateRange(null);
                      setAccountAgeRange(null);
                      setPostFrequencyRange(null);
                      setMinLeadScore(null);
                    }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card View / Desktop Table */}
          {isLoading ? (
            <div className="p-8 text-center text-foreground-muted">
              Loading leads...
            </div>
          ) : processedLeads.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-foreground-subtle mx-auto mb-3" />
              <p className="text-foreground-muted">
                No leads yet. Use the search above to find potential customers.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {displayedLeads.map((lead) => (
                  <MobileLeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLeads.has(lead.id)}
                    onSelect={toggleLeadSelection}
                    onViewProfile={handleViewProfile}
                  />
                ))}
                {hasMoreLeads && (
                  <div className="pt-4">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleLoadMore}
                      className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Load{" "}
                      {Math.min(
                        leadsPerBatch,
                        processedLeads.length - displayedLeads.length
                      )}{" "}
                      More
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-2 md:p-4">
                        <input
                          type="checkbox"
                          checked={
                            selectedLeads.size === leads.length &&
                            leads.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase">
                        User
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase hidden lg:table-cell">
                        Followers
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase hidden md:table-cell">
                        Score
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase hidden lg:table-cell">
                        Engagement
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase hidden xl:table-cell">
                        Bio Keywords
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase">
                        Status
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase hidden md:table-cell">
                        Source
                      </th>
                      <th className="p-2 md:p-4 text-xs font-medium text-foreground-muted uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-background-elevated/50">
                        <td className="p-2 md:p-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="p-2 md:p-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <Avatar
                              src={lead.profilePicUrl}
                              name={lead.igUsername}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground flex items-center gap-1 truncate">
                                @{lead.igUsername}
                                {lead.isVerified && (
                                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                                )}
                              </p>
                              <p className="text-xs md:text-sm text-foreground-muted truncate">
                                {lead.fullName}
                              </p>
                              {/* Show followers on mobile in user cell */}
                              <p className="text-xs text-foreground-subtle lg:hidden mt-0.5">
                                {lead.followerCount?.toLocaleString() || "-"}{" "}
                                followers
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 md:p-4 text-foreground-muted hidden lg:table-cell">
                          {lead.followerCount?.toLocaleString() || "-"}
                        </td>
                        <td className="p-2 md:p-4 hidden md:table-cell">
                          {lead.leadScore !== undefined &&
                          lead.leadScore !== null ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  lead.leadScore >= 70
                                    ? "text-emerald-400"
                                    : lead.leadScore >= 50
                                    ? "text-amber-400"
                                    : "text-foreground-muted"
                                )}>
                                {lead.leadScore}
                              </span>
                            </div>
                          ) : (
                            <span className="text-foreground-subtle">-</span>
                          )}
                        </td>
                        <td className="p-2 md:p-4 hidden lg:table-cell">
                          {lead.engagementRate !== undefined &&
                          lead.engagementRate !== null ? (
                            <span className="text-sm text-foreground-muted">
                              {lead.engagementRate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-foreground-subtle">-</span>
                          )}
                        </td>
                        <td className="p-2 md:p-4 hidden xl:table-cell">
                          {lead.matchedKeywords?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {lead.matchedKeywords.slice(0, 3).map((kw, i) => (
                                <Badge
                                  key={i}
                                  variant="accent"
                                  className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-foreground-subtle">-</span>
                          )}
                        </td>
                        <td className="p-2 md:p-4">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              statusColors[lead.status]?.bg,
                              statusColors[lead.status]?.text
                            )}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-2 md:p-4 text-sm text-foreground-muted hidden md:table-cell">
                          {lead.source === "hashtag" && (
                            <Hash className="h-3 w-3 inline mr-1" />
                          )}
                          {lead.source === "followers" && (
                            <Users className="h-3 w-3 inline mr-1" />
                          )}
                          <span className="truncate block max-w-[120px]">
                            {lead.sourceQuery || lead.source}
                          </span>
                        </td>
                        <td className="p-2 md:p-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProfile(lead)}
                              title="View Lead Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProfileModalUsername(lead.igUsername);
                                setShowLeadProfileModal(true);
                              }}
                              title="View Fresh Profile (Scraped from Instagram)"
                              className="text-accent hover:text-accent/80">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://instagram.com/${lead.igUsername}`,
                                  "_blank"
                                )
                              }
                              title="Open on Instagram">
                              <Instagram className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Load More Button */}
          {hasMoreLeads && (
            <div className="p-4 border-t border-border flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-sm text-foreground-muted">
                  Showing {displayedLeads.length} of {processedLeads.length}{" "}
                  leads
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleLoadMore}
                  className="min-w-[200px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Load{" "}
                  {Math.min(
                    leadsPerBatch,
                    processedLeads.length - displayedLeads.length
                  )}{" "}
                  More
                </Button>
              </div>
            </div>
          )}

          {!hasMoreLeads && processedLeads.length > 0 && (
            <div className="p-4 border-t border-border text-center text-sm text-foreground-muted">
              Showing all {processedLeads.length} leads
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Bulk Actions
              </h2>
              <p className="text-sm text-foreground-muted mt-1">
                Apply action to {selectedLeads.size} selected leads
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Action Type
                </label>
                <select
                  value={bulkActionType || ""}
                  onChange={(e) => {
                    setBulkActionType(
                      e.target.value as "status" | "tags" | null
                    );
                    setBulkActionValue("");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground">
                  <option value="">Select action...</option>
                  <option value="status">Update Status</option>
                  <option value="tags">Add Tags</option>
                </select>
              </div>

              {bulkActionType === "status" && (
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    New Status
                  </label>
                  <select
                    value={bulkActionValue}
                    onChange={(e) => setBulkActionValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground">
                    <option value="">Select status...</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="replied">Replied</option>
                    <option value="converted">Converted</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                </div>
              )}

              {bulkActionType === "tags" && (
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={bulkActionValue}
                    onChange={(e) => setBulkActionValue(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-foreground-subtle mt-1">
                    Separate multiple tags with commas
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowBulkActionsModal(false);
                  setBulkActionType(null);
                  setBulkActionValue("");
                }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleBulkAction}
                disabled={
                  !bulkActionType ||
                  !bulkActionValue.trim() ||
                  isPerformingBulkAction
                }>
                {isPerformingBulkAction ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk DM Modal */}
      {showBulkDmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Send Bulk DM
              </h2>
              <p className="text-sm text-foreground-muted mt-1">
                Send a message to {selectedLeads.size} selected leads
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Message
                </label>
                <textarea
                  value={bulkDmMessage}
                  onChange={(e) => setBulkDmMessage(e.target.value)}
                  placeholder="Hi {{name}}, I noticed you're in the business space..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-foreground-subtle focus:border-accent outline-none resize-none"
                />
                <p className="text-xs text-foreground-subtle mt-1">
                  Use {"{{name}}"} to personalize with their name
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowBulkDmModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendBulkDm}
                disabled={!bulkDmMessage.trim() || isSendingBulkDm}>
                {isSendingBulkDm ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSendingBulkDm
                  ? "Sending..."
                  : `Send to ${selectedLeads.size} leads`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Lists Modal */}
      {showLeadListsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border max-w-md w-full">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Add to List
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Add {selectedLeads.size} selected leads to a list
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLeadListsModal(false);
                  setShowCreateListModal(true);
                }}>
                <Plus className="h-4 w-4" />
                New List
              </Button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {isLoadingLists ? (
                <div className="text-center py-4 text-foreground-muted">
                  Loading lists...
                </div>
              ) : leadLists.length === 0 ? (
                <div className="text-center py-8">
                  <List className="h-12 w-12 text-foreground-subtle mx-auto mb-3" />
                  <p className="text-foreground-muted mb-4">No lists yet</p>
                  <Button
                    onClick={() => {
                      setShowLeadListsModal(false);
                      setShowCreateListModal(true);
                    }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First List
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {leadLists.map((list: any) => (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      className="w-full p-3 rounded-lg bg-background-elevated hover:bg-background border border-border text-left transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {list.name}
                          </p>
                          {list.description && (
                            <p className="text-xs text-foreground-muted mt-1">
                              {list.description}
                            </p>
                          )}
                          <p className="text-xs text-foreground-subtle mt-1">
                            {list.members?.length || 0} leads
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-foreground-muted" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowLeadListsModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border max-w-md w-full">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Create Lead List
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateListModal(false);
                  setNewListName("");
                  setNewListDescription("");
                }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  List Name
                </label>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="My Lead List"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Description of this list..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-foreground-subtle focus:border-accent outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowCreateListModal(false);
                  setNewListName("");
                  setNewListDescription("");
                }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateList}
                disabled={!newListName.trim()}>
                Create List
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center gap-4">
              <Avatar
                src={selectedProfile.profilePicUrl}
                name={selectedProfile.igUsername}
                size="xl"
              />
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  @{selectedProfile.igUsername}
                  {selectedProfile.isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  )}
                </h2>
                <p className="text-foreground-muted">
                  {selectedProfile.fullName}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {isLoadingProfile ? (
                <div className="text-center py-4 text-foreground-muted">
                  Loading profile...
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-background-elevated">
                      <p className="text-xl font-bold text-foreground">
                        {selectedProfile.followerCount?.toLocaleString() || "-"}
                      </p>
                      <p className="text-xs text-foreground-muted">Followers</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background-elevated">
                      <p className="text-xl font-bold text-foreground">
                        {selectedProfile.followingCount?.toLocaleString() ||
                          "-"}
                      </p>
                      <p className="text-xs text-foreground-muted">Following</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background-elevated">
                      <p className="text-xl font-bold text-foreground">
                        {selectedProfile.postCount?.toLocaleString() || "-"}
                      </p>
                      <p className="text-xs text-foreground-muted">Posts</p>
                    </div>
                  </div>

                  {/* Lead Score & Engagement */}
                  {((selectedProfile.leadScore !== undefined &&
                    selectedProfile.leadScore !== null) ||
                    (selectedProfile.engagementRate !== undefined &&
                      selectedProfile.engagementRate !== null)) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProfile.leadScore !== undefined &&
                        selectedProfile.leadScore !== null && (
                          <div className="p-3 rounded-lg bg-background-elevated">
                            <p className="text-sm text-foreground-muted mb-1">
                              Lead Score
                            </p>
                            <p
                              className={cn(
                                "text-2xl font-bold",
                                selectedProfile.leadScore >= 70
                                  ? "text-emerald-400"
                                  : selectedProfile.leadScore >= 50
                                  ? "text-amber-400"
                                  : "text-foreground-muted"
                              )}>
                              {selectedProfile.leadScore}/100
                            </p>
                          </div>
                        )}
                      {selectedProfile.engagementRate !== undefined &&
                        selectedProfile.engagementRate !== null && (
                          <div className="p-3 rounded-lg bg-background-elevated">
                            <p className="text-sm text-foreground-muted mb-1">
                              Engagement Rate
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              {selectedProfile.engagementRate.toFixed(1)}%
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Lead History */}
                  {(selectedProfile.timesContacted ||
                    selectedProfile.lastContactedAt ||
                    selectedProfile.lastInteractionAt) && (
                    <div className="p-4 rounded-lg bg-background-elevated border border-border">
                      <h4 className="text-sm font-medium text-foreground-muted mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Interaction History
                      </h4>
                      <div className="space-y-2">
                        {selectedProfile.timesContacted !== undefined &&
                          selectedProfile.timesContacted > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-foreground-muted">
                                Times Contacted
                              </span>
                              <span className="font-medium text-foreground">
                                {selectedProfile.timesContacted}
                              </span>
                            </div>
                          )}
                        {selectedProfile.lastContactedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground-muted">
                              Last Contacted
                            </span>
                            <span className="font-medium text-foreground">
                              {new Date(
                                selectedProfile.lastContactedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {selectedProfile.lastInteractionAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground-muted">
                              Last Interaction
                            </span>
                            <span className="font-medium text-foreground">
                              {new Date(
                                selectedProfile.lastInteractionAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {selectedProfile.dmSentAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground-muted flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              DM Sent
                            </span>
                            <span className="font-medium text-foreground">
                              {new Date(
                                selectedProfile.dmSentAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {selectedProfile.dmRepliedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground-muted flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Replied
                            </span>
                            <span className="font-medium text-emerald-400">
                              {new Date(
                                selectedProfile.dmRepliedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enrichment Data */}
                  {(selectedProfile.email ||
                    selectedProfile.phone ||
                    selectedProfile.website ||
                    selectedProfile.location) && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground-muted mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {selectedProfile.email && (
                          <p className="text-foreground">
                            <span className="text-foreground-muted">
                              Email:{" "}
                            </span>
                            {selectedProfile.email}
                          </p>
                        )}
                        {selectedProfile.phone && (
                          <p className="text-foreground">
                            <span className="text-foreground-muted">
                              Phone:{" "}
                            </span>
                            {selectedProfile.phone}
                          </p>
                        )}
                        {selectedProfile.website && (
                          <p className="text-foreground">
                            <span className="text-foreground-muted">
                              Website:{" "}
                            </span>
                            <a
                              href={selectedProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline">
                              {selectedProfile.website}
                            </a>
                          </p>
                        )}
                        {selectedProfile.location && (
                          <p className="text-foreground">
                            <span className="text-foreground-muted">
                              Location:{" "}
                            </span>
                            {selectedProfile.location}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedProfile.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground-muted mb-2">
                        Bio
                      </h4>
                      <p className="text-foreground whitespace-pre-wrap">
                        {selectedProfile.bio}
                      </p>
                    </div>
                  )}

                  {/* Matched Keywords */}
                  {selectedProfile.matchedKeywords?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground-muted mb-2">
                        Matched Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.matchedKeywords.map(
                          (kw: string, i: number) => (
                            <Badge key={i} variant="success">
                              {kw}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.isPrivate && (
                      <Badge variant="warning">Private</Badge>
                    )}
                    {selectedProfile.isBusiness && (
                      <Badge variant="accent">Business</Badge>
                    )}
                    {selectedProfile.isVerified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowProfileModal(false)}>
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  window.open(
                    `https://instagram.com/${selectedProfile.igUsername}`,
                    "_blank"
                  )
                }>
                <Instagram className="h-4 w-4" />
                View on Instagram
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Profile Modal (No-Auth Scraper) */}
      <LeadProfileModal
        username={profileModalUsername}
        isOpen={showLeadProfileModal}
        onClose={() => {
          setShowLeadProfileModal(false);
          setProfileModalUsername('');
        }}
        onAddToLeads={async (username) => {
          // Add single lead from modal
          const user = displayedSearchResults.find(u => u.username === username);
          if (user) {
            await handleAddLeads([user]);
          }
          setShowLeadProfileModal(false);
        }}
        isAlreadyLead={leads.some(l => l.igUsername === profileModalUsername)}
      />

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowPostModal(false)}>
          <div 
            className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Post Modal] Selected post data:', selectedPost);
            }}
          >
            <div className="flex flex-col md:flex-row">
              {/* Post Image */}
              <div className="flex-1 bg-black flex items-center justify-center">
                {selectedPost.thumbnail || selectedPost.displayUrl ? (
                  <img
                    src={selectedPost.thumbnail || selectedPost.displayUrl}
                    alt="Post"
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <Hash className="h-24 w-24 text-foreground-muted" />
                  </div>
                )}
              </div>

              {/* Post Details */}
              <div className="w-full md:w-96 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Post Details</h3>
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-foreground-muted" />
                  </button>
                </div>

                {/* Loading State */}
                {isLoadingPostDetails && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 text-accent animate-spin mb-3" />
                    <p className="text-foreground-muted">Fetching post details...</p>
                  </div>
                )}

                {!isLoadingPostDetails && (
                  <div className="space-y-4 flex-1 overflow-y-auto">
                  {/* Debug Info */}
                  {console.log('[Post Modal] Rendering with data:', {
                    hasUsername: !!(selectedPost.username || selectedPost.owner?.username),
                    username: selectedPost.username || selectedPost.owner?.username,
                    hasOwner: !!selectedPost.owner,
                    ownerKeys: selectedPost.owner ? Object.keys(selectedPost.owner) : [],
                    ownerData: selectedPost.owner
                  })}
                  
                  {/* Check if username is invalid */}
                  {(() => {
                    const username = selectedPost.username || selectedPost.owner?.username;
                    const invalidUsernames = ['Photo', 'photo', 'Image', 'image', 'Video', 'video', 'Post', 'post', 'Best', 'best', 'New', 'new', 'Latest', 'latest', 'Top', 'top'];
                    const isInvalidUsername = !username || invalidUsernames.includes(username);
                    
                    if (isInvalidUsername) {
                      return (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-background-elevated border border-yellow-500/20">
                            <div className="flex items-start gap-3 mb-3">
                              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                  Account info not captured
                                </p>
                                <p className="text-xs text-foreground-muted">
                                  The extension couldn't identify who posted this. Click the button below to view the post on Instagram and see the account details.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Prominent Instagram button */}
                          {selectedPost.postUrl && (
                            <a
                              href={selectedPost.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold text-base"
                            >
                              <Instagram className="h-6 w-6" />
                              Open Post on Instagram
                            </a>
                          )}
                          
                          {/* Post Stats if available */}
                          {(selectedPost.likeCount !== undefined || selectedPost.commentCount !== undefined) && (
                            <div className="grid grid-cols-2 gap-3">
                              {selectedPost.likeCount !== undefined && (
                                <div className="p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">❤️</span>
                                    <p className="text-xs text-foreground-muted">Likes</p>
                                  </div>
                                  <p className="text-xl font-bold text-foreground">
                                    {selectedPost.likeCount.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {selectedPost.commentCount !== undefined && (
                                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">💬</span>
                                    <p className="text-xs text-foreground-muted">Comments</p>
                                  </div>
                                  <p className="text-xl font-bold text-foreground">
                                    {selectedPost.commentCount.toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}
                  
                  {/* Username & Profile Info */}
                  {(() => {
                    const username = selectedPost.username || selectedPost.owner?.username;
                    const invalidUsernames = ['Photo', 'photo', 'Image', 'image', 'Video', 'video', 'Post', 'post', 'Best', 'best', 'New', 'new', 'Latest', 'latest', 'Top', 'top'];
                    const hasValidUsername = username && !invalidUsernames.includes(username);
                    
                    return hasValidUsername ? (
                    <div className="p-4 rounded-lg bg-background-elevated border border-border">
                      <p className="text-xs text-foreground-muted mb-2">Posted by</p>
                      <button
                        onClick={() => {
                          const username = selectedPost.username || selectedPost.owner?.username;
                          setProfileModalUsername(username);
                          setShowLeadProfileModal(true);
                          setShowPostModal(false);
                        }}
                        className="flex items-center gap-3 hover:bg-background-muted/50 p-2 rounded-lg transition-colors w-full"
                      >
                        {selectedPost.owner?.profilePicUrl ? (
                          <img
                            src={selectedPost.owner.profilePicUrl}
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-accent/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <Users className="h-6 w-6 text-accent" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-foreground">
                            @{selectedPost.username || selectedPost.owner?.username}
                          </p>
                          {selectedPost.owner?.fullName && (
                            <p className="text-sm text-foreground-muted">
                              {selectedPost.owner.fullName}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      </button>
                      
                      {/* Account Stats */}
                      {selectedPost.owner && (selectedPost.owner.followerCount !== undefined || 
                        selectedPost.owner.followingCount !== undefined || 
                        selectedPost.owner.postCount !== undefined) ? (
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                          {selectedPost.owner.followerCount !== undefined && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">
                                {selectedPost.owner.followerCount >= 1000 
                                  ? `${(selectedPost.owner.followerCount / 1000).toFixed(1)}k`
                                  : selectedPost.owner.followerCount}
                              </p>
                              <p className="text-xs text-foreground-muted">Followers</p>
                            </div>
                          )}
                          {selectedPost.owner.followingCount !== undefined && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">
                                {selectedPost.owner.followingCount >= 1000 
                                  ? `${(selectedPost.owner.followingCount / 1000).toFixed(1)}k`
                                  : selectedPost.owner.followingCount}
                              </p>
                              <p className="text-xs text-foreground-muted">Following</p>
                            </div>
                          )}
                          {selectedPost.owner.postCount !== undefined && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">
                                {selectedPost.owner.postCount}
                              </p>
                              <p className="text-xs text-foreground-muted">Posts</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-foreground-muted text-center italic">
                            Click to view full profile details
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null;
                  })()}

                  {/* Caption - only show for valid username posts */}
                  {selectedPost.caption && (selectedPost.username || selectedPost.owner?.username) && (
                    <div className="p-4 rounded-lg bg-background-elevated border border-border">
                      <p className="text-xs text-foreground-muted mb-2">Caption</p>
                      <p className="text-sm text-foreground line-clamp-4">
                        {decodeHTMLEntities(selectedPost.caption)}
                      </p>
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPost.likeCount !== undefined && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">❤️</span>
                          <p className="text-xs text-foreground-muted">Likes</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                          {selectedPost.likeCount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedPost.commentCount !== undefined && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">💬</span>
                          <p className="text-xs text-foreground-muted">Comments</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                          {selectedPost.commentCount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Engagement Rate */}
                  {selectedPost.owner?.followerCount && selectedPost.likeCount !== undefined && (
                    <div className="p-4 rounded-lg bg-background-elevated border border-border">
                      <p className="text-xs text-foreground-muted mb-2">Estimated Engagement Rate</p>
                      <p className="text-2xl font-bold text-accent">
                        {((selectedPost.likeCount / selectedPost.owner.followerCount) * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  {/* Post URL - only show if we have valid username */}
                  {(() => {
                    const username = selectedPost.username || selectedPost.owner?.username;
                    const invalidUsernames = ['Photo', 'photo', 'Image', 'image', 'Video', 'video', 'Post', 'post', 'Best', 'best', 'New', 'new', 'Latest', 'latest', 'Top', 'top'];
                    const hasValidUsername = username && !invalidUsernames.includes(username);
                    
                    return hasValidUsername && selectedPost.postUrl ? (
                      <a
                        href={selectedPost.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                      >
                        <Instagram className="h-5 w-5" />
                        Open Post on Instagram
                      </a>
                    ) : null;
                  })()}
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

