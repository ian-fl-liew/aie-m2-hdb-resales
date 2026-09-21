// Picks the AI provider. Everything else in the app imports from here, so
// swapping providers never touches a component.

import { AI_PROVIDER } from "../../config";
import * as mockProvider from "./mockProvider";
import * as openAICompatProvider from "./openAICompatProvider";

const providers = {
  mock: mockProvider,
  openai: openAICompatProvider,
};

/** True when we are running the scripted agent rather than a real model. */
export const isMockProvider = AI_PROVIDER === "mock";

/**
 * Send the conversation to the assistant and get a reply.
 *
 * @param {object[]} messages [{ role: "user"|"assistant", content: string }]
 * @param {object}   ctx      { listings } — live data the tools search over
 * @returns {Promise<{ content: string, toolCalls: {name, args, result}[] }>}
 */
export function sendMessage(messages, ctx) {
  const provider = providers[AI_PROVIDER];

  if (!provider) {
    throw new Error(
      `Unknown VITE_AI_PROVIDER "${AI_PROVIDER}". Use "mock" or "openai".`,
    );
  }

  return provider.sendMessage(messages, ctx);
}
