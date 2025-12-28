import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const TEAM_EMAILS = [
  "muhammadadeeltariq762@gmail.com",
  "mumarh135@gmail.com"
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();
    console.log("Sending contact form email from:", email);

    // Send email to team
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SkyWay Contact <onboarding@resend.dev>",
        to: TEAM_EMAILS,
        reply_to: email,
        subject: `[Contact Form] ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e40af; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #1e40af; }
              .message-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #1e40af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>📬 New Contact Form Submission</h2>
              </div>
              <div class="content">
                <div class="field">
                  <span class="label">From:</span> ${name}
                </div>
                <div class="field">
                  <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                </div>
                <div class="field">
                  <span class="label">Subject:</span> ${subject}
                </div>
                <div class="field">
                  <span class="label">Message:</span>
                  <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const teamData = await teamEmailResponse.json();
    console.log("Team email response:", teamData);

    if (!teamEmailResponse.ok) {
      throw new Error(teamData.message || "Failed to send team email");
    }

    // Send confirmation to the user
    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SkyWay <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message! ✈️",
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
                <h1>✈️ Thank You, ${name}!</h1>
              </div>
              <div class="content">
                <h2>We've received your message</h2>
                <p>Thank you for reaching out to SkyWay. Our team will review your inquiry and get back to you as soon as possible.</p>
                <p><strong>Your subject:</strong> ${subject}</p>
                <p>We typically respond within 24-48 hours.</p>
                <p>Best regards,<br>The SkyWay Team</p>
              </div>
              <div class="footer">
                <p>This is an automated confirmation email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const confirmationData = await confirmationResponse.json();
    console.log("Confirmation email response:", confirmationData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
