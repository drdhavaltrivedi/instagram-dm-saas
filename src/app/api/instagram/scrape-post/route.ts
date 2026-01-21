import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/instagram/scrape-post
 * Scrape Instagram post by shortcode to get account and post information
 */
export async function POST(request: NextRequest) {
  try {
    const { shortcode } = await request.json();

    if (!shortcode) {
      return NextResponse.json(
        { success: false, error: 'Shortcode is required' },
        { status: 400 }
      );
    }

    console.log('[Post Scraper] Fetching post:', shortcode);

    const postUrl = `https://www.instagram.com/p/${shortcode}/`;
    
    const response = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      console.error('[Post Scraper] Failed to fetch post:', response.status);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch post from Instagram' },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Extract username from meta tags using regex
    let username = null;
    let caption = null;

    // Method 1: Extract from og:url or canonical URL (most reliable)
    // Format: https://www.instagram.com/USERNAME/ or https://www.instagram.com/p/SHORTCODE/
    const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']https?:\/\/(?:www\.)?instagram\.com\/([^\/\?"']+)/i);
    if (ogUrlMatch && ogUrlMatch[1] && ogUrlMatch[1] !== 'p' && ogUrlMatch[1] !== shortcode) {
      username = ogUrlMatch[1];
      console.log('[Post Scraper] Found username in og:url:', username);
    }

    // Method 2: Extract from alternate link
    if (!username) {
      const alternateLinkMatch = html.match(/<link\s+rel=["']alternate["'][^>]+href=["']https?:\/\/(?:www\.)?instagram\.com\/([^\/\?"']+)/i);
      if (alternateLinkMatch && alternateLinkMatch[1] && alternateLinkMatch[1] !== 'p') {
        username = alternateLinkMatch[1];
        console.log('[Post Scraper] Found username in alternate link:', username);
      }
    }

    // Method 3: Look for profile link in page
    if (!username) {
      // Match: href="/USERNAME/" but not /p/, /reel/, etc.
      const profileLinkMatches = html.matchAll(/href=["']\/([a-zA-Z0-9._]+)\/["']/gi);
      const usernameCandidates = new Set<string>();
      
      for (const match of profileLinkMatches) {
        const candidate = match[1];
        if (candidate && 
            !['p', 'explore', 'reel', 'reels', 'tv', 'stories', 'accounts', 'direct', 'create'].includes(candidate) &&
            candidate !== shortcode) {
          usernameCandidates.add(candidate);
        }
      }
      
      // Get the most common username (likely the author)
      if (usernameCandidates.size > 0) {
        username = Array.from(usernameCandidates)[0];
        console.log('[Post Scraper] Found username in profile links:', username);
      }
    }

    // Method 4: Check og:title meta tag (fallback)
    if (!username) {
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitleMatch) {
        let titleContent = ogTitleMatch[1];
        // Decode HTML entities
        titleContent = titleContent
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        
        const usernameMatch = titleContent.match(/^([^\s:]+?)(?:\s+(?:on Instagram|shared a post|posted))/i);
        if (usernameMatch) {
          username = usernameMatch[1].trim().replace('@', '');
          console.log('[Post Scraper] Found username in og:title:', username);
        }
      }
    }

    // Method 5: Extract from page title
    if (!username) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        let titleContent = titleMatch[1];
        // Decode HTML entities
        titleContent = titleContent
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        
        const usernameMatch = titleContent.match(/^([^\s:()]+?)(?:\s+(?:on Instagram|shared|\()|:)/i);
        if (usernameMatch) {
          username = usernameMatch[1].trim().replace('@', '');
          console.log('[Post Scraper] Found username in title:', username);
        }
      }
    }

    // Extract caption from meta description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      const descContent = ogDescMatch[1].replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
      // Format is usually "123 likes, 45 comments - caption text"
      const captionMatch = descContent.match(/[-–—]\s*(.+)$/);
      if (captionMatch) {
        caption = captionMatch[1].trim();
      } else {
        caption = descContent;
      }
    }

    console.log('[Post Scraper] Extracted data:', { username, shortcode });

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Could not extract username from post' },
        { status: 404 }
      );
    }

    // Return basic post info with username
    return NextResponse.json({
      success: true,
      username,
      shortcode,
      caption,
      postUrl,
    });

  } catch (error: any) {
    console.error('[Post Scraper] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to scrape post' },
      { status: 500 }
    );
  }
}
