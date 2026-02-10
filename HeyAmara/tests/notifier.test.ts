import { Notifier, NotificationPayload } from '../src/notifier';

// Mock dependencies
jest.mock('../src/telemetry', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('node-notifier', () => ({
  notify: jest.fn(),
}));

describe('Notifier', () => {
  let notifier: Notifier;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    notifier = new Notifier();
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
  });

  it('should queue notifications', async () => {
    const payload: NotificationPayload = { title: 'Test', message: 'Test message' };
    
    await notifier.notify(payload, ['stdout']);
    
    // Advance timers to process the queue
    jest.advanceTimersByTime(200);
    
    // Check that notification was logged to console
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ type: 'NOTIFICATION', ...payload }));
  });

  it('should respect rate limiting', async () => {
    const payload1: NotificationPayload = { title: 'Test 1', message: 'Test message 1' };
    const payload2: NotificationPayload = { title: 'Test 2', message: 'Test message 2' };
    
    // Send two notifications rapidly
    await notifier.notify(payload1, ['stdout']);
    await notifier.notify(payload2, ['stdout']);
    
    // Advance time by 150ms (just past the 100ms interval but within rate limit)
    jest.advanceTimersByTime(150);
    
    // Only the first should be processed due to rate limiting
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ type: 'NOTIFICATION', ...payload1 }));
    
    // Advance time past the rate limit window
    jest.advanceTimersByTime(1000);
    
    // Now the second should be processed
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ type: 'NOTIFICATION', ...payload2 }));
  });
});