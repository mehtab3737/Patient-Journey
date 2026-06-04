import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, streamChat } from "@/lib/ai/openai";
import { NextRequest } from "next/server";
import { Patient, ChatApiRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body: ChatApiRequest = await request.json();
  const { messages, patientRecord, patientId, conversationId } = body;

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build system prompt with patient context
  const systemPrompt = buildSystemPrompt(patientRecord as Patient | null);

  // Format messages for OpenAI (only user/assistant roles)
  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  try {
    const stream = await streamChat(systemPrompt, chatMessages);

    // Save the user's latest message to DB if we have a conversation
    if (conversationId) {
      const lastUserMsg = messages.filter((m) => m.role === "user").pop();
      if (lastUserMsg) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastUserMsg.content,
        });
      }
    }

    // Stream the response using ReadableStream
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Save assistant response to DB after streaming completes
          if (conversationId) {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: fullResponse,
            });

            // Update conversation timestamp
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get AI response";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
