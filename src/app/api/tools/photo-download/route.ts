import { NextRequest, NextResponse } from 'next/server';
import { formatToolUsageSlackMessage, postToSlack } from '@/lib/slack';
import { createClient } from '@/lib/supabase/server';
import { extractImageUrls, extractMetadata } from '../reel-download/route';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET/POST /api/tools/photo-download
 * Extract image URLs from Instagram post by scraping HTML
 */
async function handleRequest(request: NextRequest) {
  try {
    console.log('[Photo Download] Request received:', request.method);
    
    // Support both GET and POST
    let photoUrl: string | null = null;
    let clientIp: string | null = null;
    let ipInfo: Record<string, unknown> | null = null;

    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      photoUrl = searchParams.get('url');
    } else {
      const body = await request.json();
      photoUrl = body.photoUrl || body.url || body.postUrl;
      clientIp = body.clientIp || null;
      ipInfo = body.ipInfo || null;
    }

    console.log('[Photo Download] URL received:', photoUrl);
    console.log('[Photo Download] IP received:', clientIp);

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'Photo URL is required' },
        { status: 400 }
      );
    }

    // Validate URL and extract shortcode
    if (!photoUrl.includes('instagram.com')) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL' },
        { status: 400 }
      );
    }

    // Extract shortcode from various URL formats
    const patterns = [
      /\/p\/([A-Za-z0-9_-]+)/,
      /\/reel\/([A-Za-z0-9_-]+)/,
    ];

    let shortcode: string | null = null;
    for (const pattern of patterns) {
      const match = photoUrl.match(pattern);
      if (match) {
        shortcode = match[1];
        break;
      }
    }

    if (!shortcode) {
      return NextResponse.json(
        { error: 'Could not extract post shortcode from URL' },
        { status: 400 }
      );
    }

    const cleanUrl = `https://www.instagram.com/p/${shortcode}/`;
    console.log('[Photo Download] Fetching shortcode:', shortcode);

    // Fetch Instagram page with proper browser headers
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.instagram.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('Instagram fetch failed:', response.status, response.statusText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Post not found. It may be deleted or private.' },
          { status: 404 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited. Please try again in a few minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Unable to fetch post from Instagram' },
        { status: 502 }
      );
    }

    // Extract image URLs from HTML
    const html = await response.text();
    console.log('[Photo Download] HTML length:', html.length);
    
    const imageUrls = extractImageUrls(html);
    console.log('[Photo Download] Extracted', imageUrls.length, 'images');

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract images. The post may be a video, private, or unavailable.' },
        { status: 404 }
      );
    }

    // Extract additional metadata
    const metadata = extractMetadata(html);

    // Use IP info from client if available, otherwise try to get it server-side
    if (!clientIp || !ipInfo) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const cfConnectingIp = request.headers.get('cf-connecting-ip');
      
      clientIp = clientIp || forwardedFor?.split(',')[0].trim() || 
                 cfConnectingIp || 
                 realIp || 
                 'unknown';
      
      const isLocalhost = clientIp === '::1' || 
                         clientIp === '127.0.0.1' || 
                         clientIp === 'localhost' ||
                         clientIp === '::ffff:127.0.0.1';
      
      if (isLocalhost) {
        console.log('[Photo Download] Localhost detected');
        clientIp = 'localhost';
      }
    }

    // Save to Supabase (best-effort)
    try {
      const supabase = await createClient();
      console.log('[DB] Attempting to save photo download to Supabase...');
      
      const { data: savedData, error: dbError } = await supabase
        .from('tool_usage')
        .insert({
          tool_type: 'instagram-photo-downloader',
          insta_id: metadata.username || null,
          niche: null,
          form_data: {
            photo_url: photoUrl,
            shortcode: shortcode,
            username: metadata.username,
            caption: metadata.caption,
            image_count: imageUrls.length,
          },
          ip_address: clientIp,
          location: ipInfo,
        })
        .select()
        .single();

      if (dbError) {
        console.error('[DB] ❌ Supabase insert error:', {
          error: dbError,
          code: dbError.code,
          message: dbError.message,
        });
      } else {
        console.log('[DB] ✅ Photo download saved successfully to Supabase!', savedData);
      }
    } catch (dbError) {
      console.error('[DB] ❌ Exception saving to Supabase:', dbError);
    }

    // Send Slack notification (best-effort)
    try {
      const slackMessage = formatToolUsageSlackMessage({
        toolType: 'instagram-photo-downloader',
        instaId: photoUrl,
        ip: clientIp,
        ipInfo: ipInfo,
        additionalData: ` Photo Url: ${photoUrl}, Images: ${imageUrls.length}`,
      });
      
      await postToSlack(slackMessage);
      console.log('[Photo Download] Slack notification sent');
    } catch (slackError) {
      console.warn('[Photo Download] Slack notification failed:', slackError);
      // Don't fail the request if Slack fails
    }

    // Return response to frontend
    return NextResponse.json({
      success: true,
      imageUrls,
      imageCount: imageUrls.length,
      isCarousel: imageUrls.length > 1,
      shortcode,
      downloadUrls: imageUrls.map((url, i) => 
        `/api/tools/download-photo?url=${encodeURIComponent(url)}&shortcode=${shortcode}&index=${i}`
      ),
      ...metadata,
    });

  } catch (error) {
    console.error('Error fetching photo:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to fetch photo. Please try again.' },
      { status: 500 }
    );
  }
}

// Support both GET and POST methods
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
