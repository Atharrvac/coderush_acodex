/**
 * Translation Service - Multilingual Support
 * Supports English, Hindi, Marathi
 */

export type Language = 'en' | 'hi' | 'mr';

// Translation dictionaries
const translations = {
  // Form Labels and Placeholders
  submitComplaint: {
    en: 'Submit Complaint',
    hi: 'शिकायत दर्ज करें',
    mr: 'तक्रार नोंदवा'
  },
  selectLanguage: {
    en: 'Select Language',
    hi: 'भाषा चुनें',
    mr: 'भाषा निवडा'
  },
  priorityLevel: {
    en: 'Priority Level',
    hi: 'प्राथमिकता स्तर',
    mr: 'प्राधान्य पातळी'
  },
  addPhotos: {
    en: 'Add Photos',
    hi: 'फोटो जोड़ें',
    mr: 'फोटो जोडा'
  },
  category: {
    en: 'Category',
    hi: 'श्रेणी',
    mr: 'श्रेणी'
  },
  title: {
    en: 'Title',
    hi: 'शीर्षक',
    mr: 'शीर्षक'
  },
  description: {
    en: 'Description',
    hi: 'विवरण',
    mr: 'वर्णन'
  },
  location: {
    en: 'Location',
    hi: 'स्थान',
    mr: 'स्थान'
  },
  
  // Priority Levels
  low: {
    en: 'Low',
    hi: 'कम',
    mr: 'कमी'
  },
  medium: {
    en: 'Medium',
    hi: 'मध्यम',
    mr: 'मध्यम'
  },
  high: {
    en: 'High',
    hi: 'उच्च',
    mr: 'उच्च'
  },
  
  // Categories
  road: {
    en: 'Road',
    hi: 'सड़क',
    mr: 'रस्ता'
  },
  water: {
    en: 'Water',
    hi: 'पानी',
    mr: 'पाणी'
  },
  electricity: {
    en: 'Electricity',
    hi: 'बिजली',
    mr: 'वीज'
  },
  cleanliness: {
    en: 'Cleanliness',
    hi: 'सफाई',
    mr: 'स्वच्छता'
  },
  safety: {
    en: 'Safety',
    hi: 'सुरक्षा',
    mr: 'सुरक्षा'
  },
  help: {
    en: 'Help',
    hi: 'सहायता',
    mr: 'मदत'
  },
  emergency: {
    en: 'Emergency',
    hi: 'आपातकाल',
    mr: 'आणीबाणी'
  },
  other: {
    en: 'Other',
    hi: 'अन्य',
    mr: 'इतर'
  },
  
  // Placeholders
  titlePlaceholder: {
    en: 'Brief title for the problem',
    hi: 'समस्या का संक्षिप्त शीर्षक',
    mr: 'समस्येचे संक्षिप्त शीर्षक'
  },
  descriptionPlaceholder: {
    en: 'Describe the problem in detail...',
    hi: 'समस्या का विस्तार से वर्णन करें...',
    mr: 'समस्येचे तपशीलवार वर्णन करा...'
  },
  locationPlaceholder: {
    en: 'Search any place, city, area...',
    hi: 'कोई भी स्थान, शहर, क्षेत्र खोजें...',
    mr: 'कोणतेही ठिकाण, शहर, क्षेत्र शोधा...'
  },
  
  // Buttons
  submitButton: {
    en: 'Submit Complaint',
    hi: 'शिकायत जमा करें',
    mr: 'तक्रार सबमिट करा'
  },
  addPhoto: {
    en: 'Add Photo',
    hi: 'फोटो जोड़ें',
    mr: 'फोटो जोडा'
  },
  takePhoto: {
    en: 'Take Photo',
    hi: 'फोटो लें',
    mr: 'फोटो काढा'
  },
  chooseFromGallery: {
    en: 'Choose from Gallery',
    hi: 'गैलरी से चुनें',
    mr: 'गॅलरीतून निवडा'
  },
  
  // Messages
  missingCategory: {
    en: 'Please select a category',
    hi: 'कृपया एक श्रेणी चुनें',
    mr: 'कृपया एक श्रेणी निवडा'
  },
  missingDescription: {
    en: 'Please describe the problem',
    hi: 'कृपया समस्या का वर्णन करें',
    mr: 'कृपया समस्येचे वर्णन करा'
  },
  missingLocation: {
    en: 'Please add location',
    hi: 'कृपया स्थान जोड़ें',
    mr: 'कृपया स्थान जोडा'
  },
  loginRequired: {
    en: 'Please login to post a problem',
    hi: 'समस्या पोस्ट करने के लिए कृपया लॉगिन करें',
    mr: 'समस्या पोस्ट करण्यासाठी कृपया लॉगिन करा'
  },
  uploadingPhotos: {
    en: 'Uploading Photos...',
    hi: 'फोटो अपलोड हो रहे हैं...',
    mr: 'फोटो अपलोड होत आहेत...'
  },
  posting: {
    en: 'Posting...',
    hi: 'पोस्ट हो रहा है...',
    mr: 'पोस्ट होत आहे...'
  },
  postedSuccessfully: {
    en: 'Posted Successfully! 🎉',
    hi: 'सफलतापूर्वक पोस्ट किया गया! 🎉',
    mr: 'यशस्वीरित्या पोस्ट केले! 🎉'
  },
  successMessage: {
    en: 'Your problem is now visible to everyone nearby!\n\nGovernment officers will review and take action soon.',
    hi: 'आपकी समस्या अब आसपास के सभी लोगों को दिखाई दे रही है!\n\nसरकारी अधिकारी जल्द ही समीक्षा करेंगे और कार्रवाई करेंगे।',
    mr: 'तुमची समस्या आता जवळपासच्या सर्वांना दिसत आहे!\n\nसरकारी अधिकारी लवकरच पुनरावलोकन करून कारवाई करतील।'
  },
  
  // AI Cost Analysis
  aiCostAnalysis: {
    en: '🤖 AI Analyzing Cost...',
    hi: '🤖 AI लागत का विश्लेषण...',
    mr: '🤖 AI खर्चाचे विश्लेषण...'
  },
  aiAnalysisDescription: {
    en: 'Our AI is analyzing your photo to estimate repair costs and materials needed.',
    hi: 'हमारा AI आपकी फोटो का विश्लेषण करके मरम्मत की लागत और आवश्यक सामग्री का अनुमान लगा रहा है।',
    mr: 'आमचे AI तुमच्या फोटोचे विश्लेषण करून दुरुस्तीचा खर्च आणि आवश्यक साहित्याचा अंदाज लावत आहे।'
  },
  aiCostComplete: {
    en: 'AI Cost Analysis Complete!',
    hi: 'AI लागत विश्लेषण पूर्ण!',
    mr: 'AI खर्च विश्लेषण पूर्ण!'
  },
  estimatedCost: {
    en: 'Estimated Repair Cost:',
    hi: 'अनुमानित मरम्मत लागत:',
    mr: 'अंदाजे दुरुस्तीचा खर्च:'
  },
  govOfficersNote: {
    en: 'Government officers can now plan budget and resources accordingly.',
    hi: 'सरकारी अधिकारी अब तदनुसार बजट और संसाधनों की योजना बना सकते हैं।',
    mr: 'सरकारी अधिकारी आता त्यानुसार बजेट आणि संसाधनांचे नियोजन करू शकतात।'
  },
  
  // GovTech Info
  govtechCRM: {
    en: 'GovTech CRM System',
    hi: 'GovTech CRM सिस्टम',
    mr: 'GovTech CRM सिस्टम'
  },
  govtechDescription: {
    en: 'Your complaint will be automatically classified and routed to the relevant department with SLA tracking. Personal details are kept private and redacted from public view to prevent doxxing.',
    hi: 'आपकी शिकायत स्वचालित रूप से वर्गीकृत की जाएगी और SLA ट्रैकिंग के साथ संबंधित विभाग को भेजी जाएगी। व्यक्तिगत विवरण निजी रखे जाते हैं।',
    mr: 'तुमची तक्रार आपोआप वर्गीकृत केली जाईल आणि SLA ट्रॅकिंगसह संबंधित विभागाकडे पाठविली जाईल. वैयक्तिक तपशील खाजगी ठेवले जातात.'
  }
};

