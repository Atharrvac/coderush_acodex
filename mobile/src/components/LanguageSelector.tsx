/**
 * Language Selector Component - GovTech CRM
 * Supports English, Hindi, Marathi with real translations
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translationService, Language } from '../services/translation.service';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  style?: any;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {translationService.translate('selectLanguage', selectedLanguage)}
      </Text>
      <View style={styles.options}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.option,
              selectedLanguage === lang.code && styles.optionActive,
            ]}
            onPress={() => onLanguageChange(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.name,
                selectedLanguage === lang.code && styles.nameActive,
              ]}
            >
              {translationService.getLanguageName(lang.code)}
            </Text>
            {selectedLanguage === lang.code && (
              <Ionicons name="checkmark-circle" size={18} color="#1E40AF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  nameActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
});