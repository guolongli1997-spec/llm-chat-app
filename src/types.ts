
/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
  /**
   * Binding for the Workers AI API.
   */
  AI: Ai;

  /**
   * Binding for static assets.
   */
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Incoming chat request.
 */
export interface ChatRequest {
  message: string;
  context?: ChatMessage[];
  source?: string;
}

/**
 * AI response.
 */
export interface ChatResponse {
  reply: string;
  source: "cloudflare-workers-ai";
}

/**
 * API error response.
 */
export interface ChatError {
  error: string;
}
