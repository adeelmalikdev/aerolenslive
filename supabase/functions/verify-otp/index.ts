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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyOtpRequest = await req.json();

    if (!email || !otp) {
      console.error("Missing email or OTP in request");
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Verifying OTP for email:", email);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_code", otp)
      .eq("verified", false)
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP not found or already used:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
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
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("id", otpRecord.id);
      
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Confirm the user's email in auth.users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Update user to confirm email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error("Error confirming email:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to verify email" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Clean up used OTP
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("id", otpRecord.id);

    console.log("Email verified successfully for:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Email verified successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
