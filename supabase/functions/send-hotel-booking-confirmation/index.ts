import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HotelBookingEmailRequest {
  to: string;
  userName: string;
  bookingReference: string;
  guestName: string;
  hotelName: string;
  hotelAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  roomType?: string;
  totalPrice: string;
  currency?: string;
  nights: number;
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
      guestName,
      hotelName,
      hotelAddress,
      checkInDate,
      checkOutDate,
      roomType,
      totalPrice,
      currency = "USD",
      nights,
    }: HotelBookingEmailRequest = await req.json();

    console.log(`Sending hotel booking confirmation to ${to} for reference ${bookingReference}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AeroLens Hotels <hotels@aerolens.live>",
        to: [to],
        subject: `✅ Hotel Booking Confirmed - ${bookingReference}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-ref { background: white; border: 2px dashed #0ea5e9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .ref-code { font-size: 28px; font-weight: bold; color: #0ea5e9; letter-spacing: 3px; }
              .hotel-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .dates-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .date-box { background: white; border-radius: 10px; padding: 15px; text-align: center; }
              .summary { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .summary-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              .important { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏨 Hotel Booking Confirmed!</h1>
                <p>Thank you for booking with us, ${userName || 'Guest'}!</p>
              </div>
              <div class="content">
                <div class="booking-ref">
                  <div style="font-size: 14px; color: #6b7280;">Your Confirmation Number</div>
                  <div class="ref-code">${bookingReference}</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">Present this at check-in</div>
                </div>

                <div class="hotel-card">
                  <h3 style="margin-top: 0; color: #0284c7;">🏨 ${hotelName}</h3>
                  ${hotelAddress ? `<p style="color: #6b7280; margin: 5px 0;">📍 ${hotelAddress}</p>` : ''}
                  ${roomType ? `<p style="color: #374151;"><strong>Room:</strong> ${roomType}</p>` : ''}
                </div>

                <div class="dates-grid">
                  <div class="date-box">
                    <div style="color: #6b7280; font-size: 12px;">CHECK-IN</div>
                    <div style="font-size: 18px; font-weight: bold; color: #374151;">${checkInDate}</div>
                    <div style="color: #6b7280; font-size: 12px;">After 3:00 PM</div>
                  </div>
                  <div class="date-box">
                    <div style="color: #6b7280; font-size: 12px;">CHECK-OUT</div>
                    <div style="font-size: 18px; font-weight: bold; color: #374151;">${checkOutDate}</div>
                    <div style="color: #6b7280; font-size: 12px;">Before 11:00 AM</div>
                  </div>
                </div>

                <div class="summary">
                  <div class="summary-row">
                    <span>Guest Name:</span> <strong>${guestName}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Duration:</span> <strong>${nights} night${nights > 1 ? 's' : ''}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Total Price:</span> <strong>${currency} ${totalPrice}</strong>
                  </div>
                </div>

                <div class="important">
                  <strong>✅ What to bring:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Valid photo ID</li>
                    <li>Credit card for incidentals</li>
                    <li>This confirmation email</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>Questions? Contact our support team anytime.</p>
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
    console.log("Hotel booking confirmation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending hotel booking confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
