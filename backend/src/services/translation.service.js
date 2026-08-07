/**
 * Translation Service - GovTech CRM
 * Handles multilingual translation using OpenAI API
 */

const OpenAI = require('openai');
const { supabase } = require('../config/supabase');

class TranslationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' }
    ];

    // Mock translations for demo/fallback
    this.mockTranslations = {
      'Road is damaged': {
        hi: 'सड़क क्षतिग्रस्त है',
        mr: 'रस्ता खराब आहे'
      },
      'Water supply issue': {
        hi: 'पानी की आपूर्ति की समस्या',
        mr: 'पाणी पुरवठा समस्या'
      },
      'Electricity problem': {
        hi: 'बिजली की समस्या',
        mr: 'वीज समस्या'
      },
      'Garbage not collected': {
        hi: 'कचरा एकत्र नहीं किया गया',
        mr: 'कचरा गोळा केला नाही'
      },
      'Street light not working': {
        hi: 'स्ट्रीट लाइट काम नहीं कर रही',
        mr: 'रस्त्यावरील दिवा काम करत नाही'
      },
      'Pothole on road': {
        hi: 'सड़क पर गड्ढा',
        mr: 'रस्त्यावर खड्डा'
      },
      'No water supply in my area': {
        hi: 'मेरे क्षेत्र में पानी की आपूर्ति नहीं',
        mr: 'माझ्या भागात पाणी पुरवठा नाही'
      }
    };
  }

  // Translate text using OpenAI
  async translateText(text, sourceLang, targetLang) {
    try {
      // Check cache first
      const cachedTranslation = await this.getCachedTranslation(text, sourceLang, targetLang);
      if (cachedTranslation) {
        return {
          translatedText: cachedTranslation.translated_text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: cachedTranslation.confidence_score || 0.95,
          cached: true
        };
      }

      // If same language, return original
      if (sourceLang === targetLang) {
        return {
          translatedText: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: 1.0
        };
      }

      let translatedText = text;
      let confidence = 0.5;

      // Try OpenAI translation
      if (process.env.OPENAI_API_KEY) {
        try {
          const languageNames = {
            'en': 'English',
            'hi': 'Hindi',
            'mr': 'Marathi'
          };

          const prompt = `Translate the following text from ${languageNames[sourceLang]} to ${languageNames[targetLang]}. 
          This is a civic complaint, so maintain the context and urgency. 
          Only return the translation, no explanations:

          "${text}"`;

          const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a professional translator specializing in civic and government communications. Translate accurately while maintaining the tone and context."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.3
          });

          if (completion.choices && completion.choices[0] && completion.choices[0].message) {
            translatedText = completion.choices[0].message.content.trim();
            confidence = 0.9;
          }
        } catch (openaiError) {
          console.error('OpenAI translation error:', openaiError);
          // Fall back to mock translations
          translatedText = this.getMockTranslation(text, targetLang) || text;
          confidence = 0.7;
        }
      } else {
        // Use mock translations if no API key
        translatedText = this.getMockTranslation(text, targetLang) || text;
        confidence = 0.7;
      }

      // Cache the translation
      await this.cacheTranslation(text, sourceLang, targetLang, translatedText, confidence);

      return {
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence
      };

    } catch (error) {
      console.error('Translation error:', error);
      
      // Return mock translation as fallback
      const mockTranslation = this.getMockTranslation(text, targetLang);
      return {
        translatedText: mockTranslation || text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence: mockTranslation ? 0.6 : 0.1,
        error: 'Translation service unavailable, using fallback'
      };
    }
  }

  // Detect language of text
  async detectLanguage(text) {
    try {
      // Simple heuristic detection
      if (/[\u0900-\u097F]/.test(text)) {
        // Contains Devanagari script (Hindi/Marathi)
        // More sophisticated detection would be needed to distinguish Hindi from Marathi
        if (text.includes('आहे') || text.includes('नाही') || text.includes('माझ्या')) {
          return 'mr'; // Marathi indicators
        }
        return 'hi'; // Default to Hindi for Devanagari
      }
      
      return 'en'; // Default to English
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  // Get supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Get language name
  getLanguageName(code) {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang?.name || 'Unknown';
  }

  // Get cached translation
  async getCachedTranslation(sourceText, sourceLang, targetLang) {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('source_text', sourceText)
        .eq('source_language', sourceLang)
        .eq('target_language', targetLang)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache lookup error:', error);
      return null;
    }
  }

  // Cache translation
  async cacheTranslation(sourceText, sourceLang, targetLang, translatedText, confidence) {
    try {
      await supabase
        .from('translations')
        .upsert({
          source_text: sourceText,
          source_language: sourceLang,
          target_language: targetLang,
          translated_text: translatedText,
          confidence_score: confidence,
          translation_service: 'openai'
        });
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  // Get mock translation for demo
  getMockTranslation(text, targetLang) {
    const mockData = this.mockTranslations[text];
    return mockData ? mockData[targetLang] : null;
  }

  // Batch translate multiple texts
  async batchTranslate(texts, sourceLang, targetLang) {
    try {
      const results = await Promise.all(
        texts.map(text => this.translateText(text, sourceLang, targetLang))
      );

      return {
        success: true,
        translations: results
      };
    } catch (error) {
      console.error('Batch translation error:', error);
      return {
        success: false,
        error: error.message,
        translations: texts.map(text => ({
          translatedText: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          confidence: 0.1,
          error: 'Batch translation failed'
        }))
      };
    }
  }

  // Get translation statistics
  async getTranslationStats() {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('source_language, target_language, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        byLanguagePair: {},
        recent: data.slice(0, 10)
      };

      data.forEach(translation => {
        const pair = `${translation.source_language}-${translation.target_language}`;
        stats.byLanguagePair[pair] = (stats.byLanguagePair[pair] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Translation stats error:', error);
      return {
        total: 0,
        byLanguagePair: {},
        recent: []
      };
    }
  }
}

module.exports = new TranslationService();