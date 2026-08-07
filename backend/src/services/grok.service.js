/**
 * Grok API Translation Service
 * Uses xAI's Grok API for multilingual translation
 */

const axios = require('axios');

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_API_KEY = process.env.GROK_API_KEY;

// Language mappings
const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi'
};

class GrokService {
  /**
   * Translate text using Grok API
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code (en, hi, mr)
   * @param {string} targetLang - Target language code (en, hi, mr)
   * @returns {Promise<string>} Translated text
   */
  async translate(text, sourceLang, targetLang) {
    try {
      if (!text || !text.trim()) {
        throw new Error('Text is required for translation');
      }

      if (sourceLang === targetLang) {
        return text; // No translation needed
      }

      const sourceLanguage = LANGUAGE_NAMES[sourceLang] || 'English';
      const targetLanguage = LANGUAGE_NAMES[targetLang] || 'English';

      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
Only provide the translation, no explanations or additional text.

Text to translate:
${text}

Translation:`;

      const response = await axios.post(
        GROK_API_URL,
        {
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate text accurately while preserving meaning and context. Only output the translation, nothing else.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const translatedText = response.data.choices[0].message.content.trim();
      return translatedText;
    } catch (error) {
      console.error('Grok translation error:', error.response?.data || error.message);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Translate complaint to English (for government processing)
   * @param {string} text - Complaint text
   * @param {string} sourceLang - Source language
   * @returns {Promise<string>} English translation
   */
  async translateToEnglish(text, sourceLang) {
    if (sourceLang === 'en') {
      return text;
    }
    return await this.translate(text, sourceLang, 'en');
  }

  /**
   * Translate multiple fields
   * @param {Object} fields - Object with text fields to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<Object>} Translated fields
   */
  async translateFields(fields, sourceLang, targetLang) {
    const translated = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.trim()) {
        translated[key] = await this.translate(value, sourceLang, targetLang);
      } else {
        translated[key] = value;
      }
    }
    
    return translated;
  }

  /**
   * Detect language of text (using Grok)
   * @param {string} text - Text to analyze
   * @returns {Promise<string>} Language code (en, hi, mr)
   */
  async detectLanguage(text) {
    try {
      const prompt = `Detect the language of the following text. 
Respond with ONLY one of these codes: en (English), hi (Hindi), mr (Marathi)

Text:
${text}

Language code:`;

      const response = await axios.post(
        GROK_API_URL,
        {
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are a language detection system. Only respond with language codes: en, hi, or mr.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${GROK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const detectedLang = response.data.choices[0].message.content.trim().toLowerCase();
      
      // Validate response
      if (['en', 'hi', 'mr'].includes(detectedLang)) {
        return detectedLang;
      }
      
      // Default to English if detection fails
      return 'en';
    } catch (error) {
      console.error('Language detection error:', error.message);
      return 'en'; // Default to English
    }
  }

  /**
   * Batch translate multiple texts
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<Array<string>>} Array of translated texts
   */
  async batchTranslate(texts, sourceLang, targetLang) {
    const translations = [];
    
    for (const text of texts) {
      try {
        const translated = await this.translate(text, sourceLang, targetLang);
        translations.push(translated);
      } catch (error) {
        console.error(`Batch translation error for text: ${text.substring(0, 50)}...`);
        translations.push(text); // Keep original on error
      }
    }
    
    return translations;
  }

  /**
   * Translate notification message
   * @param {string} message - Notification message
   * @param {string} targetLang - Target language
   * @returns {Promise<string>} Translated message
   */
  async translateNotification(message, targetLang) {
    if (targetLang === 'en') {
      return message;
    }
    return await this.translate(message, 'en', targetLang);
  }

  /**
   * Get supported languages
   * @returns {Array<Object>} Array of supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
    ];
  }
}

module.exports = new GrokService();
