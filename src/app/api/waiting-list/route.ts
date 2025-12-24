import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIP, getIPLocation } from "@/lib/waiting-list/ip-utils";
import { sendSlackNotification } from "@/lib/waiting-list/slack";
import {
  validateEmail,
  validateInstagramId,
} from "@/lib/waiting-list/validation";

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, instagram_id, message, previous_page, client_ip } = body as {
      email: string | null;
      instagram_id: string | null;
      message?: string | null;
      previous_page?: string | null;
      client_ip?: string | null;
    };

    // Get client IP - prefer client-provided IP (from ipify.org), fallback to headers
    // This avoids localhost issues (::1, 127.0.0.1) when running locally
    let clientIP = client_ip || getClientIP(request);

    // Skip location lookup for localhost IPs (they won't work with ipapi.co)
    const isLocalhost =
      clientIP === "::1" ||
      clientIP === "127.0.0.1" ||
      clientIP === "localhost" ||
      clientIP === "unknown";

    const referer = request.headers.get("referer");
    const pageURL = referer || null;
    const previousPage = previous_page || null;

    // Start location lookup (non-blocking) - only if not localhost
    const locationPromise = isLocalhost
      ? Promise.resolve(null)
      : getIPLocation(clientIP);

    // Validation
    if (!email && !instagram_id) {
      return NextResponse.json(
        { success: false, error: "Either email or instagram_id is required" },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (instagram_id && !validateInstagramId(instagram_id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Instagram ID format" },
        { status: 400 }
      );
    }

    // Save to database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("waiting_list")
      .insert({
        email: email || null,
        instagram_id: instagram_id || null,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate email
      if (error.code === "23505" || error.message.includes("unique")) {
        return NextResponse.json(
          {
            success: false,
            error: "This email is already on the waiting list",
          },
          { status: 409 }
        );
      }

      console.error("Error inserting into waiting_list:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to join waiting list. Please try again.",
        },
        { status: 500 }
      );
    }

    // Send Slack notification (non-blocking, async)
    locationPromise
      .then((location) => {
        return sendSlackNotification({
          email: email || null,
          instagramId: instagram_id || null,
          message: message || null,
          previousPage,
          pageURL,
          region: location?.region || "",
          city: location?.city || "",
          country: location?.country || "",
        });
      })
      .catch((err) => {
        console.error("Error in Slack notification flow:", err);
        // Send notification even if location lookup fails
        sendSlackNotification({
          email: email || null,
          instagramId: instagram_id || null,
          message: message || null,
          previousPage,
          pageURL,
          region: "",
          city: "",
          country: "",
        }).catch(console.error);
      });

    return NextResponse.json({
      success: true,
      message: "Successfully joined waiting list",
      data,
    });
  } catch (error: any) {
    console.error("Error in waiting-list API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
