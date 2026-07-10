import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { ticketId, answer } = await req.json();

    if (!ticketId || !answer) {
      return NextResponse.json({ error: "Missing ticketId or answer" }, { status: 400 });
    }

    // 1. Fetch ticket from Supabase
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) {
      console.error("Failed to find ticket:", fetchError);
      return NextResponse.json({ error: "Ticket not found in database" }, { status: 404 });
    }

    if (ticket.status === "resolved") {
      return NextResponse.json({ error: "Ticket already resolved" }, { status: 400 });
    }

    // 2. Email the answer back to the user
    // Extract email from the contact string (e.g. "yea please, udayan1702@gmail.com")
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = ticket.user_contact.match(emailRegex);
    
    if (emailMatch) {
      const userEmail = emailMatch[1];
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: userEmail,
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
                ${answer.replace(/\n/g, "<br/>")}
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
              <p style="color: #888; font-size: 0.85em; text-align: center;">
                This is an automated notification from the DL DAV Shalimar Bagh Hash 12.0 Bot.
              </p>
            </div>
          `,
        });
        console.log(`Forwarded answer to user: ${userEmail}`);
      } catch (emailError) {
        console.error("Failed to email user:", emailError);
      }
    } else {
      console.log(`User provided phone number (${ticket.user_contact}) instead of email. Manual contact needed.`);
    }

    // 3. Save the Q&A to the knowledge base
    const { error: kbError } = await supabase
      .from("knowledge_base")
      .insert([
        {
          question: ticket.question,
          answer: answer,
        },
      ]);

    if (kbError) console.error("Failed to save Q&A:", kbError);

    // 4. Mark the ticket as resolved
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: "resolved" })
      .eq("id", ticketId);

    if (updateError) console.error("Failed to mark ticket resolved:", updateError);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Answer Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
