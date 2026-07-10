import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function cleanEmailText(text: string): string {
  if (!text) return "";
  // Split on common email reply separators to strip out quoted reply history
  const separators = [
    "\nOn ",
    "\nFrom: ",
    "---Original Message---",
    "\nOn_",
    "Write your reply above this line",
    "\nOn Tue,",
    "\nOn Wed,",
    "\nOn Thu,",
    "\nOn Fri,",
    "\nOn Sat,",
    "\nOn Sun,",
    "\nOn Mon,"
  ];
  let cleaned = text;
  for (const sep of separators) {
    cleaned = cleaned.split(sep)[0];
  }
  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Inbound Email Webhook Payload received:", payload);

    const { subject, text, from } = payload;
    if (!subject) {
      return NextResponse.json({ error: "Missing subject line" }, { status: 400 });
    }

    // Extract ticket UUID from subject format e.g., "Re: [Ticket #e3a9c...] New Question..."
    const ticketRegex = /\[Ticket #([a-f0-9-]{36})\]/;
    const match = subject.match(ticketRegex);
    const ticketId = match ? match[1] : null;

    if (!ticketId) {
      console.warn("No Ticket ID found in subject line:", subject);
      return NextResponse.json({ error: "Ticket ID not found in subject" }, { status: 200 }); // Return 200 so Resend doesn't retry
    }

    // 1. Fetch ticket from Supabase
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) {
      console.error("Failed to find ticket:", fetchError);
      return NextResponse.json({ error: "Ticket not found in database" }, { status: 200 });
    }

    if (ticket.status === "resolved") {
      console.log(`Ticket ${ticketId} is already resolved. Skipping.`);
      return NextResponse.json({ message: "Ticket already resolved" }, { status: 200 });
    }

    // 2. Clean the organizer's reply to remove quoted text
    const organizerAnswer = cleanEmailText(text);
    if (!organizerAnswer) {
      console.warn("Empty response body after cleaning");
      return NextResponse.json({ error: "Cleaned email body is empty" }, { status: 200 });
    }

    // 3. Email the answer back to the user (if they provided an email address)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(ticket.user_contact)) {
      try {
        const mailFrom = "onboarding@resend.dev";
        await resend.emails.send({
          from: mailFrom,
          to: ticket.user_contact,
          subject: `Hash 12.0 Bot: Answer to your question`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #00ffff; background: #000; padding: 15px; text-align: center; text-transform: uppercase; font-family: monospace; letter-spacing: 2px;">Hash 12.0 Response</h2>
              <p>Hi there,</p>
              <p>An organizer has replied to the question you asked our AI bot:</p>
              <blockquote style="background: #f9f9f9; border-left: 5px solid #666; padding: 12px; margin: 15px 0; color: #555; font-style: italic;">
                "${ticket.question}"
              </blockquote>
              <p><strong>Organizer's Answer:</strong></p>
              <div style="background: #e6ffff; border-left: 5px solid #00ffff; padding: 15px; margin: 15px 0; font-size: 1.05em; color: #003333; font-weight: 500;">
                ${organizerAnswer.replace(/\n/g, "<br/>")}
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
              <p style="color: #888; font-size: 0.85em; text-align: center;">
                This is an automated notification from the DL DAV Shalimar Bagh Hash 12.0 Bot. Please do not reply directly to this message.
              </p>
            </div>
          `,
        });
        console.log(`Forwarded answer to user: ${ticket.user_contact}`);
      } catch (emailError) {
        console.error("Failed to email user:", emailError);
      }
    } else {
      console.log(`User provided phone number (${ticket.user_contact}) instead of email. Organizer must contact manually.`);
    }

    // 4. Save the Q&A to the knowledge base so the chatbot knows it permanently
    const { error: kbError } = await supabase
      .from("knowledge_base")
      .insert([
        {
          question: ticket.question,
          answer: organizerAnswer,
        },
      ]);

    if (kbError) {
      console.error("Failed to save Q&A to knowledge base:", kbError);
    } else {
      console.log("Saved Q&A to database knowledge base.");
    }

    // 5. Mark the ticket as resolved
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: "resolved" })
      .eq("id", ticketId);

    if (updateError) {
      console.error("Failed to mark ticket as resolved:", updateError);
    } else {
      console.log(`Ticket ${ticketId} resolved successfully.`);
    }

    return NextResponse.json({ message: "Inbound email processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Inbound Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
