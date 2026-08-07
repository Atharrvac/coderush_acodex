/**
 * Direct Officer Dashboard Access - For Web Testing
 * Bypasses login for quick testing
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OfficerDirect() {
  useEffect(() => {
    setupDirectAccess();
  }, []);

  const setupDirectAccess = async () => {
    try {
      // Create a demo officer token and user data
      const demoToken = 'demo-officer-token-' + Date.now();
      const demoUser = {
        id: 'demo-officer-123',
        email: 'officer.demo@gov.in',
        name: 'Demo Officer',
        role: 'officer',
        is_active: true
      };

      // Store the demo data
      await AsyncStorage.setItem('userToken', demoToken);
      await AsyncStorage.setItem('userData', JSON.stringify(demoUser));

      // Redirect to officer dashboard
      router.replace('/officer-dashboard');
    } catch (error) {
      console.error('Direct access setup error:', error);
      router.replace('/officer-login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E40AF" />
      <Text style={styles.text}>Setting up Officer Dashboard...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});