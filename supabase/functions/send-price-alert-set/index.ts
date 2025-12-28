import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceAlertSetRequest {
  to: string;
  userName: string;
  originName: string;
  originCode: string;
  destinationName: string;
  destinationCode: string;
  targetPrice: number;
  currency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const {
      to,
      userName,
      originName,
      originCode,
      destinationName,
      destinationCode,
      targetPrice,
      currency = "USD",
    }: PriceAlertSetRequest = await req.json();

    console.log(`Sending price alert confirmation to ${to} for ${originCode} → ${destinationCode}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AeroLens Alerts <alerts@aerolens.live>",
        to: [to],
        subject: `🔔 Price Alert Set - ${originCode} → ${destinationCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .route-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .route { font-size: 24px; font-weight: bold; color: #374151; }
              .price-target { background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .price { font-size: 32px; font-weight: bold; color: #d97706; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              .info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 Price Alert Active!</h1>
                <p>We're tracking prices for you, ${userName || 'Traveler'}!</p>
              </div>
              <div class="content">
                <div class="route-card">
                  <p style="color: #6b7280; margin-bottom: 5px;">Watching route</p>
                  <div class="route">${originCode} ✈️ ${destinationCode}</div>
                  <p style="color: #6b7280; margin-top: 10px;">${originName} → ${destinationName}</p>
                </div>

                <div class="price-target">
                  <p style="color: #6b7280; margin: 0;">Target Price</p>
                  <div class="price">${currency} ${targetPrice}</div>
                  <p style="color: #6b7280; margin: 10px 0 0 0;">We'll notify you when prices drop below this!</p>
                </div>

                <div class="info">
                  <strong>💡 How it works:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>We monitor flight prices regularly</li>
                    <li>When price drops below ${currency} ${targetPrice}, you'll get an email</li>
                    <li>You can manage alerts from your dashboard anytime</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>Happy travels!</p>
                <p>© ${new Date().getFullYear()} AeroLens. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("Price alert set email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending price alert set email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
