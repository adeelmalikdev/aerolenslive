import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckInEmailRequest {
  to: string;
  userName: string;
  bookingReference: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureTime: string;
  airline: string;
  flightNumber: string;
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
      bookingReference,
      passengerName,
      origin,
      destination,
      departureTime,
      airline,
      flightNumber,
    }: CheckInEmailRequest = await req.json();

    console.log(`Sending check-in confirmation to ${to} for reference ${bookingReference}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AeroLens <bookings@aerolens.live>",
        to: [to],
        subject: `✅ Check-in Complete - ${bookingReference}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-ref { background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .ref-code { font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 3px; }
              .flight-info { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              .checklist { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎫 Check-in Complete!</h1>
                <p>You're all set for your flight, ${userName || 'Traveler'}!</p>
              </div>
              <div class="content">
                <div class="booking-ref">
                  <div style="font-size: 14px; color: #6b7280;">Booking Reference</div>
                  <div class="ref-code">${bookingReference}</div>
                </div>

                <div class="flight-info">
                  <h3 style="margin-top: 0;">Flight Details</h3>
                  <p><strong>Passenger:</strong> ${passengerName}</p>
                  <p><strong>Flight:</strong> ${airline} ${flightNumber}</p>
                  <p><strong>Route:</strong> ${origin} → ${destination}</p>
                  <p><strong>Departure:</strong> ${departureTime}</p>
                </div>

                <div class="checklist">
                  <strong>✅ Pre-flight Checklist:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Save or print your boarding pass</li>
                    <li>Arrive at the airport at least 2 hours early</li>
                    <li>Carry valid photo ID</li>
                    <li>Check baggage allowance before packing</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>Have a great flight!</p>
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
    console.log("Check-in confirmation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending check-in confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
