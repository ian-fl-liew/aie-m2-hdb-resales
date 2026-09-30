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
import { MAX_REPLY_TOKENS, MAX_TOOL_CALLS_PER_TURN } from "./guards";

/** Stop runaway loops if the model keeps asking for tools. */
const MAX_TOOL_ROUNDS = 4;
/** When the provider is overloaded (503), try once more before giving up. */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


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

  const systemPrompt = ctx.currentListingId
    ? `${SYSTEM_PROMPT}\n\nThe user opened this chat from listing ${ctx.currentListingId}. When they say "this listing" or "this flat", they mean that one`
    : SYSTEM_PROMPT;
    

  // The running transcript we send to the model, including tool results.
  const convo = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const executed = [];

  let usedModel = AI_MODEL;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { message: reply, model } = await callApi(convo);
    usedModel = model;

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

        // Every tool call can fetch transaction data, so cap how many one
        // question may make. Past the cap the model is told to stop.
        const result =
          executed.length < MAX_TOOL_CALLS_PER_TURN
            ? await runTool(call.function.name, args, ctx)
            : {
                error: `Tool call limit (${MAX_TOOL_CALLS_PER_TURN}) reached for this question. Answer with what you have.`,
              };
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

    //return { content: reply.content ?? "", toolCalls: executed };
    return { content: reply.content ?? "", toolCalls: executed, model: usedModel };

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

  const send = () =>
    fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        tools: TOOL_DEFS,
        temperature: 0.3,
        max_tokens: MAX_REPLY_TOKENS,
      }),
    });

  // An overloaded model (503) usually recovers within seconds, so retry
  // before bothering the user.
  let response = await send();
  for (let attempt = 1; attempt < MAX_ATTEMPTS && response.status === 503; attempt++) {
    await wait(RETRY_DELAY_MS);
    response = await send();
  }

  if (response.status === 503) {
    throw new Error(
      "The AI service is busy right now. Please try again in a minute.",
    );
  }

  if (response.status === 429) {
    throw new Error(
      "The AI assistant has hit its usage limit. Please try again later.",
    );
  }
  
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `AI request failed (${response.status}). ${detail.slice(0, 200)}`,
    );
  }

  const body = await response.json();
  // OpenRouter can answer HTTP 200 with an error inside the body (e.g. the
  // upstream model is overloaded), so check for that before reading choices.
  if (body.error) {
    throw new Error(
      `AI service error: ${body.error.message ?? "unknown error"}. Try again in a moment.`,
    );
  }

  const message = body.choices?.[0]?.message;

  if (!message) {
    throw new Error("The AI service returned an unexpected response shape.");
  }

  const model = body.model ?? AI_MODEL;
  console.info(`[AI] reply from ${model}`);
  return { message, model };
}

