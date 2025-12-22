import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, instagram_id } = body as {
      email: string | null;
      instagram_id: string | null;
    };

    // Validate that at least one field is provided
    if (!email && !instagram_id) {
      return NextResponse.json(
        { success: false, error: 'Either email or instagram_id is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate Instagram ID format if provided
    if (instagram_id) {
      const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
      if (!instagramRegex.test(instagram_id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid Instagram ID format' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Insert into waiting_list table
    const { data, error } = await supabase
      .from('waiting_list')
      .insert({
        email: email || null,
        instagram_id: instagram_id || null,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate email error gracefully
      if (error.code === '23505' || error.message.includes('unique')) {
        return NextResponse.json(
          { success: false, error: 'This email is already on the waiting list' },
          { status: 409 }
        );
      }

      console.error('Error inserting into waiting_list:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to join waiting list. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined waiting list',
      data,
    });
  } catch (error: any) {
    console.error('Error in waiting-list API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
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

