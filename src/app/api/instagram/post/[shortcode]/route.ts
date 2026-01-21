import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/instagram/post/[shortcode]
 * Fetch Instagram post details by shortcode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const { shortcode } = params;

    if (!shortcode) {
      return NextResponse.json(
        { success: false, error: 'Post shortcode is required' },
        { status: 400 }
      );
    }

    console.log('[Post API] Fetching post:', shortcode);

    // Try multiple methods to fetch the post
    let data = null;
    let error = null;

    // Method 1: Try the embed endpoint (most reliable)
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      console.log('[Post API] Trying embed endpoint:', embedUrl);
      
      const embedResponse = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (embedResponse.ok) {
        const html = await embedResponse.text();
        
        // Extract JSON data from script tag
        const scriptMatch = html.match(/window\.__additionalDataLoaded\('extra',(\{.*?\})\);/);
        if (scriptMatch) {
          data = JSON.parse(scriptMatch[1]);
          console.log('[Post API] Successfully extracted data from embed');
        }
      }
    } catch (e) {
      console.error('[Post API] Embed method failed:', e);
      error = e;
    }

    // Method 2: Try scraping the main page
    if (!data) {
      try {
        const pageUrl = `https://www.instagram.com/p/${shortcode}/`;
        console.log('[Post API] Trying page scraping:', pageUrl);
        
        const pageResponse = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html',
          },
        });

        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Try to extract from shared data
          const sharedDataMatch = html.match(/window\._sharedData = (\{.*?\});<\/script>/);
          if (sharedDataMatch) {
            const sharedData = JSON.parse(sharedDataMatch[1]);
            const media = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
            if (media) {
              data = { shortcode_media: media };
              console.log('[Post API] Successfully extracted data from _sharedData');
            }
          }
          
          // Try to extract from other script tags
          if (!data) {
            const scriptMatches = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
            for (const match of scriptMatches) {
              try {
                const jsonData = JSON.parse(match[1]);
                if (jsonData['@type'] === 'ImageObject' || jsonData['@type'] === 'VideoObject') {
                  console.log('[Post API] Found structured data:', jsonData);
                  // Convert to our format
                  data = { structuredData: jsonData };
                }
              } catch (e) {
                // Continue trying
              }
            }
          }
        }
      } catch (e) {
        console.error('[Post API] Page scraping failed:', e);
      }
    }

    if (!data) {
      console.error('[Post API] All methods failed to fetch post data');
      return NextResponse.json(
        { success: false, error: 'Could not fetch post data from Instagram. The post may be private or deleted.' },
        { status: 404 }
      );
    }

    // Extract post data from whatever format we got
    const media = data.shortcode_media || data.graphql?.shortcode_media || data.structuredData;
    
    if (!media) {
      console.error('[Post API] No media found in response data');
      return NextResponse.json(
        { success: false, error: 'Post data structure not recognized' },
        { status: 404 }
      );
    }

    // Extract owner information
    const owner = media.owner || media.author;
    
    const postData = {
      success: true,
      post: {
        id: media.id || shortcode,
        shortcode: media.shortcode || shortcode,
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || 
                 media.caption?.text || 
                 media.caption || 
                 media.description || '',
        likeCount: media.edge_media_preview_like?.count || 
                   media.edge_liked_by?.count || 
                   media.like_count || 
                   media.interactionStatistic?.find((s: any) => s.interactionType === 'http://schema.org/LikeAction')?.userInteractionCount || 
                   0,
        commentCount: media.edge_media_to_comment?.count || 
                     media.comment_count || 
                     media.interactionStatistic?.find((s: any) => s.interactionType === 'http://schema.org/CommentAction')?.userInteractionCount || 
                     0,
        displayUrl: media.display_url || 
                   media.image_versions2?.candidates?.[0]?.url || 
                   media.contentUrl || 
                   media.image,
        thumbnail: media.thumbnail_src || 
                  media.image_versions2?.candidates?.[0]?.url || 
                  media.thumbnailUrl || 
                  media.image,
        postUrl: `https://www.instagram.com/p/${shortcode}/`,
        owner: owner ? {
          username: owner.username || owner.identifier?.value || '',
          fullName: owner.full_name || owner.name || '',
          profilePicUrl: owner.profile_pic_url || owner.image || '',
          isVerified: owner.is_verified || false,
          followerCount: owner.edge_followed_by?.count || owner.follower_count,
          followingCount: owner.edge_follow?.count || owner.following_count,
          postCount: owner.edge_owner_to_timeline_media?.count || owner.media_count,
          biography: owner.biography || '',
          externalUrl: owner.external_url || '',
        } : null,
      },
    };

    console.log('[Post API] Successfully processed post data:', {
      shortcode,
      hasOwner: !!postData.post.owner,
      ownerUsername: postData.post.owner?.username,
      followerCount: postData.post.owner?.followerCount
    });
    
    return NextResponse.json(postData);

  } catch (error: any) {
    console.error('[Post API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch post details' },
      { status: 500 }
    );
  }
}
