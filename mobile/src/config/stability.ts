/**
 * Stability Configuration
 * Centralized configuration for app stability features
 */

export const STABILITY_CONFIG = {
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    EXPONENTIAL_BACKOFF: true,
  },

  // Timeout configuration
  TIMEOUT: {
    API_REQUEST: 30000, // 30 seconds
    IMAGE_UPLOAD: 60000, // 60 seconds
    REALTIME_CONNECT: 10000, // 10 seconds
  },

  // Cache configuration
  CACHE: {
    PROBLEMS_TTL: 30000, // 30 seconds
    USER_PROFILE_TTL: 300000, // 5 minutes
    HELPER_STATS_TTL: 60000, // 1 minute
  },

  // Pagination configuration
  PAGINATION: {
    PAGE_SIZE: 20,
    PRELOAD_THRESHOLD: 400, // pixels from bottom
  },

  // Real-time configuration
  REALTIME: {
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 2000, // 2 seconds
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    MESSAGE_DEBOUNCE: 300, // 300ms
  },

  // Image configuration
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_WIDTH: 1200,
    COMPRESSION_QUALITY: 0.7,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  },

  // Rate limiting (client-side)
  RATE_LIMIT: {
    POST_PROBLEM: { max: 10, window: 3600000 }, // 10 per hour
    SEND_MESSAGE: { max: 100, window: 60000 }, // 100 per minute
    VOTE: { max: 50, window: 60000 }, // 50 per minute
    HELP_OFFER: { max: 20, window: 3600000 }, // 20 per hour
  },

  // Error handling
  ERROR: {
    SHOW_ALERTS: true,
    LOG_TO_CONSOLE: true,
    SEND_TO_SENTRY: false, // Enable when Sentry is configured
  },

  // Network monitoring
  NETWORK: {
    CHECK_INTERVAL: 5000, // 5 seconds
    OFFLINE_QUEUE_SIZE: 50,
    AUTO_RETRY_ON_RECONNECT: true,
  },
};

export default STABILITY_CONFIG;
