/**
 * Slack notification for waiting list signups
 */

export interface SlackNotificationData {
  email: string | null;
  instagramId: string | null;
  message: string | null;
  previousPage: string | null;
  pageURL: string | null;
  region: string;
  city: string;
  country: string;
}

/**
 * Send notification to Slack channel
 */
export async function sendSlackNotification(data: SlackNotificationData): Promise<void> {
  const slackUrl = process.env.SLACK_URL;
  const slackToken = process.env.SLACK_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;

  if (!slackUrl || !slackToken || !slackChannelId) {
    console.warn('Slack configuration missing, skipping notification');
    return;
  }
  
  // Build contact info - show both email and Instagram ID when both are provided
  const contactParts: string[] = [];
  if (data.email) {
    contactParts.push(`Email: ${data.email}`);
  }
  if (data.instagramId) {
    contactParts.push(`Instagram ID: @${data.instagramId}`);
  }
  const contactInfo = contactParts.length > 0 
    ? contactParts.join(' | ') 
    : 'No contact info';

  const payload = {
    channel: slackChannelId,
    blocks: [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: `\n${contactInfo}\nMessage: ${data.message || ''}\nPreviousPage: ${data.previousPage || ''}\nPage: ${data.pageURL || ''}\nRegion: ${data.region || ''}\nCity: ${data.city || ''}\nCountry: ${data.country || ''}`,
              },
            ],
          },
        ],
      },
    ],
  };

  const headers = {
    Authorization: `Bearer ${slackToken}`,
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const response = await fetch(slackUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Slack API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        contactInfo,
        email: data.email,
        instagramId: data.instagramId,
      });
    } else {
      console.log('✅ Slack notification sent successfully:', {
        contactInfo,
        email: data.email,
        instagramId: data.instagramId,
      });
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      contactInfo,
      email: data.email,
      instagramId: data.instagramId,
    });
    // Don't throw - Slack failures shouldn't break the signup
  }
}

