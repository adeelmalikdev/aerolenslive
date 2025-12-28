import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlightSegment {
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  duration: string;
}

interface BookingEmailRequest {
  to: string;
  userName: string;
  bookingReference: string;
  passengerName: string;
  segments: FlightSegment[];
  totalPrice: string;
  currency?: string;
  cabinClass?: string;
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
      segments,
      totalPrice,
      currency = "USD",
      cabinClass = "Economy",
    }: BookingEmailRequest = await req.json();

    console.log(`Sending booking confirmation to ${to} for reference ${bookingReference}`);

    const segmentsHtml = segments.map((segment, index) => `
      <div style="background: white; border-radius: 12px; padding: 24px; margin: 15px 0; border: 2px solid #3b82f6; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Flight ${index + 1}</div>
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 8px 16px; border-radius: 20px; font-size: 16px; font-weight: bold; letter-spacing: 2px;">
            ✈️ ${segment.flightNumber}
          </div>
        </div>
        <div style="font-size: 14px; color: #374151; margin-bottom: 12px;">
          ${segment.airline}
        </div>
        <div style="display: flex; align-items: center; gap: 20px; margin: 20px 0;">
          <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #1e293b;">${segment.departure}</div>
            <div style="font-size: 12px; color: #64748b;">${segment.departureTime}</div>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
            <div style="height: 2px; flex: 1; background: linear-gradient(90deg, #3b82f6, #93c5fd, #3b82f6);"></div>
            <div style="margin: 0 10px; font-size: 20px;">✈️</div>
            <div style="height: 2px; flex: 1; background: linear-gradient(90deg, #3b82f6, #93c5fd, #3b82f6);"></div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: bold; color: #1e293b;">${segment.arrival}</div>
            <div style="font-size: 12px; color: #64748b;">${segment.arrivalTime}</div>
          </div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 13px;">Duration: ${segment.duration}</div>
      </div>
    `).join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AeroLens Bookings <bookings@aerolens.live>",
        to: [to],
        subject: `✅ Booking Confirmed - ${bookingReference}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-ref { background: white; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .ref-code { font-size: 28px; font-weight: bold; color: #10b981; letter-spacing: 3px; }
              .summary { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; }
              .summary-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
              .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Booking Confirmed!</h1>
                <p>Thank you for booking with us, ${userName || 'Traveler'}!</p>
              </div>
              <div class="content">
                <div class="booking-ref">
                  <div style="font-size: 14px; color: #6b7280;">Your Booking Reference</div>
                  <div class="ref-code">${bookingReference}</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">Please save this for your records</div>
                </div>

                <h3>Passenger Details</h3>
                <div class="summary">
                  <div class="summary-row">
                    <span>Passenger Name:</span> <strong>${passengerName}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Cabin Class:</span> <strong>${cabinClass}</strong>
                  </div>
                </div>

                <h3>Flight Details</h3>
                ${segmentsHtml}

                <div class="summary">
                  <div class="summary-row">
                    <span>Total Price:</span> <strong>${currency} ${totalPrice}</strong>
                  </div>
                </div>

                <div class="important">
                  <strong>⚠️ Important:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Please arrive at the airport at least 2 hours before departure</li>
                    <li>Carry a valid photo ID and this booking confirmation</li>
                    <li>Check airline website for baggage allowance details</li>
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
    console.log("Booking confirmation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending booking confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