export const translationService = {
  // Get translation for a key
  translate: (key: keyof typeof translations, language: Language): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
    return translation[language] || translation.en;
  },

  // Get all translations for a language
  getLanguageTranslations: (language: Language) => {
    const result: Record<string, string> = {};
    Object.keys(translations).forEach(key => {
      const translationKey = key as keyof typeof translations;
      result[key] = translationService.translate(translationKey, language);
    });
    return result;
  },

  // Translate problem categories
  translateCategory: (categoryId: string, language: Language): string => {
    const categoryKey = categoryId as keyof typeof translations;
    return translationService.translate(categoryKey, language);
  },

  // Translate priority levels
  translatePriority: (priority: string, language: Language): string => {
    const priorityKey = priority as keyof typeof translations;
    return translationService.translate(priorityKey, language);
  },

  // Auto-detect language from text (basic implementation)
  detectLanguage: (text: string): Language => {
    // Simple detection based on character sets
    const hindiPattern = /[\u0900-\u097F]/;
    const marathiPattern = /[\u0900-\u097F]/; // Marathi uses same Devanagari script
    
    if (hindiPattern.test(text) || marathiPattern.test(text)) {
      // More sophisticated detection would be needed to distinguish Hindi/Marathi
      return 'hi'; // Default to Hindi for Devanagari script
    }
    
    return 'en'; // Default to English
  },

  // Get language name in native script
  getLanguageName: (language: Language): string => {
    const names = {
      en: 'English',
      hi: 'हिंदी',
      mr: 'मराठी'
    };
    return names[language];
  },

  // Get language flag
  getLanguageFlag: (language: Language): string => {
    const flags = {
      en: '🇺🇸',
      hi: '🇮🇳',
      mr: '🇮🇳'
    };
    return flags[language];
  }
};

export default translationService;