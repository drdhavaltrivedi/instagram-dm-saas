import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Download endpoint for Instagram Photos
 * Proxies the photo from Instagram CDN to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const shortcode = searchParams.get('shortcode') || 'photo';
    const index = searchParams.get('index') || '0';

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing image URL parameter' },
        { status: 400 }
      );
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);

    // Validate that it's an Instagram CDN URL for security
    if (!decodedUrl.includes('instagram.com') && 
        !decodedUrl.includes('cdninstagram.com') && 
        !decodedUrl.includes('fbcdn.net')) {
      return NextResponse.json(
        { error: 'Invalid image URL. Only Instagram CDN URLs are allowed.' },
        { status: 400 }
      );
    }

    // Fetch the image from Instagram
    let response;
    try {
      response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.instagram.com/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000), // 30 second timeout for images
      });
    } catch (fetchError) {
      console.error('Image proxy fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch image from Instagram', details: fetchError instanceof Error ? fetchError.message : 'Network error' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(`Image proxy: Instagram returned ${response.status} for ${decodedUrl}`);
      return NextResponse.json(
        { error: 'Failed to fetch image', status: response.status },
        { status: response.status }
      );
    }

    // Get the image data
    let imageBuffer;
    try {
      imageBuffer = await response.arrayBuffer();
    } catch (bufferError) {
      console.error('Image buffer error:', bufferError);
      return NextResponse.json(
        { error: 'Failed to read image data' },
        { status: 500 }
      );
    }

    // Get content type from response or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Determine file extension from content type
    const extension = contentType.includes('png') ? 'png' : 'jpg';

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="instagram-photo-${shortcode}-${index}.${extension}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Image download error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
