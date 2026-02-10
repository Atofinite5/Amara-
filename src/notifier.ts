import notifier from 'node-notifier';
import { logger } from './telemetry';
import { v4 as uuidv4 } from 'uuid';

export type NotificationChannel = 'desktop' | 'webhook' | 'stdout';

export interface NotificationPayload {
  title: string;
  message: string;
  rule_id?: string;
  file_path?: string;
}

interface QueuedNotification {
  id: string;
  payload: NotificationPayload;
  attempts: number;
  channels: NotificationChannel[];
  timestamp: number;
}

export class Notifier {
  private queue: QueuedNotification[] = [];
  private processing = false;
  private rateLimitWindow = 1000; // 1 second
  private lastNotificationTime = 0;
  private webhookUrl: string | undefined = process.env.WEBHOOK_URL;

  constructor() {
    this.processQueue();
  }

  async notify(payload: NotificationPayload, channels: NotificationChannel[] = ['desktop', 'stdout']) {
    this.queue.push({
      id: uuidv4(),
      payload,
      attempts: 0,
      channels,
      timestamp: Date.now(),
    });
    // Trigger processing if not already running (managed by loop/interval)
  }

  private async processQueue() {
    setInterval(async () => {
      if (this.queue.length === 0) return;

      const now = Date.now();
      if (now - this.lastNotificationTime < this.rateLimitWindow) {
        return;
      }

      const item = this.queue.shift();
      if (!item) return;

      this.lastNotificationTime = now;
      await this.dispatch(item);

    }, 100); // Check every 100ms
  }

  private async dispatch(item: QueuedNotification) {
    const { payload, channels } = item;

    try {
      if (channels.includes('stdout')) {
        console.log(JSON.stringify({ type: 'NOTIFICATION', ...payload }));
      }

      if (channels.includes('desktop')) {
        notifier.notify({
          title: payload.title,
          message: payload.message,
          sound: true,
        });
      }

      if (channels.includes('webhook') && this.webhookUrl) {
        try {
          await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          logger.error({ err }, 'Webhook notification failed');
          // Retry logic could be added here, pushing back to queue with incremented attempts
          if (item.attempts < 3) {
            item.attempts++;
            this.queue.push(item);
          }
        }
      }
      
      logger.info({ id: item.id, payload }, 'Notification dispatched');
    } catch (error) {
      logger.error({ error, item }, 'Notification dispatch failed');
    }
  }
}

export const notifierService = new Notifier();
