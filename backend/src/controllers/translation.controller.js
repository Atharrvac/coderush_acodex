/**
 * Translation Controller - GovTech CRM
 * API endpoints for multilingual translation
 */

const translationService = require('../services/translation.service');

class TranslationController {
  // Translate text
  async translateText(req, res) {
    try {
      const { text, source_lang, target_lang } = req.body;

      // Validate input
      if (!text || !source_lang || !target_lang) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['text', 'source_lang', 'target_lang']
        });
      }

      if (text.length > 5000) {
        return res.status(400).json({
          error: 'Text too long',
          maxLength: 5000
        });
      }

      const supportedLangs = translationService.getSupportedLanguages().map(l => l.code);
      if (!supportedLangs.includes(source_lang) || !supportedLangs.includes(target_lang)) {
        return res.status(400).json({
          error: 'Unsupported language',
          supportedLanguages: supportedLangs
        });
      }

      const result = await translationService.translateText(text, source_lang, target_lang);

      res.json({
        success: true,
        translation: result
      });

    } catch (error) {
      console.error('Translate text error:', error);
      res.status(500).json({
        error: 'Translation failed',
        message: error.message
      });
    }
  }

  // Detect language
  async detectLanguage(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          error: 'Text is required'
        });
      }

      if (text.length > 1000) {
        return res.status(400).json({
          error: 'Text too long for detection',
          maxLength: 1000
        });
      }

      const languageCode = await translationService.detectLanguage(text);
      const languageName = translationService.getLanguageName(languageCode);

      res.json({
        success: true,
        detection: {
          language_code: languageCode,
          language_name: languageName,
          confidence: 0.8 // Mock confidence score
        }
      });

    } catch (error) {
      console.error('Detect language error:', error);
      res.status(500).json({
        error: 'Language detection failed',
        message: error.message
      });
    }
  }

  // Get supported languages
  async getSupportedLanguages(req, res) {
    try {
      const languages = translationService.getSupportedLanguages();

      res.json({
        success: true,
        languages
      });

    } catch (error) {
      console.error('Get supported languages error:', error);
      res.status(500).json({
        error: 'Failed to fetch supported languages',
        message: error.message
      });
    }
  }

  // Batch translate multiple texts
  async batchTranslate(req, res) {
    try {
      const { texts, source_lang, target_lang } = req.body;

      // Validate input
      if (!Array.isArray(texts) || !source_lang || !target_lang) {
        return res.status(400).json({
          error: 'Invalid input',
          expected: {
            texts: 'array of strings',
            source_lang: 'string',
            target_lang: 'string'
          }
        });
      }

      if (texts.length > 50) {
        return res.status(400).json({
          error: 'Too many texts',
          maxBatchSize: 50
        });
      }

      const result = await translationService.batchTranslate(texts, source_lang, target_lang);

      res.json({
        success: result.success,
        translations: result.translations,
        error: result.error
      });

    } catch (error) {
      console.error('Batch translate error:', error);
      res.status(500).json({
        error: 'Batch translation failed',
        message: error.message
      });
    }
  }

  // Get translation statistics (Admin only)
  async getTranslationStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const stats = await translationService.getTranslationStats();

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Get translation stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch translation statistics',
        message: error.message
      });
    }
  }
}

module.exports = new TranslationController();