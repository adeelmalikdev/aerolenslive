import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();
    console.log("Sending password reset email to:", email);

    // Create admin client to generate reset link
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate password reset link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      throw new Error("Failed to generate reset link");
    }

    const hashedToken = data.properties?.hashed_token;
    const actionLink = data.properties?.action_link;

    // Prefer token_hash links (resilient against email clients that prefetch GET /verify links)
    const resetLink = hashedToken
      ? `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : actionLink;

    if (!resetLink) {
      throw new Error("No reset link generated");
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AeroLens <noreply@aerolens.live>",
        to: [email],
        subject: "Reset Your Password - AeroLens",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #1e3a8a; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset the password for your AeroLens account.</p>
                <p>Click the button below to set a new password:</p>
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button" style="color: white;">Reset Password</a>
                </div>
                <div class="warning">
                  <strong>⏰ This link expires in 1 hour.</strong><br>
                  If you didn't request a password reset, you can safely ignore this email.
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
                <p>Safe travels,<br>The AeroLens Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AeroLens. All rights reserved.</p>
                <p>You received this email because a password reset was requested for your account.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const resendData = await response.json();
    console.log("Resend API response:", resendData);

    if (!response.ok) {
      console.error("Email send failed:", resendData);
      throw new Error(resendData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
