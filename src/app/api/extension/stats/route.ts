import { NextRequest, NextResponse } from 'next/server';
import { instagramCookieService } from '@/lib/server/instagram/cookie-service';
import { prisma } from '@/lib/server/prisma/client';
import type { InstagramCookies } from '@/lib/server/instagram/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cookies } = body as { cookies: InstagramCookies };

    if (!cookies || !cookies.sessionId || !cookies.dsUserId) {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid cookies. Missing sessionId or dsUserId.',
        },
        { status: 400, headers }
      );
    }

    // Verify session to get Instagram user info
    const userInfo = await instagramCookieService.verifySession(cookies);

    // Find the Instagram account in database to get workspace ID
    const instagramAccount = await prisma.instagramAccount.findFirst({
      where: {
        igUserId: userInfo.pk,
      },
      select: {
        workspaceId: true,
      },
    });

    if (!instagramAccount) {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      return NextResponse.json(
        {
          success: false,
          error: 'Instagram account not found in database. Please connect your account first.',
        },
        { status: 404, headers }
      );
    }

    const workspaceId = instagramAccount.workspaceId;

    // Get messages today: Sum of dms_sent_today from all accounts in workspace
    const accounts = await prisma.instagramAccount.findMany({
      where: {
        workspaceId,
      },
      select: {
        dmsSentToday: true,
      },
    });

    const messagesToday = accounts.reduce((sum, account) => sum + account.dmsSentToday, 0);

    // Get total messages: Count of all OUTBOUND messages in workspace
    // Messages are linked through conversations -> instagramAccount -> workspace
    const totalMessages = await prisma.message.count({
      where: {
        direction: 'OUTBOUND',
        conversation: {
          instagramAccount: {
            workspaceId,
          },
        },
      },
    });

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    return NextResponse.json(
      {
        success: true,
        messagesToday,
        totalMessages,
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Error fetching extension stats:', error);
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        messagesToday: 0,
        totalMessages: 0,
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

