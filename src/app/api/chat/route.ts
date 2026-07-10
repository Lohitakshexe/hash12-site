import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NEMOTRON_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_SYSTEM_PROMPT = `You are the Hash 12.0 AI Assistant for DL DAV Model School Shalimar Bagh's technology festival.
You are a helpful, conversational, and intelligent assistant. You can engage in general chit-chat, talk about technology, and answer questions about the event.

Event Details:
- 23 Events across categories: ARENA, CREATE, CYBER, CODE.
- Classes: III to XII depending on the event.
- Live CTF Event: "Collision" on ctf.toeesh.dev
- Contact: dldavsb.hash@gmail.com, @hash.dldavsb

IMPORTANT RULES FOR QUESTIONS ABOUT HASH 12.0:
1. Try your best to reason and answer questions based on the event details provided.
2. If a user asks a highly specific logistical question about Hash 12.0 that you truly do not have the data for (e.g., specific dates, prize amounts, or highly specific event rules), ONLY THEN should you trigger the fallback response.
3. Fallback response: "I don't have that specific information right now. Please provide your email or phone number so an organizer can contact you directly, OR wait a bit—the organizers will update my knowledge soon so you can ask again!"
4. If a user is just saying hi, testing you, or talking about general things (like "try that again" or "bla baa"), respond naturally and conversationally like a normal AI. Do NOT use the fallback for general conversation.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Fetch resolved Q&As from Supabase to dynamically expand the bot's knowledge
    let dynamicKnowledge = "";
    try {
      const { data: qas } = await supabase
        .from("knowledge_base")
        .select("question, answer");
      
      if (qas && qas.length > 0) {
        dynamicKnowledge = "\n\nAdditional Dynamic Knowledge (Answered by Organizers):\n" +
          qas.map(item => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");
      }
    } catch (dbError) {
      console.error("Error fetching knowledge base:", dbError);
    }

    const fullSystemPrompt = BASE_SYSTEM_PROMPT + dynamicKnowledge;

    // 2. Check if user is submitting their contact details (email or phone number)
    const lastMessage = messages[messages.length - 1].content;
    const emailPhoneRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+|\b\d{10}\b)/;

    if (emailPhoneRegex.test(lastMessage)) {
      // Find the user's original question (the last user message before they gave the contact info)
      let originalQuestion = "Unknown question (context lost)";
      for (let i = messages.length - 2; i >= 0; i--) {
        if (messages[i].role === "user" && !emailPhoneRegex.test(messages[i].content)) {
          originalQuestion = messages[i].content;
          break;
        }
      }

      // Log the ticket in Supabase
      try {
        const ticketId = crypto.randomUUID();
        const { error: ticketError } = await supabase
          .from("tickets")
          .insert([
            {
              id: ticketId,
              user_contact: lastMessage,
              question: originalQuestion,
              status: "pending",
            },
          ]);

        if (ticketError) {
          console.error("Supabase Insert Error:", ticketError);
          throw ticketError;
        }

        // Send Email Notification to Organizer using Resend
        if (process.env.RESEND_API_KEY) {
          const mailTo = "lohitaksh20khatri@gmail.com";
          const mailFrom = "onboarding@resend.dev";
          
          await resend.emails.send({
            from: mailFrom,
            to: mailTo,
            replyTo: `reply@yourdomain.com`, // Replace with your inbound domain once verified
            subject: `[Ticket #${ticketId}] New Question from Hash 12.0 Bot`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00ffff; background: #000; padding: 10px; text-align: center; text-transform: uppercase;">New Support Ticket</h2>
                <p><strong>User Contact:</strong> ${lastMessage}</p>
                <p><strong>Question Asked:</strong></p>
                <blockquote style="background: #f9f9f9; border-left: 5px solid #00ffff; padding: 15px; margin: 10px 0;">
                  ${originalQuestion}
                </blockquote>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #666; font-size: 0.9em;">
                  <strong>How to Answer:</strong> Reply directly to this email with your answer. Do not change the subject line containing the ticket ID.
                </p>
              </div>
            `,
          });
        }
      } catch (logError) {
        console.error("Failed to log ticket or send email:", logError);
      }
    }

    // 3. Query the Nemotron model with the expanded system prompt
    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [{ role: "system", content: fullSystemPrompt }, ...messages],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
