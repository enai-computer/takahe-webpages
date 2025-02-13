import { AiModel } from "../models";

export const API_VERSION = "/v1";

export const INPUT_STYLE_CONFIG = {
  maxHeight: 300,
  initialHeight: 57,
  lineHeight: {
    normal: 27,
    small: 24,
  },
  fontSize: {
    normal: 21,
    small: 18,
  },
} as const;

export const MAX_CONTEXT_MESSAGES_LENGTH = 20;

/**
 * @dev If you are testing this web app
 * without the Enai wrapper around it,
 * set this to `enabled: true`.
 * It will then mock the necessary `window`
 * function calls.
 */
export const MOCK_WEBVIEW_ENV = {
  enabled: true,
  baseUrl: "http://127.0.0.1:8000",
  inspiration:
    "Balancing sweet, salty, sour, bitter, and umami flavors is key to making delicious and memorable dishes.",
  authDetails: {
    userId: "38db32a3-ef9b-40dd-a5fb-cd9ab4776016",
    bearerToken: "test",
  },
  availableModels: [
    {id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "Anthropic's latest model.", token_limit: 75000},
    {id: "gpt-4o", name: "OpenAI GPT-4o", description: "The latest model from OpenAI", token_limit: 28000},
    {id: "o1-preview", name: "OpenAI o1", description: "OpenAI's reasoning model designed to solve hard problems across domains.", token_limit: 0},
  ] as AiModel[],
} as const; 