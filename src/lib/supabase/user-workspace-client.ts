'use client';

import { createClient } from './client';
import type { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

/**
 * Client-side function to get or create user's workspace
 * SIMPLIFIED: Since we're not using the workspace concept,
 * this just returns the user's auth ID as their workspace ID
 */
export async function getOrCreateUserWorkspaceId(): Promise<string | null> {
  const supabase = createClient();
  
  // Get current authenticated user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    console.error('Not authenticated:', authError);
    return null;
  }

  console.log('Using auth user ID as workspace:', authUser.id, authUser.email);

  // Simply return the auth user's ID as the workspace ID
  // This bypasses the need for workspaces/users tables and RLS policies
  return authUser.id;
}

