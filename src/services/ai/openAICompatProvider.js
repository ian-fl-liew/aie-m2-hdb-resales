// Real LLM provider, talking to any OpenAI-compatible /chat/completions API
// straight from the browser.
//
// ---------------------------------------------------------------------------
// WHY THIS IS NOT POINTED AT GITHUB MODELS
// ---------------------------------------------------------------------------
// GitHub Models was fully retired on 30 July 2026 — the inference API, the
// playground and the model catalogue are all gone, and the endpoint now returns
// HTTP 410. See:
//   https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/
//
// So this provider is written against the OpenAI-compatible shape instead,
// which nearly every option speaks. Set three env vars and it works:
//
//   Ollama (local, free, no key — easiest for a demo):
//     VITE_AI_BASE_URL=http://localhost:11434/v1
//     VITE_AI_MODEL=llama3.1
//     VITE_AI_API_KEY=            (leave blank)
//
//   OpenRouter (hosted, has a free tier):
//     VITE_AI_BASE_URL=https://openrouter.ai/api/v1
//     VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
//     VITE_AI_API_KEY=sk-or-...
//
// ---------------------------------------------------------------------------
// KEY SAFETY — READ THIS BEFORE DEPLOYING
// ---------------------------------------------------------------------------
// Vite compiles every VITE_* variable into the public JS bundle. A key set here
// is readable by anyone who opens devtools on the deployed site. That is
// acceptable for a graded student demo ONLY if you either:
//   (a) use Ollama locally, so there is no key at all; or
//   (b) use a free-tier key you have spend-capped and will rotate after the
//       presentation; or
//   (c) demo with VITE_AI_PROVIDER=mock and deploy without a key.
// The proper fix is a small backend that holds the key and proxies requests.
// That is out of scope for a front-end module, but say so if you are asked —
// knowing the limitation is part of the answer.
// ---------------------------------------------------------------------------

import { AI_BASE_URL, AI_MODEL, AI_API_KEY } from "../../config";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { TOOL_DEFS, runTool } from "./tools";

/** Stop runaway loops if the model keeps asking for tools. */
const MAX_TOOL_ROUNDS = 4;

/**
 * @param {object[]} messages  [{ role, content }]
 * @param {object}   ctx       { listings }
 * @returns {Promise<{ content: string, toolCalls: {name, args, result}[] }>}
 */
export async function sendMessage(messages, ctx) {
  if (!AI_BASE_URL || !AI_MODEL) {
    throw new Error(
      "AI provider is set to 'openai' but VITE_AI_BASE_URL or VITE_AI_MODEL is missing. Check your .env file.",
    );
  }

  // The running transcript we send to the model, including tool results.
  const convo = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const executed = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const reply = await callApi(convo);

    // The model wants to call one or more tools before answering.
    if (reply.tool_calls?.length) {
      convo.push(reply);

      for (const call of reply.tool_calls) {
        // Models occasionally emit malformed JSON arguments; fall back to an
        // empty object rather than failing the whole turn.
        let args;
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }

        const result = await runTool(call.function.name, args, ctx);
        executed.push({ name: call.function.name, args, result });

        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      // Loop again so the model can read the tool results and reply.
      continue;
    }

    return { content: reply.content ?? "", toolCalls: executed };
  }

  return {
    content:
      "I got stuck looking that up. Could you try rephrasing the question?",
    toolCalls: executed,
  };
}

async function callApi(messages) {
  const headers = { "Content-Type": "application/json" };
  // Ollama needs no key; hosted providers do.
  if (AI_API_KEY) headers.Authorization = `Bearer ${AI_API_KEY}`;

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      tools: TOOL_DEFS,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `AI request failed (${response.status}). ${detail.slice(0, 200)}`,
    );
  }

  const body = await response.json();
  const message = body.choices?.[0]?.message;

  if (!message) {
    throw new Error("The AI service returned an unexpected response shape.");
  }

  return message;
}
