import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

const MAX_ATTEMPTS = 5;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();

    if (!email || !otp) {
      console.error("Missing email or OTP in request");
      return new Response(
        JSON.stringify({ error: "Email and verification code are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = otp.trim();

    console.log("Verifying OTP for email:", normalizedEmail);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("verified", false)
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new one." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check attempt count
    if (otpRecord.attempt_count >= MAX_ATTEMPTS) {
      console.error("Too many failed attempts");
      // Delete the OTP record to force requesting a new one
      await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ 
          error: "Too many failed attempts. Please request a new verification code.",
          locked: true 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      console.error("OTP expired");
      // Delete expired OTP
      await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ 
          error: "Verification code has expired. Please request a new one.",
          expired: true 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if OTP matches
    if (otpRecord.otp_code !== normalizedOtp) {
      console.error("Invalid OTP code");
      // Increment attempt count
      const newAttemptCount = (otpRecord.attempt_count || 0) + 1;
      await supabase
        .from("otp_verifications")
        .update({ attempt_count: newAttemptCount })
        .eq("id", otpRecord.id);
      
      const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
      return new Response(
        JSON.stringify({ 
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // OTP is valid! Now confirm the user's email
    console.log("OTP verified, confirming user email");

    // Get user_id from OTP record or find by email
    let userId = otpRecord.user_id;
    
    if (!userId) {
      // Fallback: find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
      userId = user?.id;
    }

    if (userId) {
      // Confirm the user's email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (updateError) {
        console.error("Error confirming email:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to verify email. Please try again." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("Email confirmed for user:", userId);
    } else {
      console.warn("No user found for email:", normalizedEmail);
    }

    // Delete the used OTP record
    await supabase.from("otp_verifications").delete().eq("id", otpRecord.id);

    console.log("OTP verification complete for:", normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email verified successfully",
        userId 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
