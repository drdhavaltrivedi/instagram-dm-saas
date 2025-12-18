import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/server/notifications/notification-service';
import { requireAuth } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth; // Error response

    const count = await notificationService.getUnreadCount(
      auth.userId,
      auth.workspaceId,
    );

    return Response.json({ count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
    const errorMessage = error?.message || 'Failed to get unread count';
    const errorDetails = {
      message: errorMessage,
      name: error?.name,
      code: error?.code,
      meta: error?.meta,
    };
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    return Response.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

