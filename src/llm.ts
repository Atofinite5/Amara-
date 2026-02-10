import { logger } from './telemetry';

export interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMProvider {
  ask(systemPrompt: string, userPrompt: string): Promise<LLMResponse>;
}

// Ollama Implementation
export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async ask(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return {
        content: data.message.content,
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error) {
      logger.error({ error }, 'Ollama LLM call failed');
      throw error;
    }
  }
}

// Mock/Placeholder for Cloud Providers (to satisfy interface but respect "no cloud calls" default)
// If the user configures them, they would work, but default is Ollama.
export class OpenAILikeProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async ask(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
}

// Mock Provider for Testing
class MockProvider implements LLMProvider {
  async ask(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
    // Return a predictable response for the E2E test case
    if (userPrompt.includes('axios')) {
      return {
        content: JSON.stringify({
          path_pattern: "**/*.ts",
          content_pattern: "import axios", // Simplified for test
          event_type: "update",
          negation: false,
          confidence_threshold: 0.9
        }),
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
      };
    }
    // Default mock
    return {
      content: JSON.stringify({
        path_pattern: "**/*",
        event_type: "any",
        negation: false,
        confidence_threshold: 0.5
      }),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }
}

// Factory
export class LLMFactory {
  static create(): LLMProvider {
    if (process.env.NODE_ENV === 'test' || process.env.LLM_PROVIDER === 'mock') {
      return new MockProvider();
    }

    const provider = process.env.LLM_PROVIDER || 'ollama';
    
    switch (provider.toLowerCase()) {
      case 'ollama':
        return new OllamaProvider(
          process.env.OLLAMA_HOST || 'http://localhost:11434',
          process.env.OLLAMA_MODEL || 'llama3'
        );
      case 'claude':
      case 'glm-4':
      case 'kimi':
        // These would use specific adapters or the OpenAILike one if compatible.
        // For now, mapping them to a generic structure or throwing if not configured.
        // Assuming they follow OpenAI format or have specific implementations.
        // Since "no cloud calls" is a constraint, I will warn if these are used.
        logger.warn(`Provider ${provider} selected. Ensure this does not violate 'no cloud calls' policy unless using a local proxy.`);
        return new OpenAILikeProvider(
          process.env.LLM_API_KEY || '',
          process.env.LLM_BASE_URL || '', // User must provide base URL
          process.env.LLM_MODEL || provider
        );
      default:
        logger.info('Defaulting to Ollama provider');
        return new OllamaProvider();
    }
  }
}

export const llm = LLMFactory.create();
