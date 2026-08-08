import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

const LANGUAGE_STORAGE_KEY = '@janmitra_language_key';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Brand
    appName: 'JanMitra',
    portalSub: 'Civic Redressal Portal',
    locationUnavailable: 'Location unavailable',
    yourLocation: 'Your Location',

    // Tabs
    tabFeed: 'Feed',
    tabMap: 'Map',
    tabPost: 'Post Issue',
    tabActivity: 'Activity',
    tabProfile: 'Profile',

    // Sort & Filters
    latestIssues: 'Latest Issues',
    nearby: 'Nearby',
    allStatus: 'All Status',
    submitted: 'Submitted',
    inReview: 'In Review',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    escalated: 'Escalated',
    clearAll: 'Clear All',
    applyFilters: 'Apply Filters',
    selectLanguage: 'Select Language',
    trendingNow: 'Trending Now',
    issuesReported: 'issues reported',

    // Categories
    catInfrastructure: 'Infrastructure',
    catSanitation: 'Sanitation',
    catUtilities: 'Utilities',
    catSafety: 'Safety Hazard',
    catAccess: 'Access Barrier',
    catEnvironment: 'Environment',
    catPublicHealth: 'Public Health',
    catOther: 'Other',

    // Badges & Depts
    govOnly: '🏛️ GOV ONLY',
    community: '🤝 COMMUNITY',
    routingDept: 'Routing Dept:',
    deptPublicWorks: 'Public Works',
    deptSanitation: 'Sanitation Dept',
    deptUtilities: 'Utility Services',
    deptSafety: 'Safety Authority',
    deptAccess: 'Disability Affairs',
    deptEnvironment: 'Environment Dept',
    deptHealth: 'Health Dept',
    deptCivicCenter: 'Civic Center',

    // Empty & Connection States
    allClear: 'All Clear! 🎉',
    noIssuesFilter: 'No issues match your filters',
    noIssuesArea: 'No civic issues reported in your area',
    justNow: 'Just now',
    mAgo: 'm ago',
    hAgo: 'h ago',
    dAgo: 'd ago',

    // Actions & Buttons
    postNewIssue: 'Post New Issue',
    submit: 'Submit',
    cancel: 'Cancel',
    tryAgain: 'Try Again',
    viewDetails: 'View Details',
    upvote: 'Upvote',
    comments: 'Comments',
    share: 'Share',
    
    // Notifications & Messages
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications yet',
    connectionError: 'Connection Error',

    // Post Screen
    postTitle: 'Report a Civic Issue',
    postSubTitle: 'Help improve your community by detailing the problem',
    issueTitleLabel: 'Issue Title',
    issueTitlePlaceholder: 'e.g. Broken streetlight on MG Road',
    categoryLabel: 'Category',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Describe the problem in detail...',
    uploadPhoto: 'Upload Photo / Video',
    useCurrentLocation: 'Use Current Location',

    // Profile Screen
    profileTitle: 'Profile',
    officerPortal: 'Officer Portal',
    editProfile: 'Edit Profile',
    privacySecurity: 'Privacy & Security',
    helpSupport: 'Help & Support',
    aboutJanMitra: 'About JanMitra',
    signOut: 'Sign Out',
    postedStats: 'Posted',
    resolvedStats: 'Resolved',

    // Activity Screen
    myComplaints: 'My Complaints',
    trackYourComplaints: 'Track your submitted issues & progress',
    tabMyIssues: 'My Issues',
    tabHelped: 'Helped',
    tabAlerts: 'Notifications',
    noComplaintsYet: 'No Complaints Filed Yet',
    reportProblemPrompt: 'Report a civic problem in your neighborhood to get started',

    // Map Screen
    mapTitle: 'Civic Map',
    findingProblems: 'Finding problems near you...',
    openInMaps: 'Open in Maps',
  },

  hi: {
    // Header & Brand
    appName: 'जनमित्र',
    portalSub: 'नागरिक शिकायत निवारण पोर्टल',
    locationUnavailable: 'स्थान उपलब्ध नहीं है',
    yourLocation: 'आपका स्थान',

    // Tabs
    tabFeed: 'फ़ीड',
    tabMap: 'मानचित्र',
    tabPost: 'समस्या पोस्ट करें',
    tabActivity: 'गतिविधि',
    tabProfile: 'प्रोफ़ाइल',

    // Sort & Filters
    latestIssues: 'नवीनतम समस्याएं',
    nearby: 'पास की',
    allStatus: 'सभी स्थिति',
    submitted: 'दर्ज की गई',
    inReview: 'समीक्षाधीन',
    inProgress: 'प्रगति पर',
    resolved: 'हल की गई',
    escalated: 'उच्च स्तर पर प्रेषित',
    clearAll: 'सभी हटाएं',
    applyFilters: 'फ़िल्टर लागू करें',
    selectLanguage: 'भाषा चुनें',
    trendingNow: 'चर्चित समस्याएं',
    issuesReported: 'समस्याएं दर्ज',

    // Categories
    catInfrastructure: 'बुनियादी ढांचा',
    catSanitation: 'स्वच्छता',
    catUtilities: 'जन सुविधाएं',
    catSafety: 'सुरक्षा खतरा',
    catAccess: 'पहुंच बाधा',
    catEnvironment: 'पर्यावरण',
    catPublicHealth: 'जन स्वास्थ्य',
    catOther: 'अन्य',

    // Badges & Depts
    govOnly: '🏛️ केवल शासन',
    community: '🤝 समुदाय',
    routingDept: 'संबंधित विभाग:',
    deptPublicWorks: 'लोक निर्माण विभाग',
    deptSanitation: 'स्वच्छता विभाग',
    deptUtilities: 'जन सुविधा सेवा',
    deptSafety: 'सुरक्षा प्राधिकरण',
    deptAccess: 'दिव्यांग कल्याण',
    deptEnvironment: 'पर्यावरण विभाग',
    deptHealth: 'स्वास्थ्य विभाग',
    deptCivicCenter: 'नागरिक सुविधा केंद्र',

    // Empty & Connection States
    allClear: 'सब ठीक है! 🎉',
    noIssuesFilter: 'फ़िल्टर के अनुसार कोई समस्या नहीं मिली',
    noIssuesArea: 'आपके क्षेत्र में कोई समस्या दर्ज नहीं है',
    justNow: 'अभी',
    mAgo: 'मिनट पहले',
    hAgo: 'घंटे पहले',
    dAgo: 'दिन पहले',

    // Actions & Buttons
    postNewIssue: 'नई समस्या दर्ज करें',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    tryAgain: 'पुनः प्रयास करें',
    viewDetails: 'विवरण देखें',
    upvote: 'समर्थन करें',
    comments: 'टिप्पणियां',
    share: 'साझा करें',

    // Notifications & Messages
    notifications: 'सूचनाएं',
    markAllRead: 'सभी को पढ़ा हुआ चिन्हित करें',
    noNotifications: 'कोई सूचना नहीं',
    connectionError: 'कनेक्शन त्रुटि',

    // Post Screen
    postTitle: 'नागरिक समस्या दर्ज करें',
    postSubTitle: 'समस्या का विवरण देकर अपने समुदाय को बेहतर बनाएं',
    issueTitleLabel: 'समस्या का शीर्षक',
    issueTitlePlaceholder: 'जैसे एमजी रोड पर टूटी हुई स्ट्रीट लाइट',
    categoryLabel: 'श्रेणी',
    descriptionLabel: 'विवरण',
    descriptionPlaceholder: 'समस्या का विस्तार से वर्णन करें...',
    uploadPhoto: 'फ़ोटो / वीडियो अपलोड करें',
    useCurrentLocation: 'वर्तमान स्थान का उपयोग करें',

    // Profile Screen
    profileTitle: 'प्रोफ़ाइल',
    officerPortal: 'अधिकारी पोर्टल',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    privacySecurity: 'गोपनीयता और सुरक्षा',
    helpSupport: 'सहायता और समर्थन',
    aboutJanMitra: 'जनमित्र के बारे में',
    signOut: 'साइन आउट',
    postedStats: 'दर्ज की गई',
    resolvedStats: 'हल की गई',

    // Activity Screen
    myComplaints: 'मेरी शिकायतें',
    trackYourComplaints: 'अपनी दर्ज शिकायतों और प्रगति को ट्रैक करें',
    tabMyIssues: 'मेरी समस्याएं',
    tabHelped: 'सहायता प्राप्त',
    tabAlerts: 'सूचनाएं',
    noComplaintsYet: 'अभी तक कोई शिकायत दर्ज नहीं की गई',
    reportProblemPrompt: 'शुरू करने के लिए अपने आसपास की समस्या दर्ज करें',

    // Map Screen
    mapTitle: 'नागरिक मानचित्र',
    findingProblems: 'आपके पास की समस्याएं खोजी जा रही हैं...',
    openInMaps: 'मानचित्र में खोलें',
  },

  mr: {
    // Header & Brand
    appName: 'जनमित्र',
    portalSub: 'नागरी तक्रार निवारण पोर्टल',
    locationUnavailable: 'स्थान उपलब्ध नाही',
    yourLocation: 'तुमचे स्थान',

    // Tabs
    tabFeed: 'फीड',
    tabMap: 'नकाशा',
    tabPost: 'समस्या नोंदवा',
    tabActivity: 'उपक्रम',
    tabProfile: 'प्रोफाइल',

    // Sort & Filters
    latestIssues: 'नवीनतम समस्या',
    nearby: 'जवळपासच्या',
    allStatus: 'सर्व स्थिती',
    submitted: 'नोंदवलेली',
    inReview: 'पुनरावलोकनाधीन',
    inProgress: 'प्रगतीपथावर',
    resolved: 'सोडवलेली',
    escalated: 'वरिष्ठांकडे पाठवलेली',
    clearAll: 'सर्व साफ करा',
    applyFilters: 'फिल्टर लागू करा',
    selectLanguage: 'भाषा निवडा',
    trendingNow: 'ट्रेंडिंग समस्या',
    issuesReported: 'समस्या नोंदवल्या',

    // Categories
    catInfrastructure: 'पायाभूत सुविधा',
    catSanitation: 'स्वच्छता',
    catUtilities: 'सार्वजनिक सुविधा',
    catSafety: 'सुरक्षा धोका',
    catAccess: 'प्रवेश अडथळा',
    catEnvironment: 'पर्यावरण',
    catPublicHealth: 'सार्वजनिक आरोग्य',
    catOther: 'इतर',

    // Badges & Depts
    govOnly: '🏛️ फक्त शासन',
    community: '🤝 समुदाय',
    routingDept: 'संबंधित विभाग:',
    deptPublicWorks: 'सार्वजनिक बांधकाम विभाग',
    deptSanitation: 'स्वच्छता विभाग',
    deptUtilities: 'सार्वजनिक सुविधा',
    deptSafety: 'सुरक्षा प्राधिकरण',
    deptAccess: 'दिव्यांग कल्याण',
    deptEnvironment: 'पर्यावरण विभाग',
    deptHealth: 'आरोग्य विभाग',
    deptCivicCenter: 'नागरी केंद्र',

    // Empty & Connection States
    allClear: 'सब काही व्यवस्थित! 🎉',
    noIssuesFilter: 'फिल्टरनुसार कोणतीही समस्या आढळली नाही',
    noIssuesArea: 'तुमच्या भागात कोणतीही तक्रार नोंदवलेली नाही',
    justNow: 'आत्ताच',
    mAgo: 'मिनिटांपूर्वी',
    hAgo: 'तासांपूर्वी',
    dAgo: 'दिवसांपूर्वी',

    // Actions & Buttons
    postNewIssue: 'नवीन समस्या नोंदवा',
    submit: 'सादर करा',
    cancel: 'रद्द करा',
    tryAgain: 'पुन्हा प्रयत्न करा',
    viewDetails: 'तपशील पहा',
    upvote: 'समर्थन द्या',
    comments: 'प्रतिक्रिया',
    share: 'शेअर करा',

    // Notifications & Messages
    notifications: 'सूचना',
    markAllRead: 'सर्व वाचलेले म्हणून चिन्हांकित करा',
    noNotifications: 'कोणतीही सूचना नाही',
    connectionError: 'कनेक्शन त्रुटी',

    // Post Screen
    postTitle: 'नागरी समस्या नोंदवा',
    postSubTitle: 'समस्येचे वर्णन देऊन तुमचा परिसर सुधारण्यास मदत करा',
    issueTitleLabel: 'समस्येचे नाव',
    issueTitlePlaceholder: 'उदा. एमजी रोडवरील खराब पथदिवा',
    categoryLabel: 'वर्ग',
    descriptionLabel: 'तपशील',
    descriptionPlaceholder: 'समस्येचे सविस्तर वर्णन करा...',
    uploadPhoto: 'फोटो / व्हिडिओ अपलोड करा',
    useCurrentLocation: 'सध्याचे स्थान वापरा',

    // Profile Screen
    profileTitle: 'प्रोफाइल',
    officerPortal: 'अधिकारी पोर्टल',
    editProfile: 'प्रोफाइल संपादित करा',
    privacySecurity: 'गोपनीयता आणि सुरक्षितता',
    helpSupport: 'मदत आणि पाठिंबा',
    aboutJanMitra: 'जनमित्र बद्दल',
    signOut: 'साइन आउट',
    postedStats: 'नोंदवलेली',
    resolvedStats: 'सोडवलेली',

    // Activity Screen
    myComplaints: 'माझ्या तक्रारी',
    trackYourComplaints: 'तुमच्या तक्रारी आणि प्रगतीचा मागोवा घ्या',
    tabMyIssues: 'माझ्या समस्या',
    tabHelped: 'मदत लाभलेली',
    tabAlerts: 'सूचना',
    noComplaintsYet: 'अजून कोणतीही तक्रार नोंदवलेली नाही',
    reportProblemPrompt: 'शुरू करण्यासाठी तुमच्या परिसरातील तक्रार नोंदवा',

    // Map Screen
    mapTitle: 'नागरी नकाशा',
    findingProblems: 'तुमच्या जवळील समस्या शोधत आहे...',
    openInMaps: 'नकाशात उघडा',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load persisted language
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((savedLang) => {
        if (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr') {
          setLanguageState(savedLang as Language);
        }
      })
      .catch((err) => console.error('Failed to load language preference:', err));
  }, []);

  const setLanguage = async (newLang: Language) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict[key]) return langDict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
