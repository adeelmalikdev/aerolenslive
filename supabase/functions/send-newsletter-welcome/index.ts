import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterWelcomeRequest {
  email: string;
}

// Verified email that can receive test emails without domain verification
const VERIFIED_EMAIL = "muhammadadeeltariq762@gmail.com";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterWelcomeRequest = await req.json();
    console.log("Newsletter subscription for:", email);

    // Without a verified domain, we can only send to the account owner's email
    // Log the subscription and return success - the user is still subscribed in the database
    if (email.toLowerCase() !== VERIFIED_EMAIL.toLowerCase()) {
      console.log("Skipping welcome email - domain not verified. User is still subscribed.");
      return new Response(
        JSON.stringify({ success: true, emailSent: false, reason: "domain_not_verified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SkyWay <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to SkyWay Newsletter! ✈️",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Welcome to SkyWay!</h1>
              </div>
              <div class="content">
                <h2>Thank you for subscribing!</h2>
                <p>You're now part of our exclusive community. Get ready to receive:</p>
                <ul>
                  <li>🎯 Exclusive flight deals and discounts</li>
                  <li>🌍 Travel tips and destination guides</li>
                  <li>📢 Early access to special promotions</li>
                  <li>💰 Price drop alerts on your favorite routes</li>
                </ul>
                <p>Stay tuned for amazing deals coming your way!</p>
                <p>Happy travels,<br>The SkyWay Team</p>
              </div>
              <div class="footer">
                <p>You received this email because you subscribed to SkyWay newsletter.</p>
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
      // Don't throw - just log and return success since subscription was saved
      console.error("Email send failed but subscription saved:", data.message);
      return new Response(
        JSON.stringify({ success: true, emailSent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, emailSent: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in newsletter welcome:", error);
    // Return success anyway - the subscription is saved in the database
    return new Response(
      JSON.stringify({ success: true, emailSent: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
