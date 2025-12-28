import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoardingPassRequest {
  bookingReference: string;
  passengerName: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass: string;
  gate?: string;
  seat?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingReference,
      passengerName,
      flightNumber,
      airline,
      origin,
      destination,
      departureTime,
      arrivalTime,
      cabinClass,
      gate = "TBA",
      seat = "TBA",
    }: BoardingPassRequest = await req.json();

    console.log(`Generating boarding pass for ${bookingReference}`);

    // Create PDF document
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [210, 100],
    });

    // Format dates
    const depDate = new Date(departureTime);
    const arrDate = new Date(arrivalTime);
    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // Background gradient effect - main section
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, 155, 100, "F");
    
    // Stub section
    doc.setFillColor(37, 99, 235); // Darker blue
    doc.rect(155, 0, 55, 100, "F");

    // Decorative circles with light opacity (using lighter color instead of alpha)
    doc.setFillColor(100, 160, 246); // Lighter blue for subtle effect
    doc.circle(20, 80, 40, "F");
    doc.circle(140, 20, 30, "F");

    // Dashed line separator
    doc.setDrawColor(255, 255, 255);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(155, 5, 155, 95);
    doc.setLineDashPattern([], 0);

    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("BOARDING PASS", 10, 12);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(airline.toUpperCase(), 10, 22);

    // Flight number badge
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(100, 8, 45, 16, 3, 3, "F");
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.text(flightNumber, 122.5, 18, { align: "center" });

    // Passenger name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PASSENGER", 10, 35);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(passengerName.toUpperCase(), 10, 43);

    // Route - Large
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text(origin, 10, 65);
    
    // Arrow
    doc.setFontSize(16);
    doc.text("→", 55, 63);
    
    doc.setFontSize(32);
    doc.text(destination, 70, 65);

    // Date and time
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

    // Bottom info
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
    doc.text(gate, 50, 98);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SEAT", 75, 92);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(seat, 75, 98);

    // Stub section (right side)
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

    // Generate base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    console.log("Boarding pass PDF generated successfully");

    return new Response(
      JSON.stringify({ 
        pdf: pdfBase64,
        filename: `boarding-pass-${bookingReference}.pdf`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating boarding pass:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
