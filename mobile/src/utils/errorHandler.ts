/**
 * Centralized Error Handler
 * Handles all errors consistently across the app
 */

import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable: boolean;
  userMessage: string;
}

class ErrorHandler {
  // Parse error and determine type
  parseError(error: any): AppError {
    // Network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        type: ErrorType.NETWORK,
        message: error.message,
        originalError: error,
        retryable: true,
        userMessage: 'Network connection issue. Please check your internet and try again.',
      };
    }

    // Auth errors
    if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
      return {
        type: ErrorType.AUTH,
        message: error.message,
        originalError: error,
        retryable: false,
        userMessage: 'Session expired. Please log in again.',
      };
    }

    // Rate limit errors
    if (error.message?.includes('Rate limit') || error.code === '429') {
      return {
        type: ErrorType.RATE_LIMIT,
        message: error.message,
        originalError: error,
        retryable: true,
        userMessage: error.message || 'Too many requests. Please wait a moment and try again.',
      };
    }

    // Database errors
    if (error.code?.startsWith('PGRST') || error.code?.startsWith('23')) {
      return {
        type: ErrorType.DATABASE,
        message: error.message,
        originalError: error,
        retryable: false,
        userMessage: 'Database error. Please try again or contact support.',
      };
    }

    // Validation errors
    if (error.message?.includes('invalid') || error.message?.includes('required')) {
      return {
        type: ErrorType.VALIDATION,
        message: error.message,
        originalError: error,
        retryable: false,
        userMessage: error.message,
      };
    }

    // Permission errors
    if (error.message?.includes('permission') || error.code === 'PGRST116') {
      return {
        type: ErrorType.PERMISSION,
        message: error.message,
        originalError: error,
        retryable: false,
        userMessage: 'You do not have permission to perform this action.',
      };
    }

    // Unknown errors
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Unknown error',
      originalError: error,
      retryable: true,
      userMessage: 'Something went wrong. Please try again.',
    };
  }

  // Handle error with user feedback
  handle(error: any, showAlert: boolean = true): AppError {
    const appError = this.parseError(error);
    
    console.error(`[${appError.type}]`, appError.message, appError.originalError);

    if (showAlert) {
      Alert.alert(
        'Error',
        appError.userMessage,
        [
          { text: 'OK', style: 'default' },
          ...(appError.retryable ? [{ text: 'Retry', style: 'cancel' as const }] : []),
        ]
      );
    }

    return appError;
  }

  // Log error for monitoring
  log(error: AppError, context?: string) {
    const logData = {
      type: error.type,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      retryable: error.retryable,
    };

    console.error('[ERROR LOG]', JSON.stringify(logData, null, 2));
    
    // TODO: Send to error tracking service (Sentry)
    // Sentry.captureException(error.originalError, { extra: logData });
  }
}

export const errorHandler = new ErrorHandler();

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = errorHandler.parseError(error);

      // Don't retry if not retryable
      if (!appError.retryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Safe async wrapper
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  showAlert: boolean = true
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(error, showAlert);
    return fallback;
  }
}

export default errorHandler;
