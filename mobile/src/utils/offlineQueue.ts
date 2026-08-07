/**
 * Offline Queue Manager
 * Queues operations when offline and retries when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkMonitor } from './networkMonitor';
import { STABILITY_CONFIG } from '../config/stability';

interface QueuedOperation {
  id: string;
  type: 'POST_PROBLEM' | 'SEND_MESSAGE' | 'VOTE' | 'HELP_OFFER';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private processing: boolean = false;
  private readonly STORAGE_KEY = '@offline_queue';
  private readonly MAX_QUEUE_SIZE = STABILITY_CONFIG.NETWORK.OFFLINE_QUEUE_SIZE;

  // Initialize queue from storage
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} queued operations`);
      }

      // Listen for network status changes
      networkMonitor.addListener((isOnline) => {
        if (isOnline && this.queue.length > 0) {
          console.log('Back online, processing queue...');
          this.processQueue();
        }
      });
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  // Add operation to queue
  async add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('Queue is full, removing oldest operation');
      this.queue.shift();
    }

    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedOp);
    await this.saveQueue();
    
    console.log(`Added operation to queue: ${queuedOp.type}`);

    // Try to process immediately if online
    if (networkMonitor.getStatus()) {
      this.processQueue();
    }
  }

  // Process queued operations
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && networkMonitor.getStatus()) {
      const operation = this.queue[0];

      try {
        console.log(`Processing queued operation: ${operation.type}`);
        await this.executeOperation(operation);
        
        // Remove from queue on success
        this.queue.shift();
        await this.saveQueue();
        
        console.log(`Successfully processed: ${operation.type}`);
      } catch (error) {
        console.error(`Failed to process operation: ${operation.type}`, error);
        
        operation.retries++;
        
        // Remove if max retries reached
        if (operation.retries >= STABILITY_CONFIG.RETRY.MAX_ATTEMPTS) {
          console.warn(`Max retries reached for: ${operation.type}, removing from queue`);
          this.queue.shift();
          await this.saveQueue();
        } else {
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(operation);
          await this.saveQueue();
          break; // Stop processing for now
        }
      }
    }

    this.processing = false;
  }

  // Execute a queued operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // Import services dynamically to avoid circular dependencies
    const { problemService } = await import('../services/problem.service');
    const { chatService } = await import('../services/chat.service');
    const { voteService } = await import('../services/vote.service');

    switch (operation.type) {
      case 'POST_PROBLEM':
        await problemService.create(operation.data.problemData, operation.data.userId);
        break;
      
      case 'SEND_MESSAGE':
        await chatService.sendMessage(
          operation.data.sessionId,
          operation.data.senderId,
          operation.data.receiverId,
          operation.data.content
        );
        break;
      
      case 'VOTE':
        await voteService.vote(
          operation.data.problemId,
          operation.data.userId,
          operation.data.voteType
        );
        break;
      
      case 'HELP_OFFER':
        await problemService.offerHelp(operation.data.problemId, operation.data.helperId);
        break;
      
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Save queue to storage
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  // Get queue size
  getSize(): number {
    return this.queue.length;
  }

  // Clear queue
  async clear() {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueue();
export default offlineQueue;
