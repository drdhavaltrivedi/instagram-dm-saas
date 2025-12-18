import { NextRequest, NextResponse } from 'next/server';
import { instagramCookieService } from '@/lib/server/instagram/cookie-service';
import { prisma } from '@/lib/server/prisma/client';
import { requireAuth } from '@/lib/server/auth';
import type { InstagramCookies } from '@/lib/server/instagram/types';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth; // Error response

    const { cookies, accountId } = await request.json() as {
      cookies: InstagramCookies;
      accountId: string;
    };

    if (!cookies || !cookies.sessionId || !cookies.dsUserId) {
      return NextResponse.json(
        { success: false, error: 'Invalid cookies provided' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    const finalWorkspaceId = auth.workspaceId;
    
    // Get inbox threads from Instagram
    const threads = await instagramCookieService.getInbox(cookies, 20);
    
    let syncedConversations = 0;
    let syncedMessages = 0;

    for (const thread of threads) {
      try {
        // Get the other user (not self)
        const otherUser = thread.users[0];
        if (!otherUser) continue;

        // Create or update contact
        const contact = await prisma.contact.upsert({
          where: {
            igUserId_workspaceId: {
              igUserId: otherUser.pk,
              workspaceId: finalWorkspaceId,
            },
          },
          create: {
            workspaceId: finalWorkspaceId,
            igUserId: otherUser.pk,
            igUsername: otherUser.username,
            name: otherUser.fullName,
            profilePictureUrl: otherUser.profilePicUrl,
          },
          update: {
            igUsername: otherUser.username,
            name: otherUser.fullName,
            profilePictureUrl: otherUser.profilePicUrl,
          },
        });

        // Create or update conversation
        const conversation = await prisma.conversation.upsert({
          where: {
            instagramAccountId_contactId: {
              instagramAccountId: accountId,
              contactId: contact.id,
            },
          },
          create: {
            instagramAccountId: accountId,
            contactId: contact.id,
            status: 'OPEN',
            lastMessageAt: new Date(thread.lastActivity).toISOString(),
            unreadCount: thread.unreadCount,
          },
          update: {
            lastMessageAt: new Date(thread.lastActivity).toISOString(),
            unreadCount: thread.unreadCount,
          },
        });

        syncedConversations++;

        // Fetch and sync messages for this thread
        const messages = await instagramCookieService.getThreadMessages(
          cookies,
          thread.threadId,
          30
        );

        for (const msg of messages) {
          if (!msg.text) continue;

          // Determine if this is from us or from them
          const isFromUs = msg.userId === cookies.dsUserId;

          // Check if message already exists
          const existing = await prisma.message.findFirst({
            where: {
              conversationId: conversation.id,
              igMessageId: msg.itemId,
            },
          });

          if (!existing) {
            // Determine message status
            // For outbound messages, check if they've been read
            let messageStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' = 'DELIVERED';
            if (isFromUs) {
              // Check if message has been read (Instagram provides read receipts)
              messageStatus = (msg as any).readAt ? 'READ' : ((msg as any).deliveredAt ? 'DELIVERED' : 'SENT');
            }

            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                igMessageId: msg.itemId,
                content: msg.text,
                messageType: 'TEXT',
                direction: isFromUs ? 'OUTBOUND' : 'INBOUND',
                status: messageStatus,
                sentAt: new Date(msg.timestamp).toISOString(),
                deliveredAt: (msg as any).deliveredAt ? new Date((msg as any).deliveredAt).toISOString() : null,
                readAt: (msg as any).readAt ? new Date((msg as any).readAt).toISOString() : null,
                createdAt: new Date(msg.timestamp).toISOString(),
              },
            });

            syncedMessages++;
          } else {
            // Update existing message status if it's an outbound message
            if (isFromUs && existing.direction === 'OUTBOUND') {
              const updateData: any = {};
              if ((msg as any).readAt && !existing.readAt) {
                updateData.readAt = new Date((msg as any).readAt).toISOString();
                updateData.status = 'READ';
              } else if ((msg as any).deliveredAt && !existing.deliveredAt) {
                updateData.deliveredAt = new Date((msg as any).deliveredAt).toISOString();
                if (existing.status !== 'READ') {
                  updateData.status = 'DELIVERED';
                }
              }

              if (Object.keys(updateData).length > 0) {
                await prisma.message.update({
                  where: { id: existing.id },
                  data: updateData,
                });
              }
            }
          }
        }

        // Update conversation status - check if user accepted our first message
        // Find the first outbound message (oldest outbound message)
        const firstOutboundMessage = await prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            direction: 'OUTBOUND',
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (firstOutboundMessage) {
          // Check if there are any inbound messages after the first outbound (user accepted)
          const hasInboundAfterFirst = await prisma.message.findFirst({
            where: {
              conversationId: conversation.id,
              direction: 'INBOUND',
              createdAt: {
                gt: firstOutboundMessage.createdAt,
              },
            },
          });

          // Note: isRequestPending field doesn't exist in schema, so we skip that update
          // The conversation status can be used to track this if needed in the future
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (threadError: any) {
        console.error(`Error syncing thread ${thread.threadId}:`, threadError);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      syncedConversations,
      syncedMessages,
    });
  } catch (error: any) {
    console.error('Error syncing inbox:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync inbox',
      },
      { status: 500 }
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

