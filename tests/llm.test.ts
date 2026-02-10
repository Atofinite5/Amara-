import { OllamaProvider, LLMFactory } from '../src/llm';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LLM Module', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    process.env.LLM_PROVIDER = '';
    process.env.NODE_ENV = 'test';
  });

  describe('Factory', () => {
    it('should return MockProvider when NODE_ENV is test', () => {
      const provider = LLMFactory.create();
      expect(provider.constructor.name).toBe('MockProvider');
    });

    it('should return OllamaProvider by default when not in test', () => {
      process.env.NODE_ENV = 'development';
      const provider = LLMFactory.create();
      expect(provider.constructor.name).toBe('OllamaProvider');
    });
  });

  describe('OllamaProvider', () => {
    const provider = new OllamaProvider('http://localhost:11434', 'llama3');

    it('should call Ollama API correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: { content: '{"foo":"bar"}' },
          prompt_eval_count: 10,
          eval_count: 20,
        }),
      });

      const response = await provider.ask('System', 'User');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: [
            { role: 'system', content: 'System' },
            { role: 'user', content: 'User' },
          ],
          stream: false,
        }),
      });

      expect(response.content).toBe('{"foo":"bar"}');
      expect(response.usage.total_tokens).toBe(30);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(provider.ask('System', 'User')).rejects.toThrow('Ollama API error: Internal Server Error');
    });
  });
});
