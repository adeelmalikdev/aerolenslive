import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OtpEmailRequest {
  email: string;
  fullName?: string;
  userId?: string;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let otpRecordId: string | null = null;

  try {
    const { email, fullName, userId }: OtpEmailRequest = await req.json();

    if (!email) {
      console.error("Missing email in request");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Generating OTP for email:", normalizedEmail);

    // Check for rate limiting - last_sent_at within 60 seconds
    const { data: existingOtp } = await supabase
      .from("otp_verifications")
      .select("id, last_sent_at")
      .eq("email", normalizedEmail)
      .eq("verified", false)
      .single();

    if (existingOtp?.last_sent_at) {
      const lastSent = new Date(existingOtp.last_sent_at);
      const now = new Date();
      const secondsSinceLastSent = (now.getTime() - lastSent.getTime()) / 1000;
      
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        console.log("Rate limited - must wait", waitSeconds, "seconds");
        return new Response(
          JSON.stringify({ 
            error: `Please wait ${waitSeconds} seconds before requesting a new code`,
            rateLimited: true,
            waitSeconds 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Delete any existing OTPs for this email
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", normalizedEmail);

    // Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    const { data: insertedOtp, error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        email: normalizedEmail,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        user_id: userId || null,
        attempt_count: 0,
        last_sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    otpRecordId = insertedOtp.id;

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      // Clean up the OTP record since we can't send the email
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "AeroLens <noreply@aerolens.live>",
      to: [normalizedEmail],
      subject: "Verify your email - AeroLens",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✈️ AeroLens</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Verify your email</h2>
                      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi${fullName ? ` ${fullName}` : ''},
                      </p>
                      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Use the verification code below to complete your signup:
                      </p>
                      <div style="background: #f3f4f6; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otpCode}</span>
                      </div>
                      <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0;">
                        This code will expire in 10 minutes. If you didn't request this, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} AeroLens. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // Check for Resend errors - this is the critical fix!
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      
      // Clean up the OTP record since email failed
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
      
      // Provide user-friendly error message
      let userMessage = "Failed to send verification email. Please try again.";
      
      // Check for common Resend errors
      const errorMessage = emailResponse.error.message || "";
      if (errorMessage.includes("validation_error") || errorMessage.includes("testing emails")) {
        userMessage = "Email service is in test mode. The sender domain needs to be verified. Please contact support.";
      } else if (errorMessage.includes("rate_limit")) {
        userMessage = "Too many email requests. Please wait a moment and try again.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          details: emailResponse.error.message 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    
    // Clean up OTP record on any error
    if (otpRecordId) {
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
    }
    
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
