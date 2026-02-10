import { SupabasePlugin } from '../../src/plugins/supabasePlugin';

// Mock supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

describe('SupabasePlugin', () => {
  const mockConfig = {
    url: 'https://test.supabase.co',
    key: 'test-key',
  };

  let plugin: SupabasePlugin;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new SupabasePlugin(mockConfig);
    // Access the private client for mocking return values
    mockClient = (plugin as any).client;
  });

  describe('Initialization', () => {
    it('should throw if config is invalid', () => {
      expect(() => new SupabasePlugin({ url: '', key: '' })).toThrow();
    });
  });

  describe('testConnection', () => {
    it('should return true on successful session check', async () => {
      mockClient.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
      const result = await plugin.testConnection();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockClient.auth.getSession.mockResolvedValue({ data: null, error: new Error('Network error') });
      const result = await plugin.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should sign in successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockClient.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await plugin.signIn('test@example.com', 'pass');
      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle sign in failure', async () => {
      const error = new Error('Invalid login');
      mockClient.auth.signInWithPassword.mockResolvedValue({ data: null, error });

      const result = await plugin.signIn('test@example.com', 'pass');
      expect(result.data).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  describe('Database Operations', () => {
    it('should get data successfully', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      // Mock chain: from -> select -> limit -> resolved value
      const mockFrom = mockClient.from();
      mockFrom.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await plugin.getData('test_table');
      expect(result.data).toEqual(mockData);
    });

    it('should handle fetch error', async () => {
      const error = new Error('DB Error');
      const mockFrom = mockClient.from();
      mockFrom.limit.mockResolvedValue({ data: null, error });

      const result = await plugin.getData('test_table');
      expect(result.error).toBe(error);
    });
  });
});
