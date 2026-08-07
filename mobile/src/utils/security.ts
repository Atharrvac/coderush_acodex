/**
 * Security Utilities for NagrikSeva
 * Input validation and sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
    return (
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !isNaN(lat) &&
        !isNaN(lng)
    );
};

/**
 * Validate image URI
 */
export const isValidImageUri = (uri: string): boolean => {
    return (
        uri.startsWith('file://') ||
        uri.startsWith('content://') ||
        uri.startsWith('http://') ||
        uri.startsWith('https://')
    );
};

/**
 * Content moderation - check for inappropriate content
 */
const BANNED_WORDS = [
    'spam',
    'scam',
    'fraud',
    // Add more banned words as needed
];

export const moderateContent = (
    text: string
): { isClean: boolean; reason?: string } => {
    if (!text || text.trim().length === 0) {
        return { isClean: false, reason: 'Content cannot be empty' };
    }

    const lowerText = text.toLowerCase();

    // Check for banned words
    for (const word of BANNED_WORDS) {
        if (lowerText.includes(word)) {
            return {
                isClean: false,
                reason: 'Content contains inappropriate language',
            };
        }
    }

    // Check for excessive caps (> 70% uppercase)
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const totalLetters = (text.match(/[a-zA-Z]/g) || []).length;
    if (totalLetters > 0 && capsCount / totalLetters > 0.7) {
        return {
            isClean: false,
            reason: 'Please avoid excessive capitalization',
        };
    }

    // Check for excessive special characters
    const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    if (specialChars > text.length * 0.3) {
        return {
            isClean: false,
            reason: 'Content contains too many special characters',
        };
    }

    return { isClean: true };
};

/**
 * Validate problem data before submission
 */
export const validateProblemData = (data: {
    category?: string;
    title?: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.category || data.category.trim().length === 0) {
        errors.push('Please select a category');
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.push('Description must be at least 10 characters');
    }

    if (data.description && data.description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }

    if (!data.address || data.address.trim().length === 0) {
        errors.push('Please provide a location');
    }

    if (
        data.latitude === undefined ||
        data.longitude === undefined ||
        !isValidCoordinates(data.latitude, data.longitude)
    ) {
        errors.push('Invalid location coordinates');
    }

    // Content moderation
    if (data.description) {
        const moderation = moderateContent(data.description);
        if (!moderation.isClean) {
            errors.push(moderation.reason || 'Content validation failed');
        }
    }

    if (data.title) {
        const titleModeration = moderateContent(data.title);
        if (!titleModeration.isClean) {
            errors.push('Title: ' + (titleModeration.reason || 'Validation failed'));
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Rate limiting helper (client-side)
 */
const actionTimestamps: { [key: string]: number[] } = {};

export const checkRateLimit = (
    action: string,
    maxActions: number,
    windowMs: number
): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now();
    const key = action;

    if (!actionTimestamps[key]) {
        actionTimestamps[key] = [];
    }

    // Remove old timestamps outside the window
    actionTimestamps[key] = actionTimestamps[key].filter(
        (timestamp) => now - timestamp < windowMs
    );

    if (actionTimestamps[key].length >= maxActions) {
        const oldestTimestamp = actionTimestamps[key][0];
        const retryAfter = windowMs - (now - oldestTimestamp);
        return { allowed: false, retryAfter };
    }

    actionTimestamps[key].push(now);
    return { allowed: true };
};

/**
 * Secure storage key generation
 */
export const generateSecureKey = (userId: string, key: string): string => {
    return `nagrikseva_${userId}_${key}`;
};
