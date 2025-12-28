import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupWelcomeRequest {
  email: string;
  fullName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: SignupWelcomeRequest = await req.json();
    const name = fullName || "Traveler";
    console.log("Sending signup welcome email to:", email);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AeroLens <noreply@aerolens.live>",
        to: [email],
        subject: "Welcome to AeroLens! ✈️ Your Journey Begins",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .feature { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
              .feature-icon { font-size: 24px; margin-right: 15px; }
              .button { display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Welcome Aboard, ${name}!</h1>
                <p style="margin: 0; opacity: 0.9;">Your adventure starts here</p>
              </div>
              <div class="content">
                <h2>You're all set! 🎉</h2>
                <p>Thank you for joining AeroLens. We're excited to help you discover the best flight deals and plan unforgettable journeys.</p>
                
                <h3>What you can do now:</h3>
                
                <div class="feature">
                  <span class="feature-icon">🔍</span>
                  <div>
                    <strong>Search Flights</strong><br>
                    <span style="color: #666;">Compare prices from hundreds of airlines</span>
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">💰</span>
                  <div>
                    <strong>Set Price Alerts</strong><br>
                    <span style="color: #666;">Get notified when prices drop on your favorite routes</span>
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">❤️</span>
                  <div>
                    <strong>Save Searches</strong><br>
                    <span style="color: #666;">Quick access to your frequent routes</span>
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">🏨</span>
                  <div>
                    <strong>Find Hotels</strong><br>
                    <span style="color: #666;">Complete your trip with perfect accommodations</span>
                  </div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="${Deno.env.get("SITE_URL") || "https://aerolens.live"}" class="button" style="color: white;">Start Exploring</a>
                </div>

                <p>Happy travels,<br>The AeroLens Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} AeroLens. All rights reserved.</p>
                <p>You received this email because you created an account on AeroLens.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await response.json();
    console.log("Resend API response:", data);

    if (!response.ok) {
      console.error("Email send failed:", data);
      return new Response(
        JSON.stringify({ success: true, emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending signup welcome email:", error);
    return new Response(
      JSON.stringify({ success: true, emailSent: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
