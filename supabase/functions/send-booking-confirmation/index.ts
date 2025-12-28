import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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

    // Generate boarding pass PDF
    const firstSegment = segments[0];
    const pdfBase64 = generateBoardingPassPDF({
      bookingReference,
      passengerName,
      flightNumber: firstSegment.flightNumber,
      airline: firstSegment.airline,
      origin: firstSegment.departure,
      destination: firstSegment.arrival,
      departureTime: firstSegment.departureTime,
      arrivalTime: firstSegment.arrivalTime,
      cabinClass: cabinClass || "Economy",
    });

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
        attachments: [
          {
            filename: `boarding-pass-${bookingReference}.pdf`,
            content: pdfBase64,
          },
        ],
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

function generateBoardingPassPDF(data: {
  bookingReference: string;
  passengerName: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass: string;
}): string {
  const { bookingReference, passengerName, flightNumber, airline, origin, destination, departureTime, arrivalTime, cabinClass } = data;
  
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [210, 100],
  });

  const depDate = new Date(departureTime);
  const arrDate = new Date(arrivalTime);
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 155, 100, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(155, 0, 55, 100, "F");

  doc.setFillColor(255, 255, 255);
  doc.setGlobalAlpha(0.1);
  doc.circle(20, 80, 40, "F");
  doc.circle(140, 20, 30, "F");
  doc.setGlobalAlpha(1);

  doc.setDrawColor(255, 255, 255);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(155, 5, 155, 95);
  doc.setLineDashPattern([], 0);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("BOARDING PASS", 10, 12);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(airline.toUpperCase(), 10, 22);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(100, 8, 45, 16, 3, 3, "F");
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(12);
  doc.text(flightNumber, 122.5, 18, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("PASSENGER", 10, 35);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(passengerName.toUpperCase(), 10, 43);

  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(origin, 10, 65);
  doc.setFontSize(16);
  doc.text("→", 55, 63);
  doc.setFontSize(32);
  doc.text(destination, 70, 65);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DATE", 10, 75);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(formatDate(depDate), 10, 82);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DEPARTURE", 70, 75);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(formatTime(depDate), 70, 84);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ARRIVAL", 105, 75);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(formatTime(arrDate), 105, 84);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CLASS", 10, 92);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(cabinClass.toUpperCase(), 10, 98);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("GATE", 50, 92);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TBA", 50, 98);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SEAT", 75, 92);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TBA", 75, 98);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("FLIGHT", 162, 15);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(flightNumber, 162, 23);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("FROM", 162, 35);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(origin, 162, 45);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TO", 162, 55);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(destination, 162, 65);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("BOOKING REF", 162, 78);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(bookingReference, 162, 86);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AeroLens", 162, 95);

  return doc.output("datauristring").split(",")[1];
}

serve(handler);
