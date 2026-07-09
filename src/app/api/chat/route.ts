import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NEMOTRON_API_KEY,
});

const SYSTEM_PROMPT = `You are the Hash 12.0 AI Assistant for DL DAV Model School Shalimar Bagh's technology festival.
Your goal is to answer questions about the event.

Event Details:
- 23 Events across categories: ARENA, CREATE, CYBER, CODE.
- Classes: III to XII depending on the event.
- Live CTF Event: "Collision" on ctf.toeesh.dev
- Contact: dldavsb.hash@gmail.com, @hash.dldavsb

IMPORTANT FALLBACK RULE:
If a user asks a question about Hash 12 that you DO NOT know the answer to (e.g. specific dates, prize amounts, or highly specific rules not listed above), you MUST reply exactly with a variation of:
"I don't have that information right now. Please provide your name and email/phone number to have an organizer contact you directly, OR wait for a short while, the organisers will soon update the bot to answer your question, then reask."

If the user then provides their contact information, thank them and assure them an organizer will reach out soon.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // If user provided contact info (simple regex check for demo purposes), we log it server-side.
    const lastMessage = messages[messages.length - 1].content;
    const emailPhoneRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+|\b\d{10}\b)/;
    if (emailPhoneRegex.test(lastMessage)) {
      const logPath = path.join(process.cwd(), "contact_requests.txt");
      fs.appendFileSync(logPath, `New Contact Request: ${lastMessage}\n`);
    }

    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
