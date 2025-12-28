import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  countryCode?: string;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let createdUserId: string | null = null;
  let otpRecordId: string | null = null;

  try {
    const { email, password, fullName, dateOfBirth, phoneNumber, countryCode }: SignupRequest = await req.json();

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Starting signup process for:", normalizedEmail);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // Check if user is already confirmed
      if (existingUser.email_confirmed_at) {
        console.log("User already exists and is confirmed");
        return new Response(
          JSON.stringify({ error: "This email is already registered. Please sign in instead." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // User exists but not confirmed - we can resend OTP
      console.log("User exists but not confirmed, will resend OTP");
      createdUserId = existingUser.id;
    } else {
      // Create the user with email_confirm: false (no auto-session)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: false, // CRITICAL: Don't auto-confirm, no session created
        user_metadata: {
          full_name: fullName || null,
          date_of_birth: dateOfBirth || null,
          phone_number: phoneNumber || null,
          country_code: countryCode || null,
        },
      });

      if (authError) {
        console.error("Error creating user:", authError);
        
        if (authError.message?.includes("already registered")) {
          return new Response(
            JSON.stringify({ error: "This email is already registered. Please sign in instead." }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        return new Response(
          JSON.stringify({ error: authError.message || "Failed to create account" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      createdUserId = authData.user.id;
      console.log("User created with ID:", createdUserId);
    }

    // Delete any existing OTPs for this email
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", normalizedEmail);

    // Generate and store OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { data: insertedOtp, error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        email: normalizedEmail,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        user_id: createdUserId,
        attempt_count: 0,
        last_sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      // Rollback: delete the created user
      if (createdUserId) {
        await supabase.auth.admin.deleteUser(createdUserId);
      }
      return new Response(
        JSON.stringify({ error: "Failed to setup verification. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    otpRecordId = insertedOtp.id;

    // Send OTP email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      // Rollback
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
      if (createdUserId) {
        await supabase.auth.admin.deleteUser(createdUserId);
      }
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "AeroLens <onboarding@resend.dev>",
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

    // CRITICAL: Check for Resend errors
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      
      // Rollback everything
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
      if (createdUserId) {
        await supabase.auth.admin.deleteUser(createdUserId);
      }
      
      let userMessage = "Failed to send verification email. Please try again.";
      const errorMessage = emailResponse.error.message || "";
      
      if (errorMessage.includes("validation_error") || errorMessage.includes("testing emails")) {
        userMessage = "Email service is in test mode. Please verify a domain in Resend and update the sender email address.";
      } else if (errorMessage.includes("rate_limit")) {
        userMessage = "Too many email requests. Please wait a moment and try again.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          emailError: true 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Signup successful, OTP sent to:", normalizedEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent to your email",
        userId: createdUserId 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in signup-with-otp:", error);
    
    // Rollback on any error
    if (otpRecordId) {
      await supabase.from("otp_verifications").delete().eq("id", otpRecordId);
    }
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId);
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
