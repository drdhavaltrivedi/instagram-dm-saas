import { randomBytes } from 'crypto';
import { prisma } from '../prisma/client';

// ============================================================================
// Types
// ============================================================================

interface OAuthState {
  workspaceId: string;
  userId: string;
  nonce: string;
}

interface MetaLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count?: number;
}

interface ConnectedAccountResult {
  id: string;
  igUsername: string;
  igUserId: string;
}

// ============================================================================
// Service
// ============================================================================

export class InstagramOAuthService {
  // In-memory state store (use Redis in production)
  private oauthStateStore: Map<string, OAuthState> = new Map();

  /**
   * Generates the Meta OAuth authorization URL.
   */
  async startOAuth(workspaceId: string, userId: string): Promise<string> {
    const clientId = process.env.META_APP_ID;
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error('Meta OAuth is not configured');
    }

    // Generate state parameter for CSRF protection
    const nonce = randomBytes(16).toString('hex');
    const state: OAuthState = { workspaceId, userId, nonce };
    const stateToken = Buffer.from(JSON.stringify(state)).toString('base64url');

    // Store state for validation (TTL should be ~10 minutes in production)
    this.oauthStateStore.set(stateToken, state);

    // Required permissions for Instagram messaging
    const scopes = [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_messaging',
      'pages_read_engagement',
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');

    return authUrl.toString();
  }

  /**
   * Handles the OAuth callback from Meta.
   * NOTE: This method is not currently used. The OAuth flow is implemented
   * directly in /api/instagram/callback route. This method is kept for
   * potential future refactoring.
   */
  async handleOAuthCallback(code: string, stateToken: string): Promise<ConnectedAccountResult> {
    throw new Error(
      'handleOAuthCallback is not implemented. OAuth flow is handled in /api/instagram/callback route.',
    );
  }

  /**
   * Lists all Instagram accounts for a workspace.
   */
  async listAccounts(workspaceId: string) {
    return prisma.instagramAccount.findMany({
      where: { workspaceId },
      select: {
        id: true,
        igUserId: true,
        igUsername: true,
        profilePictureUrl: true,
        isActive: true,
        dailyDmLimit: true,
        dmsSentToday: true,
        createdAt: true,
      },
    });
  }

  /**
   * Disconnects an Instagram account.
   */
  async disconnectAccount(workspaceId: string, accountId: string) {
    const account = await prisma.instagramAccount.findFirst({
      where: { id: accountId, workspaceId },
    });

    if (!account) {
      throw new Error('Instagram account not found');
    }

    await prisma.instagramAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { success: true };
  }

  // ==========================================================================
  // Unused Methods - OAuth flow is handled directly in /api/instagram/callback
  // ==========================================================================
  // These methods were planned but the OAuth flow is implemented directly
  // in the callback route. They are kept for potential future use.
  
  private encryptToken(token: string): string {
    // Token encryption will be implemented in the future
    // For now, tokens are stored as-is (should be encrypted in production)
    return token;
  }
}

export const instagramOAuthService = new InstagramOAuthService();

