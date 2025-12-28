import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceAlertEmailRequest {
  to: string;
  userName: string;
  originName: string;
  originCode: string;
  destinationName: string;
  destinationCode: string;
  targetPrice: number;
  currentPrice: number;
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
      currentPrice,
      currency = "USD",
    }: PriceAlertEmailRequest = await req.json();

    console.log(`Sending price alert email to ${to} for ${originCode} -> ${destinationCode}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SkyScanner <onboarding@resend.dev>",
        to: [to],
        subject: `🎉 Price Drop Alert: ${originCode} → ${destinationCode} now ${currency} ${currentPrice}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .price-box { background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .current-price { font-size: 36px; font-weight: bold; color: #10b981; }
              .target-price { color: #6b7280; text-decoration: line-through; }
              .route { font-size: 18px; color: #374151; margin: 10px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Price Alert!</h1>
                <p>Great news, ${userName || 'Traveler'}!</p>
              </div>
              <div class="content">
                <p>The flight you've been watching just dropped in price!</p>
                
                <div class="price-box">
                  <div class="route">
                    <strong>${originName} (${originCode})</strong>
                    <br/>→<br/>
                    <strong>${destinationName} (${destinationCode})</strong>
                  </div>
                  <div class="target-price">Your target: ${currency} ${targetPrice}</div>
                  <div class="current-price">${currency} ${currentPrice}</div>
                  <p style="color: #10b981; font-weight: bold;">
                    You save ${currency} ${(targetPrice - currentPrice).toFixed(2)}!
                  </p>
                </div>
                
                <p>Don't wait too long – flight prices can change quickly!</p>
              </div>
              <div class="footer">
                <p>You're receiving this because you set up a price alert on SkyScanner.</p>
                <p>© ${new Date().getFullYear()} SkyScanner. All rights reserved.</p>
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
    console.log("Price alert email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending price alert email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
